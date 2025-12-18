"use client";

import { ChannelIcon } from "@/components/ui/ChannelIcon";
import { SiteLogo } from "@/components/ui/SiteLogo";
import { SelectionRateBadge } from "@/components/ui/SelectionRateBadge";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { events } from "@/lib/analytics";
import type { Campaign } from "@/types/campaign";

interface CampaignCardProps {
  campaign: Campaign;
}

const SiteNameMap: Record<string, string> = {
  reviewnote: "리뷰노트",
  dinnerqueen: "디너의여왕",
  stylec: "스타일씨",
  modan: "모두의체험단",
  chuble: "츄블",
  real_review: "리얼리뷰",
  dinodan: "디노단",
  // 레거시 (비활성화)
  gangnam: "강남맛집",
  reviewplace: "리뷰플레이스",
  seoulouba: "서울오빠",
  modooexperience: "모두의체험단",
  pavlovu: "파블로",
};

const TypeLabelMap: Record<string, string> = {
  visit: "방문",
  delivery: "배송",
  "기자단": "기자단",
};

// 각 사이트별 브랜드 컬러 팔레트 (완전한 클래스명 사용)
interface SiteTheme {
  cardBorder: string;
  cardShadow: string;
  imageBg: string;
  ddayUrgent: string;
  ddayWarning: string;
  categoryTag: string;
  titleHover: string;
  regionText: string;
  bookmarkActive: string;
  bookmarkInactive: string;
}

const SiteThemes: Record<string, SiteTheme> = {
  reviewnote: {
    cardBorder: "border-blue-200/60 group-hover:border-blue-400/80",
    cardShadow: "shadow-blue-100/30 group-hover:shadow-blue-300/50",
    imageBg: "from-blue-50/80 via-blue-50/40 to-blue-50/20",
    ddayUrgent: "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md shadow-blue-200/50",
    ddayWarning: "bg-blue-50 text-blue-700",
    categoryTag: "text-blue-600 bg-blue-50",
    titleHover: "group-hover:text-blue-600",
    regionText: "text-blue-600",
    bookmarkActive: "bg-blue-500 hover:bg-blue-600",
    bookmarkInactive: "bg-blue-50 text-blue-600 hover:bg-blue-500 hover:text-white",
  },
  dinnerqueen: {
    cardBorder: "border-red-200/60 group-hover:border-red-400/80",
    cardShadow: "shadow-red-100/30 group-hover:shadow-red-300/50",
    imageBg: "from-red-50/80 via-amber-50/40 to-red-50/20",
    ddayUrgent: "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md shadow-red-200/50",
    ddayWarning: "bg-amber-50 text-amber-700",
    categoryTag: "text-red-600 bg-red-50",
    titleHover: "group-hover:text-red-600",
    regionText: "text-red-600",
    bookmarkActive: "bg-red-600 hover:bg-red-700",
    bookmarkInactive: "bg-red-50 text-red-600 hover:bg-red-600 hover:text-white",
  },
  stylec: {
    cardBorder: "border-pink-200/60 group-hover:border-pink-400/80",
    cardShadow: "shadow-pink-100/30 group-hover:shadow-pink-300/50",
    imageBg: "from-pink-50/80 via-purple-50/40 to-pink-50/20",
    ddayUrgent: "bg-gradient-to-r from-pink-500 to-pink-600 text-white shadow-md shadow-pink-200/50",
    ddayWarning: "bg-pink-50 text-pink-700",
    categoryTag: "text-pink-600 bg-pink-50",
    titleHover: "group-hover:text-pink-600",
    regionText: "text-pink-600",
    bookmarkActive: "bg-pink-500 hover:bg-pink-600",
    bookmarkInactive: "bg-pink-50 text-pink-600 hover:bg-pink-500 hover:text-white",
  },
  modan: {
    cardBorder: "border-emerald-200/60 group-hover:border-emerald-400/80",
    cardShadow: "shadow-emerald-100/30 group-hover:shadow-emerald-300/50",
    imageBg: "from-emerald-50/80 via-teal-50/40 to-emerald-50/20",
    ddayUrgent: "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-md shadow-emerald-200/50",
    ddayWarning: "bg-emerald-50 text-emerald-700",
    categoryTag: "text-emerald-600 bg-emerald-50",
    titleHover: "group-hover:text-emerald-600",
    regionText: "text-emerald-600",
    bookmarkActive: "bg-emerald-500 hover:bg-emerald-600",
    bookmarkInactive: "bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white",
  },
  chuble: {
    cardBorder: "border-orange-200/60 group-hover:border-orange-400/80",
    cardShadow: "shadow-orange-100/30 group-hover:shadow-orange-300/50",
    imageBg: "from-orange-50/80 via-amber-50/40 to-orange-50/20",
    ddayUrgent: "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md shadow-orange-200/50",
    ddayWarning: "bg-orange-50 text-orange-700",
    categoryTag: "text-orange-600 bg-orange-50",
    titleHover: "group-hover:text-orange-600",
    regionText: "text-orange-600",
    bookmarkActive: "bg-orange-500 hover:bg-orange-600",
    bookmarkInactive: "bg-orange-50 text-orange-600 hover:bg-orange-500 hover:text-white",
  },
  real_review: {
    cardBorder: "border-blue-300/60 group-hover:border-blue-500/80",
    cardShadow: "shadow-blue-200/30 group-hover:shadow-blue-400/50",
    imageBg: "from-blue-50/80 via-indigo-50/40 to-blue-50/20",
    ddayUrgent: "bg-gradient-to-r from-blue-700 to-blue-800 text-white shadow-md shadow-blue-300/50",
    ddayWarning: "bg-blue-50 text-blue-700",
    categoryTag: "text-blue-700 bg-blue-50",
    titleHover: "group-hover:text-blue-700",
    regionText: "text-blue-700",
    bookmarkActive: "bg-blue-700 hover:bg-blue-800",
    bookmarkInactive: "bg-blue-50 text-blue-700 hover:bg-blue-700 hover:text-white",
  },
  dinodan: {
    cardBorder: "border-violet-200/60 group-hover:border-violet-400/80",
    cardShadow: "shadow-violet-100/30 group-hover:shadow-violet-300/50",
    imageBg: "from-violet-50/80 via-purple-50/40 to-violet-50/20",
    ddayUrgent: "bg-gradient-to-r from-violet-600 to-violet-700 text-white shadow-md shadow-violet-200/50",
    ddayWarning: "bg-violet-50 text-violet-700",
    categoryTag: "text-violet-600 bg-violet-50",
    titleHover: "group-hover:text-violet-600",
    regionText: "text-violet-600",
    bookmarkActive: "bg-violet-600 hover:bg-violet-700",
    bookmarkInactive: "bg-violet-50 text-violet-600 hover:bg-violet-600 hover:text-white",
  },
  // 레거시 사이트들
  gangnam: {
    cardBorder: "border-amber-200/60 group-hover:border-amber-400/80",
    cardShadow: "shadow-amber-100/30 group-hover:shadow-amber-300/50",
    imageBg: "from-amber-50/80 via-yellow-50/40 to-amber-50/20",
    ddayUrgent: "bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md shadow-amber-200/50",
    ddayWarning: "bg-amber-50 text-amber-700",
    categoryTag: "text-amber-600 bg-amber-50",
    titleHover: "group-hover:text-amber-600",
    regionText: "text-amber-600",
    bookmarkActive: "bg-amber-500 hover:bg-amber-600",
    bookmarkInactive: "bg-amber-50 text-amber-600 hover:bg-amber-500 hover:text-white",
  },
  reviewplace: {
    cardBorder: "border-purple-200/60 group-hover:border-purple-400/80",
    cardShadow: "shadow-purple-100/30 group-hover:shadow-purple-300/50",
    imageBg: "from-purple-50/80 via-pink-50/40 to-purple-50/20",
    ddayUrgent: "bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-md shadow-purple-200/50",
    ddayWarning: "bg-purple-50 text-purple-700",
    categoryTag: "text-purple-600 bg-purple-50",
    titleHover: "group-hover:text-purple-600",
    regionText: "text-purple-600",
    bookmarkActive: "bg-purple-500 hover:bg-purple-600",
    bookmarkInactive: "bg-purple-50 text-purple-600 hover:bg-purple-500 hover:text-white",
  },
  seoulouba: {
    cardBorder: "border-slate-200/60 group-hover:border-slate-400/80",
    cardShadow: "shadow-slate-100/30 group-hover:shadow-slate-300/50",
    imageBg: "from-slate-50/80 via-gray-50/40 to-slate-50/20",
    ddayUrgent: "bg-gradient-to-r from-slate-600 to-slate-700 text-white shadow-md shadow-slate-200/50",
    ddayWarning: "bg-slate-50 text-slate-700",
    categoryTag: "text-slate-600 bg-slate-50",
    titleHover: "group-hover:text-slate-600",
    regionText: "text-slate-600",
    bookmarkActive: "bg-slate-600 hover:bg-slate-700",
    bookmarkInactive: "bg-slate-50 text-slate-600 hover:bg-slate-600 hover:text-white",
  },
  modooexperience: {
    cardBorder: "border-green-200/60 group-hover:border-green-400/80",
    cardShadow: "shadow-green-100/30 group-hover:shadow-green-300/50",
    imageBg: "from-green-50/80 via-emerald-50/40 to-green-50/20",
    ddayUrgent: "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md shadow-green-200/50",
    ddayWarning: "bg-green-50 text-green-700",
    categoryTag: "text-green-600 bg-green-50",
    titleHover: "group-hover:text-green-600",
    regionText: "text-green-600",
    bookmarkActive: "bg-green-500 hover:bg-green-600",
    bookmarkInactive: "bg-green-50 text-green-600 hover:bg-green-500 hover:text-white",
  },
  pavlovu: {
    cardBorder: "border-rose-200/60 group-hover:border-rose-400/80",
    cardShadow: "shadow-rose-100/30 group-hover:shadow-rose-300/50",
    imageBg: "from-rose-50/80 via-pink-50/40 to-rose-50/20",
    ddayUrgent: "bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-md shadow-rose-200/50",
    ddayWarning: "bg-rose-50 text-rose-700",
    categoryTag: "text-rose-600 bg-rose-50",
    titleHover: "group-hover:text-rose-600",
    regionText: "text-rose-600",
    bookmarkActive: "bg-rose-500 hover:bg-rose-600",
    bookmarkInactive: "bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white",
  },
};

// 기본 테마 (사이트가 매핑되지 않은 경우)
const defaultTheme: SiteTheme = {
  cardBorder: "border-border/50 group-hover:border-primary/50",
  cardShadow: "shadow-primary/10 group-hover:shadow-primary/20",
  imageBg: "from-secondary to-secondary/50",
  ddayUrgent: "bg-gradient-urgent text-white",
  ddayWarning: "bg-amber-100 text-amber-700",
  categoryTag: "text-primary bg-primary/10",
  titleHover: "group-hover:text-primary",
  regionText: "text-primary",
  bookmarkActive: "bg-primary hover:bg-primary/90",
  bookmarkInactive: "bg-secondary text-foreground hover:bg-primary hover:text-white",
};

export function CampaignCard({ campaign }: CampaignCardProps) {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [imageError, setImageError] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkBookmarkStatus = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setIsChecking(false);
          return;
        }

        const response = await fetch(`/api/applications/check?campaign_id=${campaign.id}`);
        if (response.ok) {
          const { application } = await response.json();
          if (application) {
            setIsBookmarked(true);
          }
        }
      } catch (error) {
        console.error("북마크 상태 확인 오류:", error);
      } finally {
        setIsChecking(false);
      }
    };

    checkBookmarkStatus();
  }, [campaign.id, supabase]);

  const handleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login?redirect=/search");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaign_id: campaign.id,
          status: "bookmarked",
        }),
      });

      if (!response.ok) throw new Error("북마크 추가 실패");
      setIsBookmarked(true);
      events.bookmark_add(campaign.id);
    } catch (error: any) {
      alert(error.message || "북마크 추가 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnbookmark = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm("북마크를 해제하시겠습니까?")) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/applications/check?campaign_id=${campaign.id}`);
      if (!response.ok) throw new Error("북마크 정보 조회 실패");

      const { application } = await response.json();
      if (!application) throw new Error("북마크 정보 없음");

      const deleteResponse = await fetch(`/api/applications/${application.id}`, {
        method: "DELETE",
      });

      if (!deleteResponse.ok) throw new Error("북마크 해제 실패");
      setIsBookmarked(false);
      events.bookmark_remove(campaign.id);
    } catch (error: any) {
      alert(error.message || "북마크 해제 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  // 이미지 URL (핫링킹 차단 도메인은 프록시 사용)
  let imageUrl = campaign.thumbnail_url || campaign.image_url;
  if (imageUrl && imageUrl.includes("dq-files.gcdn.ntruss.com")) {
    // 디너의여왕 CDN은 핫링킹 차단 -> wsrv.nl 프록시 사용
    imageUrl = `https://wsrv.nl/?url=${encodeURIComponent(imageUrl)}`;
  }
  const hasValidUrl = campaign.source_url && campaign.source_url.trim() !== "";

  // 지역 정보 (region이 있으면 사용하고, 없으면 location 사용, 그래도 없으면 빈 문자열)
  const regionText = campaign.region || campaign.location || "";

  // 채널 정보 파싱 (쉼표로 구분된 경우 처리)
  let channels = (campaign.channel || "")
    .split(",")
    .map(c => c.trim())
    .filter(c => c.length > 0);

  // Filter out "블로그" if "인스타그램" is present (User request: "Instagram but has Blog icon attached")
  // This handles cases where ReviewPlace or others tag both but Instagram is the primary focus.
  if (channels.some(c => c.includes("인스타그램") || c.includes("인스타"))) {
    channels = channels.filter(c => !c.includes("블로그"));
  }

  // 사이트별 테마 가져오기
  const siteTheme = SiteThemes[campaign.source || ""] || defaultTheme;

  // D-Day 색상 계산 (사이트별 테마 적용)
  const getDdayColor = () => {
    if (!campaign.deadline) return "";
    const match = campaign.deadline.match(/D-(\d+)/);
    if (match) {
      const days = parseInt(match[1]);
      if (days <= 1) return siteTheme.ddayUrgent;
      if (days <= 3) return siteTheme.ddayWarning;
      return "bg-secondary text-muted-foreground";
    }
    return "bg-secondary text-muted-foreground";
  };

  return (
    <div className={`group bg-white rounded-2xl border-2 ${siteTheme.cardBorder} shadow-md ${siteTheme.cardShadow} hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden`}>
      <a
        href={hasValidUrl ? campaign.source_url : undefined}
        target={hasValidUrl ? "_blank" : undefined}
        rel={hasValidUrl ? "noopener noreferrer" : undefined}
        className={hasValidUrl ? "block" : "block cursor-not-allowed opacity-75"}
        onClick={(e) => {
          if (!hasValidUrl) {
            e.preventDefault();
            return;
          }
          events.original_site_click(campaign.id, campaign.source || "");
        }}
      >
        {/* 이미지 */}
        <div className={`relative w-full h-48 bg-gradient-to-br ${siteTheme.imageBg} overflow-hidden`}>
          {imageUrl && !imageError ? (
            <>
              <img
                src={imageUrl}
                alt={campaign.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
                onError={() => {
                  console.error("이미지 로드 실패:", imageUrl);
                  setImageError(true);
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <svg className="w-16 h-16 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}

          {/* D-Day 배지 (이미지 위) */}
          {campaign.deadline && (
            <div className={`absolute top-3 right-3 px-2.5 py-1 rounded-lg text-xs font-bold ${getDdayColor()}`}>
              {campaign.deadline}
            </div>
          )}

          {/* 타입 배지 (이미지 위) */}
          {campaign.type && TypeLabelMap[campaign.type] && (
            <div className="absolute top-3 left-3 px-2.5 py-1 bg-white/90 backdrop-blur-sm rounded-lg text-xs font-semibold text-foreground shadow-sm">
              {TypeLabelMap[campaign.type]}
            </div>
          )}
        </div>

        <div className="p-4">
          {/* 출처 & 채널 아이콘 */}
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <SiteLogo
                site={campaign.source}
                siteName={SiteNameMap[campaign.source] || campaign.source}
                size={20}
              />
              <span className="text-xs text-muted-foreground">
                {SiteNameMap[campaign.source] || campaign.source}
              </span>
            </div>

            {/* 채널 아이콘 표시 */}
            <div className="flex gap-1">
              {channels.map((ch, idx) => (
                <div key={idx} title={ch} className="p-1 bg-secondary rounded-md">
                  <ChannelIcon channel={ch} size={16} />
                </div>
              ))}
            </div>
          </div>

          {/* 제목 */}
          <h3 className={`text-base font-bold text-foreground mb-2 line-clamp-2 ${siteTheme.titleHover} transition-colors`}>
            {regionText && (
              <span className={`${siteTheme.regionText} mr-1`}>[{regionText}]</span>
            )}
            {campaign.title}
          </h3>

          {/* 카테고리 태그 */}
          {campaign.category &&
            !(campaign.source === "seoulouba" && campaign.type === "delivery") &&
            campaign.category !== TypeLabelMap[campaign.type || ""] && (
              <span className={`inline-block text-xs font-medium ${siteTheme.categoryTag} px-2.5 py-1 rounded-lg mb-2`}>
                {campaign.category}
              </span>
            )}

          {/* 선택률 배지 */}
          {campaign.recruit_count != null && campaign.applicant_count != null && (
            <div className="mt-2">
              <SelectionRateBadge
                recruitCount={campaign.recruit_count}
                applicantCount={campaign.applicant_count}
                selectionRate={campaign.selection_rate}
                showProgress={true}
                size="sm"
              />
            </div>
          )}
        </div>
      </a>

      {/* 북마크 버튼 */}
      <div className="px-4 pb-4">
        {isChecking ? (
          <button disabled className="w-full px-3 py-2.5 text-sm bg-secondary text-muted-foreground rounded-xl transition-all">
            확인 중...
          </button>
        ) : isBookmarked ? (
          <button
            onClick={handleUnbookmark}
            disabled={isLoading}
            className={`w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium ${siteTheme.bookmarkActive} text-white rounded-xl hover:shadow-md disabled:opacity-50 transition-all duration-200 active:scale-[0.98]`}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            {isLoading ? "처리 중..." : "북마크됨"}
          </button>
        ) : (
          <button
            onClick={handleBookmark}
            disabled={isLoading}
            className={`w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium ${siteTheme.bookmarkInactive} rounded-xl hover:shadow-sm disabled:opacity-50 transition-all duration-200 active:scale-[0.98]`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            {isLoading ? "처리 중..." : "북마크"}
          </button>
        )}
      </div>
    </div>
  );
}

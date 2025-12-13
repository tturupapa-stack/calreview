"use client";

import { ChannelIcon } from "@/components/ui/ChannelIcon";
import { SiteLogo } from "@/components/ui/SiteLogo";

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

  const imageUrl = campaign.thumbnail_url || campaign.image_url;
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

  return (
    <div className="group bg-white rounded-xl border border-border/50 shadow-sm hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 transition-all duration-300 overflow-hidden">
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
          // 원본 사이트 클릭 추적
          events.original_site_click(campaign.id, campaign.source || "");
        }}
      >
        {/* 이미지 */}
        <div className="relative w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
          {imageUrl && !imageError ? (
            <>
              <img
                src={imageUrl}
                alt={campaign.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                loading="lazy"
                onError={() => {
                  console.error("이미지 로드 실패:", imageUrl);
                  setImageError(true);
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <svg className="w-16 h-16 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </div>

        <div className="p-4">
          {/* 출처 & 채널 아이콘 & 마감일 */}
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-3">
              <SiteLogo
                site={campaign.source}
                siteName={SiteNameMap[campaign.source] || campaign.source}
                size={24}
              />

              {/* 채널 아이콘 표시 */}
              <div className="flex gap-1">
                {channels.map((ch, idx) => (
                  <div key={idx} title={ch}>
                    <ChannelIcon channel={ch} size={18} />
                  </div>
                ))}
              </div>
            </div>

            {campaign.deadline && (
              <span className="text-xs text-gray-500">{campaign.deadline}</span>
            )}
          </div>

          {/* 제목 (지역명 크게 + 제목) */}
          <h3 className="text-base font-semibold text-gray-900 mb-2 line-clamp-2">
            {regionText && (
              <span className="text-lg font-bold text-gray-800 mr-1.5">[{regionText}]</span>
            )}
            {campaign.title}
          </h3>

          {/* 태그 (1: 대분류, 2: 중분류) */}
          <div className="flex flex-wrap gap-2">
            {/* 대분류: Type */}
            {campaign.type && TypeLabelMap[campaign.type] && (
              <span className="text-xs font-medium text-white bg-primary px-2 py-1 rounded">
                {TypeLabelMap[campaign.type]}
              </span>
            )}
            {/* 중분류: Category */}
            {campaign.category &&
              // 서울오빠 배송형이면 카테고리 태그 숨김 (사용자 요청)
              !(campaign.source === "seoulouba" && campaign.type === "delivery") &&
              // 카테고리명과 타입명이 동일하면 숨김 (예: [배송] [배송])
              campaign.category !== TypeLabelMap[campaign.type || ""] && (
                <span className="text-xs text-foreground/80 bg-secondary px-2 py-1 rounded">
                  {campaign.category}
                </span>
              )}
          </div>
        </div>
      </a>

      {/* 북마크 버튼 */}
      <div className="px-4 pb-4">
        {isChecking ? (
          <button disabled className="w-full px-3 py-2 text-sm bg-gray-100 text-gray-400 rounded transition-all">
            확인 중...
          </button>
        ) : isBookmarked ? (
          <button
            onClick={handleUnbookmark}
            disabled={isLoading}
            className="w-full px-3 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 hover:shadow-md hover:shadow-primary/25 disabled:opacity-50 transition-all duration-200 active:scale-95"
          >
            {isLoading ? "처리 중..." : "북마크됨"}
          </button>
        ) : (
          <button
            onClick={handleBookmark}
            disabled={isLoading}
            className="w-full px-3 py-2 text-sm bg-secondary text-foreground rounded-md hover:bg-secondary/80 hover:shadow-sm disabled:opacity-50 transition-all duration-200 active:scale-95"
          >
            {isLoading ? "처리 중..." : "북마크"}
          </button>
        )}
      </div>
    </div>
  );
}

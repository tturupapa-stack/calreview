"use client";

import { useEffect, useState } from "react";
import { CampaignCard } from "@/components/features/CampaignCard";
import { SearchFilters } from "@/components/features/SearchFilters";
import { SmartSearchBar } from "@/components/features/SmartSearchBar";
import { PopularTags } from "@/components/features/PopularTags";
import { SiteLogo } from "@/components/ui/SiteLogo";
import type { Campaign } from "@/types/campaign";

function SitePreviewSection({ siteId, siteName, onMoreClick }: { siteId: string, siteName: string, onMoreClick: (siteId: string) => void }) {
  const [items, setItems] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPreview = async () => {
      try {
        // Parallel fetches to ensure diversity
        const [resFood, resBeauty, resTravel, resLife, resGeneral] = await Promise.all([
          fetch(`/api/campaigns?site_name=${siteId}&category=맛집&limit=1&sort=deadline`),
          fetch(`/api/campaigns?site_name=${siteId}&category=뷰티&limit=1&sort=deadline`),
          fetch(`/api/campaigns?site_name=${siteId}&category=여행&limit=1&sort=deadline`),
          fetch(`/api/campaigns?site_name=${siteId}&category=생활&limit=1&sort=deadline`),
          fetch(`/api/campaigns?site_name=${siteId}&limit=10&sort=deadline`) // Fallback
        ]);

        const getItems = async (res: Response) => res.ok ? (await res.json()).campaigns || [] : [];

        const [food, beauty, travel, life, general] = await Promise.all([
          getItems(resFood),
          getItems(resBeauty),
          getItems(resTravel),
          getItems(resLife),
          getItems(resGeneral)
        ]);

        // Prioritize distinct categories
        const combined: Campaign[] = [];
        const seenIds = new Set<string>();

        const addUnique = (items: Campaign[]) => {
          for (const item of items) {
            if (!seenIds.has(item.id)) {
              combined.push(item);
              seenIds.add(item.id);
              break; // Take only 1 from this specific category fetch
            }
          }
        };

        // 1. Add guaranteed distinct items (if exist)
        addUnique(food);
        addUnique(beauty);
        addUnique(travel);
        addUnique(life);

        // 2. Fill remaining slots from general list (up to 4 total)
        for (const item of general) {
          if (combined.length >= 4) break;
          if (!seenIds.has(item.id)) {
            combined.push(item);
            seenIds.add(item.id);
          }
        }

        setItems(combined);

      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchPreview();
  }, [siteId]);

  if (!loading && items.length === 0) return null;

  return (
    <div className="mb-16">
      <div className="flex justify-between items-center mb-6 pb-3 border-b border-border/50">
        <h2 className="text-2xl font-bold font-heading flex items-center gap-3">
          <SiteLogo site={siteId} size={28} className="mr-1" />
          {siteName}
          <span className="text-xs font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">마감임박</span>
        </h2>
        <button
          onClick={() => onMoreClick(siteId)}
          className="text-sm text-primary hover:text-primary/80 font-medium flex items-center gap-1 transition-colors group"
        >
          더보기
          <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-3 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map(campaign => (
            <CampaignCard key={campaign.id} campaign={campaign} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [smartQuery, setSmartQuery] = useState("");
  const [filters, setFilters] = useState({
    region: "",
    detailedRegion: "",
    category: "",
    type: "",
    channel: "",
    site_name: "",
    sort: "deadline",
  });
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);

  // Check if preview mode (no filters active)
  const isPreviewMode = !smartQuery && !filters.region && !filters.detailedRegion && !filters.category && !filters.type && !filters.channel && !filters.site_name && filters.sort === "deadline";

  useEffect(() => {
    if (!isPreviewMode) {
      setPage(1);
      fetchCampaigns(1);
    } else {
      setIsLoading(false);
    }
  }, [filters, smartQuery, isPreviewMode]);

  const fetchCampaigns = async (pageNum: number, append: boolean = false) => {
    if (append) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
    }

    try {
      const params = new URLSearchParams();

      if (smartQuery) {
        params.append("q", smartQuery);
      } else {
        if (filters.region) params.append("region", filters.region);
        if (filters.detailedRegion) params.append("detailed_region", filters.detailedRegion);
        if (filters.category) params.append("category", filters.category);
        if (filters.type) params.append("type", filters.type);
        if (filters.channel) params.append("channel", filters.channel);
        if (filters.site_name) params.append("site_name", filters.site_name);
      }

      if (filters.sort) params.append("sort", filters.sort);
      params.append("page", pageNum.toString());
      params.append("limit", "50");

      const res = await fetch(`/api/campaigns?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (append) {
          setCampaigns(prev => {
            const existingIds = new Set(prev.map(c => c.id));
            const newCampaigns = (data.campaigns || []).filter((c: Campaign) => !existingIds.has(c.id));
            return [...prev, ...newCampaigns];
          });
        } else {
          setCampaigns(data.campaigns || []);
        }
        setHasMore(data.hasMore || false);
        setTotal(data.total || 0);
      }
    } catch (error) {
      console.error("검색 오류:", error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchCampaigns(nextPage, true);
  };

  const handleMoreClick = (siteId: string) => {
    setFilters(prev => ({ ...prev, site_name: siteId }));
  };

  const handleSmartSearch = (query: string) => {
    setSmartQuery(query);
    if (query) {
      setFilters({
        region: "",
        detailedRegion: "",
        category: "",
        type: "",
        channel: "",
        site_name: "",
        sort: "deadline",
      });
    }
  };

  const handleTagClick = (tag: string) => {
    setSmartQuery(tag);
    setFilters({
      region: "",
      detailedRegion: "",
      category: "",
      type: "",
      channel: "",
      site_name: "",
      sort: "deadline",
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold font-heading mb-2 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          체험단 검색
        </h1>
        <p className="text-muted-foreground">원하는 체험단을 빠르게 찾아보세요</p>
      </div>

      <div className="mb-6">
        <SmartSearchBar onSearch={handleSmartSearch} initialQuery={smartQuery} />
      </div>
      
      <div className="mb-6">
        <PopularTags onTagClick={handleTagClick} />
      </div>

      {!smartQuery && (
        <div className="mb-8">
          <SearchFilters filters={filters} onFiltersChange={setFilters} />
        </div>
      )}

      {isPreviewMode ? (
        // Dashboard View
        <div className="mt-8">
          <SitePreviewSection siteId="seoulouba" siteName="서울오빠" onMoreClick={handleMoreClick} />
          <SitePreviewSection siteId="reviewplace" siteName="리뷰플레이스" onMoreClick={handleMoreClick} />
          <SitePreviewSection siteId="reviewnote" siteName="리뷰노트" onMoreClick={handleMoreClick} />
          <SitePreviewSection siteId="dinnerqueen" siteName="디너의여왕" onMoreClick={handleMoreClick} />
          <SitePreviewSection siteId="modooexperience" siteName="모두의체험단" onMoreClick={handleMoreClick} />
          <SitePreviewSection siteId="pavlovu" siteName="파블로체험단" onMoreClick={handleMoreClick} />
          <SitePreviewSection siteId="gangnam" siteName="강남맛집" onMoreClick={handleMoreClick} />
        </div>
      ) : (
        // List View
        <>
          {isLoading ? (
            <div className="text-center py-16">
              <div className="inline-block w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
              <p className="mt-4 text-muted-foreground">검색 중...</p>
            </div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <p className="text-lg font-medium text-foreground mb-2">검색 결과가 없습니다</p>
              <p className="text-sm text-muted-foreground">다른 검색어나 필터를 시도해보세요</p>
            </div>
          ) : (
            <>
              <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
                <div className="text-sm text-muted-foreground">
                  총 <span className="font-semibold text-foreground">{total}</span>개 중 <span className="font-semibold text-foreground">{campaigns.length}</span>개 표시
                </div>
                {smartQuery && (
                  <button
                    onClick={() => {
                      setSmartQuery("");
                      setFilters({ region: "", detailedRegion: "", category: "", type: "", channel: "", site_name: "", sort: "deadline" });
                    }}
                    className="text-sm text-primary hover:text-primary/80 font-medium transition-colors flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    검색 초기화
                  </button>
                )}
              </div>

              <div className="campaign-grid">
                {campaigns.map((campaign) => (
                  <CampaignCard key={campaign.id} campaign={campaign} />
                ))}
              </div>

              {hasMore && (
                <div className="mt-12 text-center">
                  <button
                    onClick={loadMore}
                    disabled={isLoadingMore}
                    className="px-8 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 hover:shadow-md hover:shadow-primary/25 disabled:opacity-50 transition-all duration-200 active:scale-95"
                  >
                    {isLoadingMore ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        로딩 중...
                      </span>
                    ) : (
                      `더 보기 (${total - campaigns.length}개 남음)`
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CampaignCard } from "@/components/features/CampaignCard";
import { UnifiedSearchBar } from "@/components/features/UnifiedSearchBar";
import { MobileFilterSheet } from "@/components/features/MobileFilterSheet";
import { AdvancedFilters, type Filters } from "@/components/features/AdvancedFilters";
import { PopularTags } from "@/components/features/PopularTags";
import { LazySection } from "@/components/features/LazySection";
import { SiteLogo } from "@/components/ui/SiteLogo";
import type { Campaign } from "@/types/campaign";

function SitePreviewSection({ siteId, siteName, onMoreClick, shouldLoad }: { siteId: string, siteName: string, onMoreClick: (siteId: string) => void, shouldLoad: boolean }) {
  const [items, setItems] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    if (!shouldLoad || hasLoaded) return;

    const fetchPreview = async () => {
      setLoading(true);
      try {
        // 단일 API 호출로 최대 20개 가져와서 클라이언트에서 카테고리별로 선별
        const res = await fetch(`/api/campaigns?site_name=${siteId}&limit=20&sort=deadline`);
        
        if (!res.ok) {
          throw new Error('Failed to fetch campaigns');
        }

        const data = await res.json();
        const allCampaigns: Campaign[] = data.campaigns || [];

        // 카테고리별로 1개씩 선별
        const categoryPriority = ['맛집', '뷰티', '여행', '생활', '식품', '패션', '디지털'];
        const combined: Campaign[] = [];
        const seenIds = new Set<string>();
        const usedCategories = new Set<string>();

        // 우선순위 카테고리부터 선별
        for (const category of categoryPriority) {
          const item = allCampaigns.find(
            (c) => c.category === category && !seenIds.has(c.id)
          );
          if (item) {
            combined.push(item);
            seenIds.add(item.id);
            usedCategories.add(category);
            if (combined.length >= 4) break;
          }
        }

        // 나머지는 아무 카테고리나 채우기
        for (const item of allCampaigns) {
          if (combined.length >= 4) break;
          if (!seenIds.has(item.id)) {
            combined.push(item);
            seenIds.add(item.id);
          }
        }

        setItems(combined);
        setHasLoaded(true);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchPreview();
  }, [siteId, shouldLoad, hasLoaded]);

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

function SearchContent() {
  const searchParams = useSearchParams();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  // URL 파라미터에서 초기 필터 읽기
  const getInitialFilters = (): Filters => {
    const regionParam = searchParams.get("region");
    const regions = regionParam ? regionParam.split(",").map(r => r.trim()).filter(Boolean) : [];
    
    const detailedRegionParam = searchParams.get("detailed_region");
    const detailedRegions = detailedRegionParam ? detailedRegionParam.split(",").map(r => r.trim()).filter(Boolean) : [];
    
    return {
      region: regions,
      detailedRegion: detailedRegions,
      category: searchParams.get("category") || "",
      type: searchParams.get("type") || "",
      channel: searchParams.get("channel") || "",
      site_name: searchParams.get("site_name") || "",
      sort: searchParams.get("sort") || "deadline",
    };
  };
  
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [filters, setFilters] = useState<Filters>(getInitialFilters());
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  // Check if preview mode (no filters active)
  const isPreviewMode = !query && (!filters.region || filters.region.length === 0) && (!filters.detailedRegion || filters.detailedRegion.length === 0) && !filters.category && !filters.type && !filters.channel && !filters.site_name && filters.sort === "deadline";

  useEffect(() => {
    if (!isPreviewMode) {
      setPage(1);
      fetchCampaigns(1);
    } else {
      setIsLoading(false);
    }
  }, [filters, query, isPreviewMode]);

  const fetchCampaigns = async (pageNum: number, append: boolean = false) => {
    if (append) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
    }

    try {
      const params = new URLSearchParams();

      // 자연어 검색어가 있으면 q 파라미터로 전달
      if (query) {
        params.append("q", query);
      }
      
      // 필터 파라미터 추가 (자연어 검색과 함께 사용 가능)
      if (filters.region && filters.region.length > 0) {
        // 다중 지역을 쉼표로 구분하여 전달
        params.append("region", filters.region.join(","));
      }
      if (filters.detailedRegion && filters.detailedRegion.length > 0) {
        // 다중 상세 지역을 쉼표로 구분하여 전달
        params.append("detailed_region", filters.detailedRegion.join(","));
      }
      if (filters.category) params.append("category", filters.category);
      if (filters.type) params.append("type", filters.type);
      if (filters.channel) params.append("channel", filters.channel);
      if (filters.site_name) params.append("site_name", filters.site_name);

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
    setIsFiltersOpen(true);
  };

  const handleUnifiedSearch = (searchQuery: string, searchFilters: Filters) => {
    setQuery(searchQuery);
    setFilters(searchFilters);
  };

  const handleTagClick = (tag: string) => {
    setQuery(tag);
    setFilters({
      region: [],
      detailedRegion: [],
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
        <UnifiedSearchBar 
          onSearch={handleUnifiedSearch} 
          initialQuery={query}
          initialFilters={filters}
        />
      </div>
      
      <div className="mb-6">
        <PopularTags onTagClick={handleTagClick} />
      </div>

      {/* 모바일: 바텀 시트, 데스크톱: 접기/펼치기 */}
      <div className="md:hidden">
        <MobileFilterSheet
          filters={filters}
          onFiltersChange={setFilters}
        />
      </div>
      <div className="hidden md:block">
        <AdvancedFilters
          filters={filters}
          onFiltersChange={setFilters}
          isOpen={isFiltersOpen}
          onToggle={() => setIsFiltersOpen(!isFiltersOpen)}
        />
      </div>

      {isPreviewMode ? (
        // Dashboard View - 활성화된 사이트별 미리보기
        <div className="mt-8">
          <SitePreviewSection siteId="reviewnote" siteName="리뷰노트" onMoreClick={handleMoreClick} shouldLoad={true} />
          <SitePreviewSection siteId="dinnerqueen" siteName="디너의여왕" onMoreClick={handleMoreClick} shouldLoad={true} />
          <SitePreviewSection siteId="modan" siteName="모두의체험단" onMoreClick={handleMoreClick} shouldLoad={true} />
          <SitePreviewSection siteId="stylec" siteName="스타일씨" onMoreClick={handleMoreClick} shouldLoad={true} />
          <SitePreviewSection siteId="real_review" siteName="리얼리뷰" onMoreClick={handleMoreClick} shouldLoad={true} />
          <SitePreviewSection siteId="chuble" siteName="츄블" onMoreClick={handleMoreClick} shouldLoad={true} />
          <SitePreviewSection siteId="dinodan" siteName="디노단" onMoreClick={handleMoreClick} shouldLoad={true} />
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
                {(query || Object.values(filters).some(v => v && v !== "deadline")) && (
                  <button
                    onClick={() => {
                      setQuery("");
                      setFilters({ region: [], detailedRegion: [], category: "", type: "", channel: "", site_name: "", sort: "deadline" });
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

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="text-center py-16">
          <div className="inline-block w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          <p className="mt-4 text-muted-foreground">로딩 중...</p>
        </div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}

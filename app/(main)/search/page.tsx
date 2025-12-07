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
    <div className="mb-12">
      <div className="flex justify-between items-center mb-6 border-b pb-2">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <SiteLogo site={siteId} size={24} className="mr-1" />
          {siteName}
          <span className="text-sm font-normal text-muted-foreground bg-gray-100 px-2 py-0.5 rounded-full">마감임박</span>
        </h2>
        <button
          onClick={() => onMoreClick(siteId)}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center"
        >
          더보기 &gt;
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
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
  const isPreviewMode = !smartQuery && !filters.region && !filters.category && !filters.type && !filters.channel && !filters.site_name && filters.sort === "deadline";

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
      category: "",
      type: "",
      channel: "",
      site_name: "",
      sort: "deadline",
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">체험단 검색</h1>

      <SmartSearchBar onSearch={handleSmartSearch} initialQuery={smartQuery} />
      <PopularTags onTagClick={handleTagClick} />

      {!smartQuery && (
        <SearchFilters filters={filters} onFiltersChange={setFilters} />
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
            <div className="text-center py-12">
              <div className="inline-block w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              <p className="mt-2 text-gray-600">로딩 중...</p>
            </div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-12 text-gray-600">
              검색 결과가 없습니다.
            </div>
          ) : (
            <>
              <div className="mb-4 text-sm text-gray-600">
                총 {total}개 중 {campaigns.length}개 표시
                {smartQuery && (
                  <button
                    onClick={() => {
                      setSmartQuery("");
                      setFilters({ region: "", category: "", type: "", channel: "", site_name: "", sort: "deadline" });
                    }}
                    className="ml-4 text-blue-600 hover:underline"
                  >
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
                <div className="mt-8 text-center">
                  <button
                    onClick={loadMore}
                    disabled={isLoadingMore}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isLoadingMore ? "로딩 중..." : `더 보기 (${total - campaigns.length}개 남음)`}
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

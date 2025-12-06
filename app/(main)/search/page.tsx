"use client";

import { useEffect, useState } from "react";
import { CampaignCard } from "@/components/features/CampaignCard";
import { SearchFilters } from "@/components/features/SearchFilters";
import { SmartSearchBar } from "@/components/features/SmartSearchBar";
import { PopularTags } from "@/components/features/PopularTags";
import type { Campaign } from "@/types/campaign";

export default function SearchPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [smartQuery, setSmartQuery] = useState("");
  const [filters, setFilters] = useState({
    region: "",
    category: "",
    type: "",
    sort: "deadline",
  });
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    setPage(1);
    fetchCampaigns(1);
  }, [filters, smartQuery]);

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
      }
      
      if (filters.sort) params.append("sort", filters.sort);
      params.append("page", pageNum.toString());
      params.append("limit", "50");

      const res = await fetch(`/api/campaigns?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (append) {
          setCampaigns(prev => [...prev, ...(data.campaigns || [])]);
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

  const handleSmartSearch = (query: string) => {
    setSmartQuery(query);
    if (query) {
      setFilters({
        region: "",
        category: "",
        type: "",
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
                  setFilters({ region: "", category: "", type: "", sort: "deadline" });
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
    </div>
  );
}

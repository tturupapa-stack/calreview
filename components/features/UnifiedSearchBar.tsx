"use client";

import { useState, FormEvent, useEffect } from "react";
import { parseSearchQuery, extractFiltersFromQuery } from "@/lib/search-parser";
import { events } from "@/lib/analytics";
import { SearchHint } from "./SearchHint";
import type { Filters } from "./AdvancedFilters";

interface UnifiedSearchBarProps {
  onSearch: (query: string, filters: Filters) => void;
  initialQuery?: string;
  initialFilters?: Filters;
}

export function UnifiedSearchBar({ onSearch, initialQuery = "", initialFilters }: UnifiedSearchBarProps) {
  const [query, setQuery] = useState(initialQuery);
  const [appliedFilters, setAppliedFilters] = useState<Filters>(
    initialFilters || {
      region: [],
      detailedRegion: [],
      category: "",
      type: "",
      channel: "",
      site_name: "",
      sort: "deadline",
    }
  );
  const [filterTags, setFilterTags] = useState<Array<{ key: string; label: string; value: string }>>([]);

  // 필터 태그 업데이트
  useEffect(() => {
    const tags: Array<{ key: string; label: string; value: string }> = [];
    
    if (appliedFilters.region && appliedFilters.region.length > 0) {
      // 다중 지역을 하나의 태그로 표시
      if (appliedFilters.region.length === 1) {
        tags.push({ key: "region", label: "지역", value: appliedFilters.region[0] });
      } else {
        tags.push({ key: "region", label: "지역", value: `${appliedFilters.region.length}개 지역` });
      }
    }
    if (appliedFilters.detailedRegion && appliedFilters.detailedRegion.length > 0) {
      // 다중 상세 지역을 하나의 태그로 표시
      if (appliedFilters.detailedRegion.length === 1) {
        tags.push({ key: "detailedRegion", label: "상세지역", value: appliedFilters.detailedRegion[0] });
      } else {
        tags.push({ key: "detailedRegion", label: "상세지역", value: `${appliedFilters.detailedRegion.length}개 지역` });
      }
    }
    if (appliedFilters.category) {
      tags.push({ key: "category", label: "카테고리", value: appliedFilters.category });
    }
    if (appliedFilters.type) {
      const typeMap: Record<string, string> = {
        visit: "방문형",
        delivery: "배송형",
        reporter: "기자단",
      };
      tags.push({ key: "type", label: "유형", value: typeMap[appliedFilters.type] || appliedFilters.type });
    }
    if (appliedFilters.channel) {
      tags.push({ key: "channel", label: "채널", value: appliedFilters.channel });
    }
    if (appliedFilters.site_name) {
      const siteMap: Record<string, string> = {
        seoulouba: "서울오빠",
        reviewplace: "리뷰플레이스",
        reviewnote: "리뷰노트",
        dinnerqueen: "디너의여왕",
        modooexperience: "모두의체험단",
        pavlovu: "파블로체험단",
        gangnam: "강남맛집",
      };
      tags.push({ key: "site_name", label: "사이트", value: siteMap[appliedFilters.site_name] || appliedFilters.site_name });
    }
    
    setFilterTags(tags);
  }, [appliedFilters]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      // 자연어에서 필터 추출
      const { filters: extractedFilters, cleanQuery } = extractFiltersFromQuery(query);
      
      // 추출된 필터와 기존 필터 병합
      const mergedFilters: Filters = {
        ...appliedFilters,
        ...extractedFilters,
      };
      
      setAppliedFilters(mergedFilters);
      // 검색 이벤트 추적
      events.search(cleanQuery || query.trim(), mergedFilters);
      onSearch(cleanQuery || query.trim(), mergedFilters);
    } else {
      // 검색어가 없으면 필터만으로 검색
      onSearch("", appliedFilters);
    }
  };

  const removeFilterTag = (key: keyof Filters) => {
    const newFilters = { ...appliedFilters };
    if (key === "region") {
      newFilters.region = [];
      newFilters.detailedRegion = [];
    } else if (key === "detailedRegion") {
      newFilters.detailedRegion = [];
    } else {
      (newFilters[key] as string) = "";
    }
    setAppliedFilters(newFilters);
    onSearch(query, newFilters);
  };

  const clearAll = () => {
    setQuery("");
    const emptyFilters: Filters = {
      region: [],
      detailedRegion: [],
      category: "",
      type: "",
      channel: "",
      site_name: "",
      sort: "deadline",
    };
    setAppliedFilters(emptyFilters);
    onSearch("", emptyFilters);
  };

  return (
    <div className="mb-6">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={handleInputChange}
            placeholder="예: 강남 이번주 맛집, 마감임박 서울 뷰티"
            className="w-full rounded-lg border-gray-300 shadow-sm pl-12 pr-4 py-3 text-lg focus:border-blue-500 focus:ring-blue-500"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg
              className="h-6 w-6 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          {(query || filterTags.length > 0) && (
            <button
              type="button"
              onClick={clearAll}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              <svg
                className="h-5 w-5 text-gray-400 hover:text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
        
        {/* 검색 힌트 */}
        <SearchHint query={query} />
        
        {/* 필터 태그 */}
        {filterTags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {filterTags.map((tag) => (
              <span
                key={tag.key}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium"
              >
                <span>{tag.label}: {tag.value}</span>
                <button
                  type="button"
                  onClick={() => removeFilterTag(tag.key as keyof Filters)}
                  className="hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </span>
            ))}
          </div>
        )}
      </form>
    </div>
  );
}


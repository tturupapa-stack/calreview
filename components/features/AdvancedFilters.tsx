"use client";

import { useState } from "react";
import { KOREA_REGIONS } from "@/constants/regions";
import { Button } from "@/components/ui/Button";

export interface Filters {
  region: string;
  detailedRegion: string;
  category: string;
  type: string;
  channel: string;
  site_name: string;
  sort: string;
}

interface AdvancedFiltersProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export function AdvancedFilters({ filters, onFiltersChange, isOpen, onToggle }: AdvancedFiltersProps) {
  const updateFilter = (key: keyof Filters, value: string) => {
    if (key === "region") {
      // 지역 변경 시 상세지역 초기화
      onFiltersChange({ ...filters, region: value, detailedRegion: "" });
    } else {
      onFiltersChange({ ...filters, [key]: value });
    }
  };

  const detailedRegions = filters.region ? KOREA_REGIONS[filters.region] || [] : [];

  // 활성 필터 개수 계산
  const activeFilterCount = [
    filters.region,
    filters.detailedRegion,
    filters.category,
    filters.type,
    filters.channel,
    filters.site_name,
  ].filter(Boolean).length;

  return (
    <div className="mb-6">
      {/* 헤더는 모바일에서 숨김 (MobileFilterSheet에서 별도 처리) */}
      <div className="hidden md:flex items-center justify-between mb-4">
        <Button
          variant="outline"
          onClick={onToggle}
          className="flex items-center gap-2"
        >
          <svg
            className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
          고급 검색
          {activeFilterCount > 0 && (
            <span className="ml-1 px-2 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
              {activeFilterCount}
            </span>
          )}
        </Button>
        {activeFilterCount > 0 && (
          <button
            onClick={() => {
              onFiltersChange({
                region: "",
                detailedRegion: "",
                category: "",
                type: "",
                channel: "",
                site_name: "",
                sort: "deadline",
              });
            }}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            필터 초기화
          </button>
        )}
      </div>

      {isOpen && (
        <div className="md:bg-white md:rounded-lg md:shadow-sm md:p-6 md:border md:border-border/50">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
            {/* 지역 선택 (시/도) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                지역
              </label>
              <select
                value={filters.region}
                onChange={(e) => updateFilter("region", e.target.value)}
                className="w-full rounded-lg border-border/60 bg-white/50 text-sm py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              >
                <option value="">전체</option>
                {Object.keys(KOREA_REGIONS).map((region) => (
                  <option key={region} value={region}>
                    {region}
                  </option>
                ))}
                <option value="배송">배송</option>
              </select>
            </div>

            {/* 상세 지역 선택 (구/군) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                상세 지역
              </label>
              <select
                value={filters.detailedRegion || ""}
                onChange={(e) => updateFilter("detailedRegion", e.target.value)}
                disabled={!filters.region || detailedRegions.length === 0}
                className="w-full rounded-lg border-border/60 bg-white/50 text-sm py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-50 disabled:bg-gray-100"
              >
                <option value="">전체</option>
                {detailedRegions.map((detail) => (
                  <option key={detail} value={detail}>
                    {detail}
                  </option>
                ))}
              </select>
            </div>

            {/* 카테고리 선택 (Pill Buttons) */}
            <div className="col-span-full">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                카테고리
              </label>
              <div className="flex flex-wrap gap-2">
                {["", "맛집", "뷰티", "여행", "생활", "식품", "패션", "디지털", "유아동", "도서", "반려동물", "배송", "문화", "재택", "기타"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => updateFilter("category", cat)}
                    className={`px-3 py-1.5 text-sm font-medium transition-all duration-200 rounded-full border ${filters.category === cat
                      ? "bg-primary text-primary-foreground border-primary shadow-sm ring-2 ring-primary/20 scale-105"
                      : "bg-white text-gray-600 border-border hover:bg-secondary/50 hover:border-border/80 hover:text-foreground"
                      }`}
                  >
                    {cat === "" ? "전체" : cat}
                  </button>
                ))}
              </div>
            </div>

            {/* 유형 선택 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                유형
              </label>
              <select
                value={filters.type}
                onChange={(e) => updateFilter("type", e.target.value)}
                className="w-full rounded-lg border-border/60 bg-white/50 text-sm py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              >
                <option value="">전체</option>
                <option value="visit">방문형</option>
                <option value="delivery">배송형</option>
                <option value="reporter">기자단</option>
              </select>
            </div>

            {/* 채널 선택 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                채널
              </label>
              <select
                value={filters.channel}
                onChange={(e) => updateFilter("channel", e.target.value)}
                className="w-full rounded-lg border-border/60 bg-white/50 text-sm py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              >
                <option value="">전체</option>
                <option value="블로그">블로그</option>
                <option value="인스타">인스타그램</option>
                <option value="유튜브">유튜브</option>
                <option value="릴스">릴스</option>
                <option value="쇼츠">쇼츠</option>
                <option value="틱톡">틱톡</option>
                <option value="클립">클립</option>
              </select>
            </div>

            {/* 사이트 선택 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                사이트
              </label>
              <select
                value={filters.site_name || ""}
                onChange={(e) => updateFilter("site_name", e.target.value)}
                className="w-full rounded-lg border-border/60 bg-white/50 text-sm py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              >
                <option value="">전체</option>
                <option value="seoulouba">서울오빠</option>
                <option value="reviewplace">리뷰플레이스</option>
                <option value="reviewnote">리뷰노트</option>
                <option value="dinnerqueen">디너의여왕</option>
                <option value="modooexperience">모두의체험단</option>
                <option value="pavlovu">파블로체험단</option>
                <option value="gangnam">강남맛집</option>
              </select>
            </div>

            {/* 정렬 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                정렬
              </label>
              <select
                value={filters.sort}
                onChange={(e) => updateFilter("sort", e.target.value)}
                className="w-full rounded-lg border-border/60 bg-white/50 text-sm py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              >
                <option value="deadline">마감임박순</option>
                <option value="latest">최신순</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

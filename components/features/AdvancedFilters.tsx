"use client";

import { useState } from "react";
import { KOREA_REGIONS } from "@/constants/regions";
import { Button } from "@/components/ui/Button";

export interface Filters {
  region: string[];
  detailedRegion: string[];
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
      onFiltersChange({ ...filters, region: value ? [value] : [], detailedRegion: [] });
    } else {
      onFiltersChange({ ...filters, [key]: value });
    }
  };

  const toggleRegion = (region: string) => {
    const currentRegions = filters.region || [];
    const isSelected = currentRegions.includes(region);
    
    let newRegions: string[];
    if (isSelected) {
      // 선택 해제
      newRegions = currentRegions.filter(r => r !== region);
    } else {
      // 선택 추가
      newRegions = [...currentRegions, region];
    }
    
    onFiltersChange({ 
      ...filters, 
      region: newRegions,
      detailedRegion: [] // 지역 변경 시 상세지역 초기화
    });
  };

  const toggleDetailedRegion = (detailedRegion: string) => {
    const currentDetailedRegions = filters.detailedRegion || [];
    const isSelected = currentDetailedRegions.includes(detailedRegion);
    
    let newDetailedRegions: string[];
    if (isSelected) {
      // 선택 해제
      newDetailedRegions = currentDetailedRegions.filter(r => r !== detailedRegion);
    } else {
      // 선택 추가
      newDetailedRegions = [...currentDetailedRegions, detailedRegion];
    }
    
    onFiltersChange({ 
      ...filters, 
      detailedRegion: newDetailedRegions
    });
  };

  const clearAllRegions = () => {
    onFiltersChange({ 
      ...filters, 
      region: [],
      detailedRegion: []
    });
  };

  const clearAllDetailedRegions = () => {
    onFiltersChange({ 
      ...filters, 
      detailedRegion: []
    });
  };

  // 선택된 지역별로 상세 지역 그룹화
  const selectedRegions = filters.region || [];
  const regionGroups = selectedRegions
    .filter(region => region !== "배송" && KOREA_REGIONS[region]) // "배송"은 상세 지역 없음
    .map(region => ({
      region,
      detailedRegions: KOREA_REGIONS[region] || []
    }))
    .filter(group => group.detailedRegions.length > 0);

  // 활성 필터 개수 계산
  const activeFilterCount = [
    ...(filters.region || []),
    ...(filters.detailedRegion || []),
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
                region: [],
                detailedRegion: [],
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
            {/* 지역 선택 (시/도) - 다중 선택 */}
            <div className="col-span-full">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  지역
                  {filters.region && filters.region.length > 0 && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      ({filters.region.length}개 선택됨)
                    </span>
                  )}
                </label>
                {filters.region && filters.region.length > 0 && (
                  <button
                    onClick={clearAllRegions}
                    className="text-xs text-primary hover:text-primary/80 transition-colors"
                  >
                    전체 해제
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {Object.keys(KOREA_REGIONS).map((region) => {
                  const isSelected = filters.region?.includes(region) || false;
                  return (
                    <button
                      key={region}
                      onClick={() => toggleRegion(region)}
                      className={`px-3 py-1.5 text-sm font-medium transition-all duration-200 rounded-full border flex items-center gap-2 ${
                        isSelected
                          ? "bg-primary text-primary-foreground border-primary shadow-sm ring-2 ring-primary/20 scale-105"
                          : "bg-white text-gray-600 border-border hover:bg-secondary/50 hover:border-border/80 hover:text-foreground"
                      }`}
                    >
                      {isSelected && (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      {region}
                    </button>
                  );
                })}
                <button
                  onClick={() => toggleRegion("배송")}
                  className={`px-3 py-1.5 text-sm font-medium transition-all duration-200 rounded-full border flex items-center gap-2 ${
                    filters.region?.includes("배송")
                      ? "bg-primary text-primary-foreground border-primary shadow-sm ring-2 ring-primary/20 scale-105"
                      : "bg-white text-gray-600 border-border hover:bg-secondary/50 hover:border-border/80 hover:text-foreground"
                  }`}
                >
                  {filters.region?.includes("배송") && (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  배송
                </button>
              </div>
            </div>

            {/* 상세 지역 선택 (구/군) - 지역별로 그룹화하여 표시, 다중 선택 */}
            <div className="col-span-full">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  상세 지역
                  {filters.detailedRegion && filters.detailedRegion.length > 0 && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      ({filters.detailedRegion.length}개 선택됨)
                    </span>
                  )}
                </label>
                {filters.detailedRegion && filters.detailedRegion.length > 0 && (
                  <button
                    onClick={clearAllDetailedRegions}
                    className="text-xs text-primary hover:text-primary/80 transition-colors"
                  >
                    전체 해제
                  </button>
                )}
              </div>
              {selectedRegions.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">
                  지역을 먼저 선택해주세요
                </p>
              ) : regionGroups.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">
                  선택된 지역에 상세 지역이 없습니다
                </p>
              ) : (
                <div className="space-y-4">
                  {regionGroups.map((group) => (
                    <div key={group.region} className="border border-border/50 rounded-lg p-4 bg-gray-50/50">
                      <div className="flex items-center gap-2 mb-3">
                        <h4 className="text-sm font-semibold text-gray-800">
                          {group.region}
                        </h4>
                        <span className="text-xs text-muted-foreground">
                          ({group.detailedRegions.length}개)
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {group.detailedRegions.map((detail) => {
                          const isSelected = filters.detailedRegion?.includes(detail) || false;
                          return (
                            <button
                              key={`${group.region}-${detail}`}
                              onClick={() => toggleDetailedRegion(detail)}
                              className={`px-3 py-1.5 text-sm font-medium transition-all duration-200 rounded-full border flex items-center gap-2 ${
                                isSelected
                                  ? "bg-primary text-primary-foreground border-primary shadow-sm ring-2 ring-primary/20 scale-105"
                                  : "bg-white text-gray-600 border-border hover:bg-secondary/50 hover:border-border/80 hover:text-foreground"
                              }`}
                            >
                              {isSelected && (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                              {detail}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
                <option value="stylec">스타일씨</option>
                <option value="modan">모두의체험단</option>
                <option value="myinfluencer">마이인플루언서</option>
                <option value="chuble">츄블</option>
                <option value="real_review">리얼리뷰</option>
                <option value="dinodan">디노단</option>
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


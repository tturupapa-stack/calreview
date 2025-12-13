"use client";

import { useState, useEffect } from "react";
import { AdvancedFilters, type Filters } from "./AdvancedFilters";
import { Button } from "@/components/ui/Button";

interface MobileFilterSheetProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
}

export function MobileFilterSheet({ filters, onFiltersChange }: MobileFilterSheetProps) {
  const [isOpen, setIsOpen] = useState(false);

  // 모바일에서만 표시
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!isMobile) {
    // 데스크톱에서는 AdvancedFilters를 직접 사용
    return (
      <AdvancedFilters
        filters={filters}
        onFiltersChange={onFiltersChange}
        isOpen={isOpen}
        onToggle={() => setIsOpen(!isOpen)}
      />
    );
  }

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
    <>
      <div className="mb-4 md:hidden">
        <Button
          variant="outline"
          onClick={() => setIsOpen(true)}
          className="w-full flex items-center justify-between"
        >
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            필터
            {activeFilterCount > 0 && (
              <span className="px-2 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
                {activeFilterCount}
              </span>
            )}
          </span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </Button>
      </div>

      {/* 바텀 시트 오버레이 */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setIsOpen(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white rounded-t-2xl shadow-2xl max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-border/50 px-4 py-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold">필터</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-muted rounded-full transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-4 pb-6">
              {/* AdvancedFilters의 필터 내용만 표시 (헤더 제외) */}
              <AdvancedFilters
                filters={filters}
                onFiltersChange={onFiltersChange}
                isOpen={true}
                onToggle={() => {}}
              />
              <div className="mt-6 flex gap-3">
                <Button
                  variant="outline"
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
                  className="flex-1"
                >
                  초기화
                </Button>
                <Button
                  onClick={() => setIsOpen(false)}
                  className="flex-1"
                >
                  적용
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

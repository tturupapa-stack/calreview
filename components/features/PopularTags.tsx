"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";

interface PopularTagsProps {
  onTagClick: (query: string) => void;
}

export function PopularTags({ onTagClick }: PopularTagsProps) {
  const [tags, setTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchPopularTags();
  }, []);

  const fetchPopularTags = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        // 로그인하지 않은 경우 인기 검색어 표시 (전체 사용자 기준)
        const { data } = await supabase
          .from("search_history")
          .select("query")
          .order("created_at", { ascending: false })
          .limit(100);

        if (data) {
          // 검색어 빈도 계산
          const queryCounts: Record<string, number> = {};
          data.forEach((item) => {
            const query = item.query.trim();
            if (query) {
              queryCounts[query] = (queryCounts[query] || 0) + 1;
            }
          });

          // 빈도순으로 정렬하여 상위 10개 추출
          const sorted = Object.entries(queryCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .map(([query]) => query);

          setTags(sorted);
        }
      } else {
        // 로그인한 경우 사용자별 자주 찾는 태그
        const { data } = await supabase
          .from("search_history")
          .select("query")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(50);

        if (data) {
          // 사용자별 검색어 빈도 계산
          const queryCounts: Record<string, number> = {};
          data.forEach((item) => {
            const query = item.query.trim();
            if (query) {
              queryCounts[query] = (queryCounts[query] || 0) + 1;
            }
          });

          // 빈도순으로 정렬하여 상위 10개 추출
          const sorted = Object.entries(queryCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .map(([query]) => query);

          setTags(sorted);
        }
      }
    } catch (error) {
      console.error("태그 로딩 오류:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 기본 태그 (검색 기록이 없을 때)
  const defaultTags = [
    "강남 맛집",
    "이번주 마감임박",
    "서울 뷰티",
    "배송형 제품",
    "강원 숙박",
    "마감임박",
    "인스타 뷰티",
    "서울 이번주",
  ];

  if (isLoading) {
    return null;
  }

  const displayTags = tags.length > 0 ? tags : defaultTags;

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <h3 className="text-sm font-medium text-gray-700">
          {tags.length > 0 ? "자주 찾는 태그" : "인기 검색어"}
        </h3>
        <span className="text-xs text-gray-500">(클릭하여 검색)</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {displayTags.map((tag, index) => (
          <button
            key={index}
            onClick={() => onTagClick(tag)}
            className="px-3 py-1.5 text-sm bg-white border border-border rounded-full hover:bg-primary/5 hover:border-primary/30 hover:text-primary transition-colors"
          >
            {tag}
          </button>
        ))}
      </div>
    </div>
  );
}


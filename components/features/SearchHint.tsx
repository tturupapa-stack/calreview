"use client";

import { parseSearchQuery } from "@/lib/search-parser";
import { DEADLINE_DISPLAY_MAP, TYPE_DISPLAY_MAP } from "@/constants/mappings";

interface SearchHintProps {
  query: string;
  onApplyFilters?: () => void;
}

export function SearchHint({ query, onApplyFilters }: SearchHintProps) {
  if (!query.trim()) return null;

  const parsed = parseSearchQuery(query);
  const hasFilters = parsed.region || parsed.category || parsed.deadline || parsed.type || parsed.channel;

  if (!hasFilters) return null;

  const hints: string[] = [];
  if (parsed.region) hints.push(`지역: ${parsed.region}`);
  if (parsed.category) hints.push(`카테고리: ${parsed.category}`);
  if (parsed.deadline) {
    hints.push(`마감일: ${DEADLINE_DISPLAY_MAP[parsed.deadline] || parsed.deadline}`);
  }
  if (parsed.type) {
    hints.push(`유형: ${TYPE_DISPLAY_MAP[parsed.type] || parsed.type}`);
  }
  if (parsed.channel) hints.push(`채널: ${parsed.channel}`);

  return (
    <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
      <span className="text-primary">💡</span>
      <span>
        {hints.join(", ")}을(를) 찾고 계신가요?
      </span>
      {onApplyFilters && (
        <button
          onClick={onApplyFilters}
          className="text-primary hover:text-primary/80 font-medium underline underline-offset-2 transition-colors"
        >
          필터 적용
        </button>
      )}
    </div>
  );
}



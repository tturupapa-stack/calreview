"use client";

import { useState, FormEvent } from "react";
import { parseSearchQuery } from "@/lib/search-parser";
import { DEADLINE_DISPLAY_MAP, TYPE_DISPLAY_MAP } from "@/constants/mappings";

interface SmartSearchBarProps {
  onSearch: (query: string) => void;
  initialQuery?: string;
}

export function SmartSearchBar({ onSearch, initialQuery = "" }: SmartSearchBarProps) {
  const [query, setQuery] = useState(initialQuery);
  const [parsedInfo, setParsedInfo] = useState<string[]>([]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    // 실시간으로 파싱 정보 표시
    if (value.trim()) {
      const parsed = parseSearchQuery(value);
      const info: string[] = [];
      if (parsed.region) info.push(`지역: ${parsed.region}`);
      if (parsed.category) info.push(`카테고리: ${parsed.category}`);
      if (parsed.deadline) {
        info.push(`마감일: ${DEADLINE_DISPLAY_MAP[parsed.deadline] || parsed.deadline}`);
      }
      if (parsed.type) {
        info.push(`유형: ${TYPE_DISPLAY_MAP[parsed.type] || parsed.type}`);
      }
      if (parsed.channel) info.push(`채널: ${parsed.channel}`);
      setParsedInfo(info);
    } else {
      setParsedInfo([]);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  return (
    <div className="mb-6">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={handleInputChange}
            placeholder="예: 강남 이번주 맛집, 마감임박 강원 숙박"
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
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setParsedInfo([]);
                onSearch("");
              }}
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
        {parsedInfo.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2 text-sm text-gray-600">
            {parsedInfo.map((info, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-blue-50 text-blue-700 rounded-md"
              >
                {info}
              </span>
            ))}
          </div>
        )}
      </form>
    </div>
  );
}


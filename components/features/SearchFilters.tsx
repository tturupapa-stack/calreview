"use client";

interface Filters {
  region: string;
  category: string;
  type: string;
  sort: string;
}

interface SearchFiltersProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
}

export function SearchFilters({ filters, onFiltersChange }: SearchFiltersProps) {
  const updateFilter = (key: keyof Filters, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* 지역 선택 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            지역
          </label>
          <select
            value={filters.region}
            onChange={(e) => updateFilter("region", e.target.value)}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">전체</option>
            <option value="서울">서울</option>
            <option value="경기">경기</option>
            <option value="인천">인천</option>
            <option value="강원">강원</option>
            <option value="충남">충남</option>
            <option value="충북">충북</option>
            <option value="전남">전남</option>
            <option value="전북">전북</option>
            <option value="경남">경남</option>
            <option value="경북">경북</option>
            <option value="제주">제주</option>
            <option value="전국">전국</option>
            <option value="배송">배송</option>
          </select>
        </div>

        {/* 카테고리 선택 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            카테고리
          </label>
          <select
            value={filters.category}
            onChange={(e) => updateFilter("category", e.target.value)}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">전체</option>
            <option value="맛집">맛집</option>
            <option value="뷰티">뷰티</option>
            <option value="제품">제품</option>
            <option value="기타">기타</option>
          </select>
        </div>

        {/* 유형 선택 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            유형
          </label>
          <select
            value={filters.type}
            onChange={(e) => updateFilter("type", e.target.value)}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">전체</option>
            <option value="visit">방문형</option>
            <option value="delivery">배송형</option>
            <option value="reporter">기자단</option>
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
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="deadline">마감임박순</option>
            <option value="latest">최신순</option>
          </select>
        </div>
      </div>
    </div>
  );
}


"use client";

interface Filters {
  region: string;
  category: string;
  type: string;
  channel: string;
  site_name: string;
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
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
            <option value="여행">여행</option>
            <option value="생활">생활</option>
            <option value="식품">식품</option>
            <option value="패션">패션</option>
            <option value="디지털">디지털</option>
            <option value="유아동">유아동</option>
            <option value="도서">도서</option>
            <option value="반려동물">반려동물</option>
            <option value="배송">배송</option>
            <option value="문화">문화</option>
            <option value="재택">재택</option>
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

        {/* 채널 선택 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            채널
          </label>
          <select
            value={filters.channel}
            onChange={(e) => updateFilter("channel", e.target.value)}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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


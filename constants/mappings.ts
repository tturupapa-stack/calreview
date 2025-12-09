/**
 * 검색 파서 및 UI에서 사용하는 매핑 상수
 */

// 마감일 키워드 매핑 (파서 결과 -> 표시용 텍스트)
export const DEADLINE_DISPLAY_MAP: Record<string, string> = {
  deadline: "마감임박",
  this_week: "이번주",
  next_week: "다음주",
  this_month: "이번달",
  today: "오늘",
  tomorrow: "내일",
};

// 유형 키워드 매핑 (파서 결과 -> 표시용 텍스트)
export const TYPE_DISPLAY_MAP: Record<string, string> = {
  visit: "방문형",
  delivery: "배송형",
  reporter: "기자단",
};

// 마감일 필터링용 키워드 (표시용 텍스트 -> 파서 결과)
export const DEADLINE_KEYWORDS_MAP: Record<string, string[]> = {
  deadline: ["마감임박"],
  this_week: ["이번주"],
  next_week: ["다음주"],
  this_month: ["이번달"],
  today: ["오늘"],
  tomorrow: ["내일"],
};

// 유형 필터링용 키워드 (표시용 텍스트 -> 파서 결과)
export const TYPE_KEYWORDS_MAP: Record<string, string> = {
  visit: "방문형",
  delivery: "배송형",
  reporter: "기자단",
};

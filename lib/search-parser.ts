/**
 * 자연어 검색 쿼리 파서
 * 
 * 예시:
 * - "강남 이번주 맛집" → { region: "강남", deadline: "이번주", category: "맛집" }
 * - "마감임박 강원 숙박" → { deadline: "마감임박", region: "강원", category: "숙박" }
 */

export interface ParsedSearchQuery {
  region?: string;
  category?: string;
  deadline?: string;
  type?: string;
  channel?: string;
  rawQuery: string;
}

// 시 단위 키워드 (우선 매칭, 정확한 검색을 위해)
// 키: 검색어, 값: 정규화된 시 이름 (데이터베이스에 저장된 형식과 매칭)
const CITY_KEYWORDS: Record<string, string> = {
  // 경기도
  "수원시": "수원",
  "수원": "수원",
  "성남시": "성남",
  "성남": "성남",
  "고양시": "고양",
  "고양": "고양",
  "용인시": "용인",
  "용인": "용인",
  "부천시": "부천",
  "부천": "부천",
  "안산시": "안산",
  "안산": "안산",
  "안양시": "안양",
  "안양": "안양",
  "평택시": "평택",
  "평택": "평택",
  "의정부시": "의정부",
  "의정부": "의정부",
  "오산시": "오산",
  "오산": "오산",
  "화성시": "화성",
  "화성": "화성",
  "시흥시": "시흥",
  "시흥": "시흥",
  "김포시": "김포",
  "김포": "김포",
  "광명시": "광명",
  "광명": "광명",
  "하남시": "하남",
  "하남": "하남",
  "구리시": "구리",
  "구리": "구리",
  "파주시": "파주",
  "파주": "파주",
  "이천시": "이천",
  "이천": "이천",
  "안성시": "안성",
  "안성": "안성",
  "포천시": "포천",
  "포천": "포천",
  "양주시": "양주",
  "양주": "양주",
  "동두천시": "동두천",
  "동두천": "동두천",
  "과천시": "과천",
  "과천": "과천",
  "가평군": "가평",
  "가평": "가평",
  "연천군": "연천",
  "연천": "연천",
  "양평군": "양평",
  "양평": "양평",
  // 서울
  "강남구": "강남",
  "강남": "강남",
  "서초구": "서초",
  "서초": "서초",
  "송파구": "송파",
  "송파": "송파",
  "구로구": "구로",
  "구로": "구로",
  "은평구": "은평",
  "은평": "은평",
  "중구": "중구",
  "마포구": "마포",
  "마포": "마포",
  // 인천
  "미추홀구": "미추홀",
  "미추홀": "미추홀",
  "서구": "서구",
  // 부산
  "부산진구": "부산진",
  "부산진": "부산진",
  "북구": "북구",
  // 대구
  "달서구": "달서",
  "달서": "달서",
  // 강원도
  "강릉시": "강릉",
  "강릉": "강릉",
  // 전라도
  "목포시": "목포",
  "목포": "목포",
  "익산시": "익산",
  "익산": "익산",
  "남원시": "남원",
  "남원": "남원",
  // 경상도
  "창원시": "창원",
  "창원": "창원",
  "양산시": "양산",
  "양산": "양산",
};

// 지역 키워드 매핑 (시 단위가 아닌 경우)
const REGION_KEYWORDS: Record<string, string[]> = {
  "서울": ["서울", "서울시"],
  "경기": ["경기", "경기도"],
  "인천": ["인천", "인천시"],
  "강원": ["강원", "강원도", "춘천", "원주", "속초"],
  "충남": ["충남", "충청남도", "천안", "아산", "당진"],
  "충북": ["충북", "충청북도", "청주", "충주"],
  "전남": ["전남", "전라남도", "여수", "순천"],
  "전북": ["전북", "전라북도", "전주", "군산"],
  "경남": ["경남", "경상남도", "부산", "울산", "진주"],
  "경북": ["경북", "경상북도", "대구", "포항", "구미"],
  "제주": ["제주", "제주도", "서귀포"],
  "전국": ["전국", "전국구"],
  "배송": ["배송", "택배"],
  "홍대": ["홍대", "홍익대"],
};

// 카테고리 키워드 매핑
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  "맛집": ["맛집", "음식", "식당", "카페", "레스토랑", "브런치"],
  "뷰티": ["뷰티", "화장품", "스킨케어", "메이크업", "미용"],
  "제품": ["제품", "상품", "굿즈"],
  "숙박": ["숙박", "호텔", "펜션", "리조트", "모텔"],
  "여행": ["여행", "관광", "투어"],
  "문화": ["문화", "전시", "공연", "영화"],
  "스포츠": ["스포츠", "운동", "피트니스"],
};

// 마감일 키워드 매핑
const DEADLINE_KEYWORDS: Record<string, string> = {
  "마감임박": "deadline",
  "이번주": "this_week",
  "다음주": "next_week",
  "이번달": "this_month",
  "오늘": "today",
  "내일": "tomorrow",
};

// 유형 키워드 매핑
const TYPE_KEYWORDS: Record<string, string> = {
  "방문형": "visit",
  "배송형": "delivery",
  "기자단": "reporter",
};

// 채널 키워드 매핑
const CHANNEL_KEYWORDS: Record<string, string[]> = {
  "블로그": ["블로그", "blog"],
  "인스타": ["인스타", "인스타그램", "instagram", "insta"],
  "릴스": ["릴스", "reels"],
  "유튜브": ["유튜브", "youtube", "yt"],
  "쇼츠": ["쇼츠", "shorts"],
  "틱톡": ["틱톡", "tiktok"],
  "클립": ["클립", "clip"],
};

export function parseSearchQuery(query: string): ParsedSearchQuery {
  const result: ParsedSearchQuery = {
    rawQuery: query,
  };

  const queryLower = query.toLowerCase();
  const words = query.split(/\s+/);

  // 지역 추출 (시 단위 우선 매칭)
  // 1. 시 단위 키워드 먼저 확인 (정확한 매칭)
  // "수원시" -> "수원"으로 변환하여 "경기 수원" 형식도 매칭되도록
  for (const [cityKeyword, normalizedCity] of Object.entries(CITY_KEYWORDS)) {
    // "수원시" 또는 "수원" 모두 매칭
    const keywordLower = cityKeyword.toLowerCase();
    if (
      query.includes(cityKeyword) ||
      queryLower.includes(keywordLower) ||
      query.includes(normalizedCity) ||
      queryLower.includes(normalizedCity.toLowerCase())
    ) {
      // "수원시"를 검색하면 "수원"으로 변환 (데이터는 "경기 수원" 형식)
      result.region = normalizedCity;
      break;
    }
  }

  // 2. 시 단위가 없으면 지역 키워드 확인
  if (!result.region) {
    for (const [region, keywords] of Object.entries(REGION_KEYWORDS)) {
      for (const keyword of keywords) {
        if (query.includes(keyword) || queryLower.includes(keyword.toLowerCase())) {
          result.region = region;
          break;
        }
      }
      if (result.region) break;
    }
  }

  // 카테고리 추출
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (query.includes(keyword) || queryLower.includes(keyword.toLowerCase())) {
        result.category = category;
        break;
      }
    }
    if (result.category) break;
  }

  // 마감일 추출
  for (const [keyword, value] of Object.entries(DEADLINE_KEYWORDS)) {
    if (query.includes(keyword) || queryLower.includes(keyword.toLowerCase())) {
      result.deadline = value;
      break;
    }
  }

  // 유형 추출
  for (const [keyword, value] of Object.entries(TYPE_KEYWORDS)) {
    if (query.includes(keyword) || queryLower.includes(keyword.toLowerCase())) {
      result.type = value;
      break;
    }
  }

  // 채널 추출
  const foundChannels: string[] = [];
  for (const [channel, keywords] of Object.entries(CHANNEL_KEYWORDS)) {
    for (const keyword of keywords) {
      if (query.includes(keyword) || queryLower.includes(keyword.toLowerCase())) {
        if (!foundChannels.includes(channel)) {
          foundChannels.push(channel);
        }
        break;
      }
    }
  }
  if (foundChannels.length > 0) {
    result.channel = foundChannels.join("/");
  }

  return result;
}


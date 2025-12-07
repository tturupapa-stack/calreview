# 스마트 서치 기능 가이드

## 개요

스마트 서치는 자연어로 검색할 수 있는 기능입니다. 사용자가 "강남 이번주 맛집"처럼 자연스러운 문장으로 검색하면, 시스템이 자동으로 지역, 마감일, 카테고리 등을 인식하여 필터링합니다.

## 기능 설명

### 1. 자연어 검색

사용자가 자연어로 검색하면 자동으로 다음 정보를 추출합니다:

- **지역**:
  - **시/도**: 서울, 경기, 인천, 부산, 대구, 광주, 대전 등 (17개 광역자치단체)
  - **구/군 (상세 지역)**: 강남구, 분당구, 해운대구 등 (전국 모든 기초자치단체 지원)
  - **특수 지역**: 전국, 배송
- **카테고리**: 맛집, 뷰티, 제품, 숙박, 여행 등
- **마감일**: 마감임박, 이번주, 다음주, 이번달, 오늘, 내일
- **유형**: 방문형, 배송형, 기자단
- **채널**: 블로그, 인스타, 릴스, 유튜브 등

#### 검색 예시

```
"강남 이번주 맛집"
→ 지역: 강남, 마감일: 이번주, 카테고리: 맛집

"마감임박 강원 숙박"
→ 마감일: 마감임박, 지역: 강원, 카테고리: 숙박

"서울 인스타 뷰티"
→ 지역: 서울, 채널: 인스타, 카테고리: 뷰티

"배송형 제품"
→ 유형: 배송형, 카테고리: 제품
```

### 2. 자주 찾는 태그

사용자가 자주 검색한 키워드를 태그로 표시하여 빠른 재검색을 지원합니다.

- 검색 기록을 기반으로 자주 사용한 키워드 추출
- 검색창 아래에 태그로 표시
- 태그 클릭 시 자동으로 해당 키워드로 검색

## 구현 상태

### 완료된 기능

- ✅ 자연어 검색 파서 (`lib/search-parser.ts`)
  - 지역 키워드 인식
  - 카테고리 키워드 인식
  - 마감일 키워드 인식
  - 유형 키워드 인식
  - 채널 키워드 인식

- ✅ 검색 API 개선 (`app/api/campaigns/route.ts`)
  - 자연어 쿼리 파라미터 (`?q=강남 이번주 맛집`) 처리
  - 파싱된 결과를 기반으로 필터링
  - 마감일 범위 계산 (이번주, 다음주 등)

- ✅ 검색 기록 저장
  - Supabase `search_history` 테이블 생성
  - 사용자별 검색 기록 저장
  - 파싱된 결과도 함께 저장

### 진행 중인 기능

- ⏸️ 자연어 검색 입력 UI
  - 검색창에 자연어 입력 힌트 표시
  - 검색어 자동완성 (선택)

- ⏸️ 자주 찾는 태그 컴포넌트
  - 검색 기록 기반 태그 추출
  - 태그 클릭 시 자동 검색

## 기술 구현

### 자연어 파서

`lib/search-parser.ts`에서 구현:

```typescript
import { parseSearchQuery } from "@/lib/search-parser";

const result = parseSearchQuery("강남 이번주 맛집");
// {
//   region: "강남",
//   deadline: "this_week",
//   category: "맛집",
//   rawQuery: "강남 이번주 맛집"
// }
```

### 검색 API 사용

```typescript
// 자연어 검색
GET /api/campaigns?q=강남 이번주 맛집

// 일반 필터 (기존 방식도 지원)
GET /api/campaigns?region=강남&category=맛집&sort=deadline
```

### 검색 기록 저장

검색 시 자동으로 `search_history` 테이블에 저장됩니다:

```sql
INSERT INTO search_history (
  user_id,
  query,
  parsed_region,
  parsed_category,
  parsed_deadline,
  parsed_type,
  parsed_channel
) VALUES (...);
```

## 데이터베이스 스키마

### search_history 테이블

```sql
CREATE TABLE public.search_history (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  query TEXT NOT NULL,
  parsed_region TEXT,
  parsed_category TEXT,
  parsed_deadline TEXT,
  parsed_type TEXT,
  parsed_channel TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, query, DATE(created_at))
);
```

## 다음 단계

1. **자연어 검색 입력 UI 구현**
   - 검색창에 플레이스홀더 추가 ("예: 강남 이번주 맛집")
   - 검색어 입력 시 실시간 파싱 결과 미리보기

2. **자주 찾는 태그 컴포넌트**
   - 검색 기록 기반 태그 추출 API (`/api/search/tags`)
   - 태그 컴포넌트 UI 구현
   - 태그 클릭 시 검색 실행

3. **검색어 자동완성** (선택)
   - 인기 검색어 제안
   - 검색 기록 기반 자동완성

## 참고 파일

- `lib/search-parser.ts`: 자연어 검색 파서
- `app/api/campaigns/route.ts`: 검색 API (자연어 쿼리 처리)
- `docs/supabase-search-history.sql`: 검색 기록 테이블 스키마


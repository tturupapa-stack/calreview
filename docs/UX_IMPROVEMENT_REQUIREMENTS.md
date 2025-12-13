# UI/UX 개선 개발 요구서

> 작성일: 2025-01-XX  
> 우선순위: P0 (즉시 개선 필요)  
> 예상 총 공수: 3-4주

---

## 목차

1. [검색 UX 개선](#1-검색-ux-개선)
2. [메인페이지 정보 과부하 해결](#2-메인페이지-정보-과부하-해결)
3. [모바일 경험 개선](#3-모바일-경험-개선)
4. [북마크 → 선정 플로우 개선](#4-북마크--선정-플로우-개선)
5. [리뷰 마감일 계산 개선](#5-리뷰-마감일-계산-개선)
6. [구글 캘린더 연동 실용성 향상](#6-구글-캘린더-연동-실용성-향상)
7. [사용자 행동 분석 도입](#7-사용자-행동-분석-도입)
8. [KPI 측정 시스템 구축](#8-kpi-측정-시스템-구축)

---

## 1. 검색 UX 개선

### 1.1 문제 정의

- **현재 문제**:
  - 자연어 검색과 필터 검색이 동시에 노출되어 사용자가 혼란스러움
  - `SmartSearchBar`의 실시간 파싱 정보가 입력 중 계속 변경되어 방해됨
  - 검색 모드 전환이 불명확함

- **영향도**: 높음 (핵심 기능)
- **사용자 불만**: 검색 결과 예측 불가, 필터와 자연어 검색의 충돌

### 1.2 개선안

#### 옵션 A: 통합 검색 모드 (권장)

**개념**: 자연어 검색을 기본으로 하되, 필터는 "고급 검색"으로 접근 가능하게 함

**UI 구조**:
```
[통합 검색창] ← 자연어 + 필터 자동 인식
  ↓
[검색 결과]
  ↓
[필터 접기/펼치기 버튼] ← 클릭 시 필터 패널 표시
```

**구현 사항**:

1. **검색창 통합**
   - 자연어 검색과 필터를 하나의 검색창에서 처리
   - 입력 시 자동으로 자연어 파싱 + 필터 추출
   - 필터는 검색창 하단에 태그 형태로 표시 (제거 가능)

2. **실시간 파싱 정보 개선**
   - 입력 중 파싱 정보를 즉시 표시하지 않음
   - 대신 검색창 하단에 "검색 힌트" 형태로 제안만 표시
   - 예: "💡 '강남 맛집'을 찾고 계신가요? → [필터 적용]"

3. **필터 접근성 개선**
   - 기본: 필터 숨김
   - "고급 검색" 버튼 클릭 시 필터 패널 슬라이드 다운
   - 필터 적용 시 검색창에 태그로 표시

**기술 구현**:

```typescript
// components/features/UnifiedSearchBar.tsx
interface UnifiedSearchBarProps {
  onSearch: (query: string, filters: SearchFilters) => void;
}

// 검색 모드 상태 관리
const [searchMode, setSearchMode] = useState<'simple' | 'advanced'>('simple');
const [parsedFilters, setParsedFilters] = useState<SearchFilters>({});

// 자연어 파싱 + 필터 추출
const handleSearch = (query: string) => {
  const parsed = parseSearchQuery(query);
  const filters = extractFilters(parsed);
  
  // 자연어 부분만 검색어로, 나머지는 필터로
  const cleanQuery = removeFilterKeywords(query);
  
  onSearch(cleanQuery, filters);
};
```

**파일 구조**:
```
components/features/
  ├── UnifiedSearchBar.tsx (신규)
  ├── SearchHint.tsx (신규, 파싱 힌트 표시)
  └── AdvancedFilters.tsx (기존 SearchFilters 리팩토링)
```

#### 옵션 B: 검색 모드 전환 (대안)

**개념**: 명확한 모드 전환 버튼 제공

**UI 구조**:
```
[검색 모드 선택]
  [자연어 검색] [필터 검색] ← 탭 전환

[선택된 모드에 따른 UI]
```

### 1.3 개발 작업

| 작업 | 파일 | 예상 공수 | 우선순위 |
|------|------|----------|---------|
| UnifiedSearchBar 컴포넌트 개발 | `components/features/UnifiedSearchBar.tsx` | 1일 | P0 |
| SearchHint 컴포넌트 개발 | `components/features/SearchHint.tsx` | 0.5일 | P0 |
| AdvancedFilters 리팩토링 | `components/features/AdvancedFilters.tsx` | 0.5일 | P0 |
| 검색 파서 개선 (필터 추출) | `lib/search-parser.ts` | 0.5일 | P0 |
| 검색 페이지 통합 | `app/(main)/search/page.tsx` | 0.5일 | P0 |
| 모바일 반응형 테스트 | 전체 | 0.5일 | P1 |

**총 예상 공수**: 3.5일

### 1.4 성공 지표

- 검색 완료율 증가 (검색 시작 → 결과 확인): 목표 +20%
- 필터 사용률: 목표 30% 이상
- 검색 이탈률 감소: 목표 -15%
- 사용자 만족도 설문: 4.0/5.0 이상

---

## 2. 메인페이지 정보 과부하 해결

### 2.1 문제 정의

- **현재 문제**:
  - 검색 페이지에서 필터 없을 때 7개 사이트 프리뷰를 모두 표시
  - 각 섹션마다 API 호출 5번씩 (총 35번 이상)
  - 초기 로딩 시간 과다, 데이터 사용량 증가

- **영향도**: 중간 (성능 및 사용자 경험)
- **사용자 불만**: 느린 로딩, 불필요한 정보 과다

### 2.2 개선안

#### 전략: 점진적 로딩 + 사용자 맞춤화

**구현 방안**:

1. **우선순위 기반 섹션 표시**
   - 사용자 행동 기반: 최근 검색/북마크한 사이트 우선
   - 인기도 기반: 캠페인 수가 많은 사이트 우선
   - 기본값: 상위 3개 사이트만 즉시 표시

2. **지연 로딩 (Lazy Loading)**
   - 초기: 3개 섹션만 로드
   - 스크롤 시: 나머지 섹션 점진적 로드
   - "더 많은 사이트 보기" 버튼으로 추가 로드

3. **API 호출 최적화**
   - 각 섹션당 1번의 API 호출로 통합
   - 서버 사이드에서 카테고리별로 1개씩 선별하여 반환
   - 캐싱 전략 도입 (5분 TTL)

**기술 구현**:

```typescript
// app/(main)/search/page.tsx
const [visibleSections, setVisibleSections] = useState<string[]>([]);
const [loadedSections, setLoadedSections] = useState<Set<string>>(new Set());

// 사용자 행동 기반 우선순위 계산
const getSectionPriority = async (userId: string) => {
  const { data } = await supabase
    .from('search_history')
    .select('site_name')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10);
  
  // 사이트별 빈도 계산하여 우선순위 반환
  return calculatePriority(data);
};

// 초기 로드: 상위 3개만
useEffect(() => {
  const priority = await getSectionPriority(userId);
  setVisibleSections(priority.slice(0, 3));
}, []);

// Intersection Observer로 스크롤 감지
const observerRef = useRef<IntersectionObserver>();
useEffect(() => {
  observerRef.current = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // 다음 섹션 로드
        loadNextSection();
      }
    });
  });
}, []);
```

**API 엔드포인트 개선**:

```typescript
// app/api/campaigns/featured/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const siteId = searchParams.get('site');
  const limit = parseInt(searchParams.get('limit') || '4');
  
  // 단일 쿼리로 카테고리별 1개씩 선별
  const { data } = await supabase
    .from('campaigns')
    .select('*')
    .eq('site_name', siteId)
    .eq('is_active', true)
    .gte('application_deadline', new Date().toISOString())
    .order('application_deadline', { ascending: true })
    .limit(limit * 5); // 여유있게 가져와서
  
  // 서버에서 카테고리별로 1개씩 선별
  const categorized = categorizeAndSelect(data, limit);
  
  return Response.json({ campaigns: categorized });
}
```

### 2.3 개발 작업

| 작업 | 파일 | 예상 공수 | 우선순위 |
|------|------|----------|---------|
| 섹션 우선순위 계산 로직 | `lib/section-priority.ts` | 1일 | P0 |
| 지연 로딩 컴포넌트 | `components/features/LazySection.tsx` | 1일 | P0 |
| API 엔드포인트 최적화 | `app/api/campaigns/featured/route.ts` | 0.5일 | P0 |
| Intersection Observer 훅 | `hooks/useIntersectionObserver.ts` | 0.5일 | P1 |
| 캐싱 전략 구현 | `lib/cache.ts` | 1일 | P1 |

**총 예상 공수**: 4일

### 2.4 성공 지표

- 초기 로딩 시간: 목표 50% 감소 (현재 3초 → 1.5초)
- API 호출 수: 목표 70% 감소 (35회 → 10회)
- 사용자 스크롤 깊이: 목표 +30%
- 이탈률 감소: 목표 -20%

---

## 3. 모바일 경험 개선

### 3.1 문제 정의

- **현재 문제**:
  - 데스크톱 중심 디자인
  - 모바일에서 필터 사용성 저하
  - 캘린더 뷰 모바일 최적화 부족
  - 터치 제스처 미지원

- **영향도**: 높음 (모바일 사용자 비중 높음)
- **사용자 불만**: 모바일에서 사용하기 불편함

### 3.2 개선안

#### 모바일 퍼스트 재설계

**주요 개선 사항**:

1. **필터 UI 모바일 최적화**
   - 기본: 필터 숨김
   - "필터" 버튼 클릭 시 바텀 시트로 표시
   - 적용된 필터는 상단에 태그로 표시 (스와이프로 제거)

2. **캘린더 뷰 모바일 최적화**
   - 월별 뷰: 터치 스와이프로 월 전환
   - 일별 뷰: 탭으로 전환 가능
   - 이벤트 클릭: 모달로 상세 정보 표시

3. **터치 제스처 지원**
   - 카드 스와이프: 북마크 추가/제거
   - 풀 투 리프레시: 새로고침
   - 롱 프레스: 빠른 액션 메뉴

4. **반응형 레이아웃 개선**
   - 그리드: 모바일 1열, 태블릿 2열, 데스크톱 3-4열
   - 텍스트 크기: 모바일에서 가독성 향상
   - 터치 타겟: 최소 44x44px

**기술 구현**:

```typescript
// components/features/MobileFilterSheet.tsx
'use client';

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

export function MobileFilterSheet({ filters, onFiltersChange }: Props) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="md:hidden">
          필터
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[80vh]">
        <SheetHeader>
          <SheetTitle>필터</SheetTitle>
        </SheetHeader>
        <SearchFilters filters={filters} onFiltersChange={onFiltersChange} />
      </SheetContent>
    </Sheet>
  );
}

// hooks/useSwipeGesture.ts
export function useSwipeGesture(onSwipeLeft?: () => void, onSwipeRight?: () => void) {
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e: TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && onSwipeLeft) onSwipeLeft();
    if (isRightSwipe && onSwipeRight) onSwipeRight();
  };

  return { onTouchStart, onTouchMove, onTouchEnd };
}
```

**반응형 유틸리티**:

```typescript
// lib/responsive.ts
export const breakpoints = {
  mobile: '640px',
  tablet: '768px',
  desktop: '1024px',
};

// Tailwind CSS 클래스 예시
<div className="
  grid 
  grid-cols-1 
  sm:grid-cols-2 
  lg:grid-cols-3 
  xl:grid-cols-4
  gap-4
">
```

### 3.3 개발 작업

| 작업 | 파일 | 예상 공수 | 우선순위 |
|------|------|----------|---------|
| MobileFilterSheet 컴포넌트 | `components/features/MobileFilterSheet.tsx` | 1일 | P0 |
| 모바일 캘린더 뷰 개선 | `components/features/Calendar.tsx` | 1.5일 | P0 |
| 터치 제스처 훅 | `hooks/useSwipeGesture.ts` | 1일 | P1 |
| 반응형 레이아웃 전면 개선 | 전체 컴포넌트 | 2일 | P0 |
| 모바일 테스트 (실기기) | 전체 | 1일 | P1 |

**총 예상 공수**: 6.5일

### 3.4 성공 지표

- 모바일 사용자 비중: 목표 60% 이상
- 모바일 이탈률: 목표 -25%
- 모바일 평균 세션 시간: 목표 +30%
- 모바일 사용자 만족도: 4.0/5.0 이상

---

## 4. 북마크 → 선정 플로우 개선

### 4.1 문제 정의

- **현재 문제**:
  - 사용자가 직접 당첨 여부를 입력해야 함
  - 실제 당첨 여부는 원본 사이트에서 확인해야 하는데, 수동 입력 구조
  - 사용자가 선정을 잘못 입력하거나 누락할 가능성 높음

- **영향도**: 높음 (핵심 기능)
- **사용자 불만**: 수동 입력의 불편함, 실수 가능성

### 4.2 개선안

#### 전략: 자동화 + 사용자 확인

**구현 방안**:

1. **원본 사이트 크롤링으로 당첨 여부 자동 확인**
   - 사용자가 "당첨 확인" 버튼 클릭
   - 원본 사이트의 "내 신청 내역" 페이지 크롤링
   - 당첨 여부 자동 감지 및 업데이트

2. **당첨 알림 시스템**
   - 사용자가 북마크한 체험단의 신청 마감일 + 1일 후
   - 자동으로 원본 사이트 확인 요청
   - 당첨 시 알림 발송 (이메일/푸시)

3. **수동 입력 옵션 유지**
   - 자동 확인 실패 시 수동 입력 가능
   - 사용자가 직접 확인한 경우 수동 입력

**기술 구현**:

```typescript
// app/api/applications/[id]/check-selection/route.ts
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const application = await getApplication(params.id);
  const user = await getCurrentUser();
  
  // 원본 사이트별 크롤러 호출
  const checker = getSelectionChecker(application.campaigns.source);
  const isSelected = await checker.checkSelection(
    user,
    application.campaigns.source_url
  );
  
  if (isSelected) {
    // 자동으로 선정 처리
    await updateApplicationStatus(params.id, 'selected', {
      auto_detected: true,
      detected_at: new Date().toISOString(),
    });
    
    // 캘린더 연동도 자동 실행
    await syncToGoogleCalendar(params.id);
  }
  
  return Response.json({ isSelected });
}

// lib/selection-checkers/reviewnote-checker.ts
export class ReviewNoteSelectionChecker {
  async checkSelection(user: User, campaignUrl: string): Promise<boolean> {
    // 네이버 로그인 세션 활용
    const session = await getNaverSession(user.id);
    
    // 원본 사이트의 "내 신청 내역" 페이지 크롤링
    const response = await fetch(campaignUrl, {
      headers: {
        'Cookie': session.cookie,
      },
    });
    
    const html = await response.text();
    // HTML 파싱하여 당첨 여부 확인
    return parseSelectionStatus(html);
  }
}
```

**당첨 알림 스케줄러**:

```typescript
// app/api/cron/check-selections/route.ts
export async function GET(request: Request) {
  // 인증: Vercel Cron Secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  // 신청 마감일이 어제인 모든 북마크 조회
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  const { data: applications } = await supabase
    .from('applications')
    .select('*, campaigns(*)')
    .eq('status', 'bookmarked')
    .gte('campaigns.application_deadline', yesterday.toISOString().split('T')[0])
    .lt('campaigns.application_deadline', new Date().toISOString().split('T')[0]);
  
  // 각 신청에 대해 당첨 여부 확인
  for (const app of applications) {
    await checkAndNotifySelection(app);
  }
  
  return Response.json({ checked: applications.length });
}
```

### 4.3 개발 작업

| 작업 | 파일 | 예상 공수 | 우선순위 |
|------|------|----------|---------|
| 당첨 확인 API 엔드포인트 | `app/api/applications/[id]/check-selection/route.ts` | 1일 | P0 |
| 사이트별 당첨 확인 크롤러 | `lib/selection-checkers/*.ts` | 3일 | P0 |
| 당첨 알림 스케줄러 | `app/api/cron/check-selections/route.ts` | 1일 | P1 |
| UI: 당첨 확인 버튼 | `components/features/CheckSelectionButton.tsx` | 0.5일 | P0 |
| 이메일 알림 템플릿 | `lib/email-templates/selection-notification.ts` | 0.5일 | P1 |

**총 예상 공수**: 6일

### 4.4 성공 지표

- 자동 당첨 확인 성공률: 목표 80% 이상
- 수동 입력 비율 감소: 목표 -60%
- 당첨 누락률 감소: 목표 -50%
- 사용자 만족도: 4.5/5.0 이상

---

## 5. 리뷰 마감일 계산 개선

### 5.1 문제 정의

- **현재 문제**:
  - "선정일 = 신청 마감일 + 1일" 가정이 모든 사이트에 적용 안 됨
  - `review_deadline_days` 없으면 사용자 직접 입력 필요
  - 핵심 가치 훼손

- **영향도**: 높음 (핵심 기능)
- **사용자 불만**: 수동 입력의 불편함

### 5.2 개선안

#### 전략: 사이트별 패턴 학습 + 사용자 피드백

**구현 방안**:

1. **사이트별 선정일 패턴 데이터베이스**
   - 각 사이트의 실제 선정일 패턴 수집
   - 통계적 분석으로 평균 선정일 계산
   - 사용자 입력 데이터로 지속 학습

2. **리뷰 기간 정보 크롤링 강화**
   - 크롤러에서 리뷰 기간 정보 추출 우선순위 높임
   - 없는 경우 사이트별 기본값 사용

3. **사용자 피드백 시스템**
   - 계산된 마감일이 틀렸을 경우 사용자 수정 가능
   - 수정 데이터를 학습 데이터로 활용

**기술 구현**:

```typescript
// lib/review-deadline-calculator.ts
interface SitePattern {
  site_name: string;
  average_selection_delay_days: number; // 신청 마감일로부터 평균 며칠 후 선정
  review_period_days: number | null; // 기본 리뷰 기간
}

const SITE_PATTERNS: Record<string, SitePattern> = {
  reviewnote: {
    site_name: 'reviewnote',
    average_selection_delay_days: 1.5, // 평균 1.5일 후
    review_period_days: 7, // 기본 7일
  },
  dinnerqueen: {
    site_name: 'dinnerqueen',
    average_selection_delay_days: 2,
    review_period_days: 10,
  },
  // ...
};

export function calculateReviewDeadline(
  campaign: Campaign,
  selectionDate?: Date
): Date {
  // 1. 크롤링된 review_deadline_days 우선 사용
  if (campaign.review_deadline_days) {
    const baseDate = selectionDate || estimateSelectionDate(campaign);
    const deadline = new Date(baseDate);
    deadline.setDate(deadline.getDate() + campaign.review_deadline_days);
    return deadline;
  }
  
  // 2. 사이트별 기본값 사용
  const pattern = SITE_PATTERNS[campaign.source];
  if (pattern?.review_period_days) {
    const baseDate = selectionDate || estimateSelectionDate(campaign);
    const deadline = new Date(baseDate);
    deadline.setDate(deadline.getDate() + pattern.review_period_days);
    return deadline;
  }
  
  // 3. 기본값 (7일)
  const baseDate = selectionDate || new Date();
  const deadline = new Date(baseDate);
  deadline.setDate(deadline.getDate() + 7);
  return deadline;
}

function estimateSelectionDate(campaign: Campaign): Date {
  if (!campaign.application_deadline) {
    return new Date(); // 오늘 기준
  }
  
  const pattern = SITE_PATTERNS[campaign.source];
  const deadline = new Date(campaign.application_deadline);
  const delayDays = pattern?.average_selection_delay_days || 1;
  
  deadline.setDate(deadline.getDate() + delayDays);
  return deadline;
}

// 사용자 피드백 수집
// app/api/applications/[id]/feedback/route.ts
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { actual_deadline, was_correct } = await request.json();
  
  // 피드백 저장
  await supabase.from('review_deadline_feedback').insert({
    application_id: params.id,
    calculated_deadline: calculated,
    actual_deadline,
    was_correct,
    campaign_source: campaign.source,
  });
  
  // 패턴 업데이트 (주기적으로 배치 작업으로)
  // ...
}
```

**학습 데이터 수집**:

```typescript
// scripts/update-site-patterns.ts
// 주기적으로 실행하여 사이트별 패턴 업데이트

export async function updateSitePatterns() {
  const sites = Object.keys(SITE_PATTERNS);
  
  for (const site of sites) {
    const { data: feedbacks } = await supabase
      .from('review_deadline_feedback')
      .select('*')
      .eq('campaign_source', site)
      .limit(100);
    
    // 통계 계산
    const avgDelay = calculateAverageDelay(feedbacks);
    const avgReviewPeriod = calculateAverageReviewPeriod(feedbacks);
    
    // 패턴 업데이트
    await updatePattern(site, {
      average_selection_delay_days: avgDelay,
      review_period_days: avgReviewPeriod,
    });
  }
}
```

### 5.3 개발 작업

| 작업 | 파일 | 예상 공수 | 우선순위 |
|------|------|----------|---------|
| 리뷰 마감일 계산기 개선 | `lib/review-deadline-calculator.ts` | 1.5일 | P0 |
| 사이트별 패턴 데이터베이스 | `lib/site-patterns.ts` | 1일 | P0 |
| 피드백 수집 API | `app/api/applications/[id]/feedback/route.ts` | 0.5일 | P1 |
| 패턴 학습 스크립트 | `scripts/update-site-patterns.ts` | 1일 | P1 |
| 크롤러 리뷰 기간 추출 강화 | `crawler/sites/*.py` | 2일 | P0 |

**총 예상 공수**: 6일

### 5.4 성공 지표

- 자동 계산 정확도: 목표 85% 이상
- 사용자 수정 비율 감소: 목표 -70%
- 리뷰 마감일 놓침률 감소: 목표 -80%

---

## 6. 구글 캘린더 연동 실용성 향상

### 6.1 문제 정의

- **현재 문제**:
  - 캘린더에 일정 등록만 하고 끝
  - 리뷰 작성 알림, 템플릿 제공 없음
  - 실용성 부족

- **영향도**: 중간 (프리미엄 기능)
- **사용자 불만**: 캘린더 연동만으로는 부족함

### 6.2 개선안

#### 전략: 리뷰 작성 지원 시스템

**구현 방안**:

1. **리뷰 작성 알림**
   - 리뷰 마감일 D-3, D-1, D-day 알림
   - 이메일 + 구글 캘린더 알림

2. **리뷰 템플릿 제공**
   - 체험단별 리뷰 작성 가이드
   - 템플릿 다운로드 (마크다운/워드)

3. **리뷰 작성 체크리스트**
   - 필수 항목 체크리스트
   - 진행 상황 추적

**기술 구현**:

```typescript
// lib/review-assistant.ts
export interface ReviewTemplate {
  campaign_id: string;
  sections: ReviewSection[];
  checklist: ChecklistItem[];
}

export interface ReviewSection {
  title: string;
  description: string;
  example?: string;
  required: boolean;
}

// 리뷰 템플릿 생성
export function generateReviewTemplate(campaign: Campaign): ReviewTemplate {
  const baseTemplate = getBaseTemplate(campaign.category);
  
  // 체험단별 커스터마이징
  return {
    campaign_id: campaign.id,
    sections: [
      ...baseTemplate.sections,
      ...getCustomSections(campaign),
    ],
    checklist: [
      { item: '사진 3장 이상', required: true },
      { item: '체험 내용 상세 작성', required: true },
      { item: '원본 링크 첨부', required: true },
      // ...
    ],
  };
}

// 알림 스케줄러
// app/api/cron/review-reminders/route.ts
export async function GET(request: Request) {
  // 인증 확인
  // ...
  
  // D-3, D-1, D-day 체크
  const today = new Date();
  const deadlines = [3, 1, 0].map(days => {
    const date = new Date(today);
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  });
  
  const { data: applications } = await supabase
    .from('applications')
    .select('*, campaigns(*), users(*)')
    .eq('status', 'selected')
    .in('review_deadline', deadlines)
    .eq('reminder_sent', false);
  
  for (const app of applications) {
    await sendReviewReminder(app);
  }
  
  return Response.json({ sent: applications.length });
}

// 이메일 알림
// lib/email-templates/review-reminder.ts
export function generateReviewReminderEmail(application: Application) {
  const template = generateReviewTemplate(application.campaigns);
  
  return {
    subject: `[캘리뷰] 리뷰 마감일이 ${calculateDday(application.review_deadline)}입니다`,
    html: `
      <h2>리뷰 작성 안내</h2>
      <p>체험단: ${application.campaigns.title}</p>
      <p>리뷰 마감일: ${formatDate(application.review_deadline)}</p>
      
      <h3>리뷰 작성 가이드</h3>
      ${template.sections.map(section => `
        <div>
          <h4>${section.title}</h4>
          <p>${section.description}</p>
        </div>
      `).join('')}
      
      <h3>체크리스트</h3>
      <ul>
        ${template.checklist.map(item => `
          <li>${item.required ? '✓' : '○'} ${item.item}</li>
        `).join('')}
      </ul>
      
      <a href="${getReviewTemplateUrl(application.id)}">템플릿 다운로드</a>
    `,
  };
}
```

**UI 컴포넌트**:

```typescript
// components/features/ReviewAssistant.tsx
export function ReviewAssistant({ application }: Props) {
  const template = useReviewTemplate(application.campaigns.id);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>리뷰 작성 가이드</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {template.sections.map((section, index) => (
            <div key={index}>
              <h4>{section.title}</h4>
              <p>{section.description}</p>
            </div>
          ))}
        </div>
        
        <div className="mt-6">
          <h4>체크리스트</h4>
          <ul>
            {template.checklist.map((item, index) => (
              <li key={index}>
                <Checkbox />
                {item.item}
              </li>
            ))}
          </ul>
        </div>
        
        <Button onClick={downloadTemplate}>
          템플릿 다운로드
        </Button>
      </CardContent>
    </Card>
  );
}
```

### 6.3 개발 작업

| 작업 | 파일 | 예상 공수 | 우선순위 |
|------|------|----------|---------|
| 리뷰 템플릿 생성기 | `lib/review-assistant.ts` | 2일 | P1 |
| 리뷰 알림 스케줄러 | `app/api/cron/review-reminders/route.ts` | 1일 | P1 |
| 이메일 템플릿 | `lib/email-templates/review-reminder.ts` | 1일 | P1 |
| ReviewAssistant 컴포넌트 | `components/features/ReviewAssistant.tsx` | 1.5일 | P1 |
| 템플릿 다운로드 기능 | `app/api/review-templates/[id]/route.ts` | 0.5일 | P2 |

**총 예상 공수**: 6일

### 6.4 성공 지표

- 리뷰 작성 완료율: 목표 +25%
- 리뷰 마감일 놓침률: 목표 -60%
- 템플릿 사용률: 목표 40% 이상
- 사용자 만족도: 4.0/5.0 이상

---

## 7. 사용자 행동 분석 도입

### 7.1 문제 정의

- **현재 문제**:
  - "검색 → 북마크 → 선정" 전환율 추적 불가
  - A/B 테스트 인프라 없음
  - 개선 방향 결정 어려움

- **영향도**: 높음 (데이터 기반 의사결정)
- **영향**: 개선 효과 측정 불가

### 7.2 개선안

#### 전략: Google Analytics 4 + 커스텀 이벤트

**구현 방안**:

1. **Google Analytics 4 도입**
   - 기본 페이지뷰 추적
   - 커스텀 이벤트 정의 및 추적
   - 전환 목표 설정

2. **핵심 이벤트 추적**
   - 검색 실행
   - 검색 결과 클릭
   - 북마크 추가/제거
   - 선정 처리
   - 캘린더 연동
   - 원본 사이트 클릭

3. **전환 퍼널 분석**
   - 검색 → 상세 페이지
   - 상세 → 북마크
   - 북마크 → 선정
   - 선정 → 완료

**기술 구현**:

```typescript
// lib/analytics.ts
export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_ID;

// Google Analytics 초기화
export function initGA() {
  if (typeof window === 'undefined' || !GA_MEASUREMENT_ID) return;
  
  // gtag 스크립트 로드
  const script = document.createElement('script');
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  script.async = true;
  document.head.appendChild(script);
  
  window.dataLayer = window.dataLayer || [];
  function gtag(...args: any[]) {
    window.dataLayer.push(args);
  }
  gtag('js', new Date());
  gtag('config', GA_MEASUREMENT_ID);
  
  (window as any).gtag = gtag;
}

// 이벤트 추적
export function trackEvent(
  eventName: string,
  params?: Record<string, any>
) {
  if (typeof window === 'undefined' || !(window as any).gtag) return;
  
  (window as any).gtag('event', eventName, params);
}

// 핵심 이벤트 정의
export const events = {
  search: (query: string, filters: SearchFilters) => {
    trackEvent('search', {
      search_term: query,
      filters: JSON.stringify(filters),
    });
  },
  
  campaign_click: (campaignId: string, position: number) => {
    trackEvent('campaign_click', {
      campaign_id: campaignId,
      position,
    });
  },
  
  bookmark_add: (campaignId: string) => {
    trackEvent('bookmark_add', { campaign_id: campaignId });
  },
  
  bookmark_remove: (campaignId: string) => {
    trackEvent('bookmark_remove', { campaign_id: campaignId });
  },
  
  selection_mark: (applicationId: string) => {
    trackEvent('selection_mark', { application_id: applicationId });
  },
  
  calendar_sync: (applicationId: string) => {
    trackEvent('calendar_sync', { application_id: applicationId });
  },
  
  original_site_click: (campaignId: string, source: string) => {
    trackEvent('original_site_click', {
      campaign_id: campaignId,
      source,
    });
  },
};

// 전환 퍼널 추적
export function trackConversionFunnel(step: string, data?: any) {
  trackEvent('conversion_funnel', {
    step,
    ...data,
  });
}
```

**컴포넌트에 통합**:

```typescript
// components/features/CampaignCard.tsx
import { events } from '@/lib/analytics';

export function CampaignCard({ campaign, position }: Props) {
  const handleClick = () => {
    events.campaign_click(campaign.id, position);
    router.push(`/campaign/${campaign.id}`);
  };
  
  // ...
}

// components/features/BookmarkButton.tsx
export function BookmarkButton({ campaign }: Props) {
  const handleBookmark = async () => {
    if (isBookmarked) {
      await removeBookmark();
      events.bookmark_remove(campaign.id);
    } else {
      await addBookmark();
      events.bookmark_add(campaign.id);
    }
  };
}
```

**대시보드 구축** (선택):

```typescript
// app/(main)/admin/analytics/page.tsx
export default function AnalyticsDashboard() {
  // Google Analytics API로 데이터 가져오기
  // 또는 Supabase에 이벤트 저장 후 분석
  
  return (
    <div>
      <h1>사용자 행동 분석</h1>
      <ConversionFunnel />
      <EventMetrics />
      <UserJourney />
    </div>
  );
}
```

### 7.3 개발 작업

| 작업 | 파일 | 예상 공수 | 우선순위 |
|------|------|----------|---------|
| Google Analytics 초기화 | `lib/analytics.ts` | 0.5일 | P0 |
| 이벤트 추적 함수 | `lib/analytics.ts` | 1일 | P0 |
| 컴포넌트에 이벤트 통합 | 전체 컴포넌트 | 1.5일 | P0 |
| 전환 퍼널 추적 | `lib/analytics.ts` | 0.5일 | P1 |
| 분석 대시보드 (선택) | `app/(main)/admin/analytics/page.tsx` | 2일 | P2 |

**총 예상 공수**: 5.5일

### 7.4 성공 지표

- 이벤트 추적 커버리지: 목표 100%
- 전환 퍼널 가시성: 모든 단계 추적 가능
- 데이터 기반 의사결정: A/B 테스트 가능

---

## 8. KPI 측정 시스템 구축

### 8.1 문제 정의

- **현재 문제**:
  - "재방문율 40% 이상" 같은 목표가 검증되지 않음
  - 실제 지표 수집 시스템 없음
  - 목표 달성 여부 확인 불가

- **영향도**: 높음 (비즈니스 성공 측정)
- **영향**: 목표 달성 여부 불명확

### 8.2 개선안

#### 전략: KPI 대시보드 + 자동 리포트

**구현 방안**:

1. **KPI 데이터베이스 스키마**
   - 일별/주별/월별 KPI 저장
   - 자동 계산 및 저장

2. **KPI 대시보드**
   - 실시간 지표 표시
   - 목표 대비 진행률
   - 트렌드 차트

3. **자동 리포트**
   - 주간/월간 리포트 자동 생성
   - 이메일 발송

**기술 구현**:

```typescript
// lib/kpi-calculator.ts
export interface KPIMetrics {
  date: string;
  mau: number; // Monthly Active Users
  dau: number; // Daily Active Users
  retention_rate_7d: number; // 7일 재방문율
  avg_session_duration: number; // 평균 세션 시간 (초)
  calendar_sync_rate: number; // 캘린더 연동률
  avg_bookmarks_per_user: number; // 사용자당 평균 북마크 수
  search_to_detail_ctr: number; // 검색 → 상세 CTR
  detail_to_bookmark_ctr: number; // 상세 → 북마크 CTR
  bookmark_to_selection_ctr: number; // 북마크 → 선정 CTR
  original_site_click_rate: number; // 원본 사이트 클릭률
}

export async function calculateDailyKPIs(date: Date): Promise<KPIMetrics> {
  const dateStr = date.toISOString().split('T')[0];
  const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  
  // MAU 계산
  const { data: mauData } = await supabase
    .from('users')
    .select('id')
    .gte('last_active_at', startOfMonth.toISOString());
  const mau = mauData?.length || 0;
  
  // DAU 계산
  const { data: dauData } = await supabase
    .from('users')
    .select('id')
    .gte('last_active_at', dateStr)
    .lt('last_active_at', new Date(date.getTime() + 86400000).toISOString().split('T')[0]);
  const dau = dauData?.length || 0;
  
  // 재방문율 계산
  const sevenDaysAgo = new Date(date);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const { data: returningUsers } = await supabase
    .from('users')
    .select('id')
    .gte('last_active_at', sevenDaysAgo.toISOString())
    .lt('last_active_at', date.toISOString());
  
  const retention_rate_7d = mau > 0 ? (returningUsers?.length || 0) / mau : 0;
  
  // 평균 세션 시간
  const { data: sessions } = await supabase
    .from('analytics_events')
    .select('session_id, duration')
    .eq('date', dateStr);
  
  const avg_session_duration = calculateAverage(sessions, 'duration');
  
  // 캘린더 연동률
  const { data: usersWithCalendar } = await supabase
    .from('users')
    .select('id')
    .eq('google_calendar_connected', true);
  
  const calendar_sync_rate = mau > 0 ? (usersWithCalendar?.length || 0) / mau : 0;
  
  // 전환율 계산
  const search_to_detail_ctr = await calculateCTR('search', 'campaign_click', dateStr);
  const detail_to_bookmark_ctr = await calculateCTR('campaign_click', 'bookmark_add', dateStr);
  const bookmark_to_selection_ctr = await calculateCTR('bookmark_add', 'selection_mark', dateStr);
  
  return {
    date: dateStr,
    mau,
    dau,
    retention_rate_7d,
    avg_session_duration,
    calendar_sync_rate,
    avg_bookmarks_per_user: await calculateAvgBookmarks(dateStr),
    search_to_detail_ctr,
    detail_to_bookmark_ctr,
    bookmark_to_selection_ctr,
    original_site_click_rate: await calculateOriginalSiteClickRate(dateStr),
  };
}

// KPI 저장
export async function saveDailyKPIs(metrics: KPIMetrics) {
  await supabase.from('kpi_metrics').upsert({
    date: metrics.date,
    ...metrics,
    updated_at: new Date().toISOString(),
  });
}

// 스케줄러
// app/api/cron/calculate-kpis/route.ts
export async function GET(request: Request) {
  // 인증 확인
  // ...
  
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  const kpis = await calculateDailyKPIs(yesterday);
  await saveDailyKPIs(kpis);
  
  return Response.json({ kpis });
}
```

**대시보드 UI**:

```typescript
// app/(main)/admin/kpi/page.tsx
export default function KPIDashboard() {
  const [kpis, setKPIs] = useState<KPIMetrics[]>([]);
  const [goals, setGoals] = useState<KPIGoals>({
    mau: 5000,
    retention_rate_7d: 0.4,
    avg_session_duration: 180,
    calendar_sync_rate: 0.3,
    // ...
  });
  
  return (
    <div>
      <h1>KPI 대시보드</h1>
      
      <div className="grid grid-cols-4 gap-4">
        <KPICard
          title="MAU"
          value={kpis[0]?.mau || 0}
          goal={goals.mau}
          trend={calculateTrend(kpis, 'mau')}
        />
        <KPICard
          title="재방문율 (7일)"
          value={kpis[0]?.retention_rate_7d || 0}
          goal={goals.retention_rate_7d}
          format="percentage"
        />
        {/* ... */}
      </div>
      
      <KPITrendChart kpis={kpis} />
      <ConversionFunnelChart kpis={kpis} />
    </div>
  );
}
```

### 8.3 개발 작업

| 작업 | 파일 | 예상 공수 | 우선순위 |
|------|------|----------|---------|
| KPI 계산 로직 | `lib/kpi-calculator.ts` | 2일 | P0 |
| KPI 저장 스키마 | `supabase/migrations/kpi_metrics.sql` | 0.5일 | P0 |
| KPI 계산 스케줄러 | `app/api/cron/calculate-kpis/route.ts` | 0.5일 | P0 |
| KPI 대시보드 UI | `app/(main)/admin/kpi/page.tsx` | 2일 | P1 |
| 리포트 생성기 | `lib/report-generator.ts` | 1일 | P2 |

**총 예상 공수**: 6일

### 8.4 성공 지표

- KPI 추적 커버리지: 목표 100%
- 실시간 지표 가시성: 목표 달성
- 데이터 기반 의사결정: 목표 달성

---

## 전체 일정 및 우선순위

### Phase 1: 즉시 개선 (P0) - 2주

1. 검색 UX 개선 (3.5일)
2. 메인페이지 정보 과부하 해결 (4일)
3. 모바일 경험 개선 (6.5일)
4. 사용자 행동 분석 도입 (5.5일)

**총 공수**: 19.5일 (약 4주)

### Phase 2: 핵심 기능 개선 (P0-P1) - 2주

5. 북마크 → 선정 플로우 개선 (6일)
6. 리뷰 마감일 계산 개선 (6일)
7. KPI 측정 시스템 구축 (6일)

**총 공수**: 18일 (약 3.5주)

### Phase 3: 실용성 향상 (P1-P2) - 1주

8. 구글 캘린더 연동 실용성 향상 (6일)

**총 공수**: 6일 (약 1주)

---

## 예상 총 공수

- **Phase 1**: 19.5일 (4주)
- **Phase 2**: 18일 (3.5주)
- **Phase 3**: 6일 (1주)

**총 예상 공수**: 43.5일 (약 8.5주)

---

## 성공 기준

### 단기 (1개월)

- 검색 UX 개선 완료
- 모바일 경험 개선 완료
- 사용자 행동 분석 도입 완료
- KPI 측정 시스템 구축 완료

### 중기 (3개월)

- 모든 개선 사항 완료
- 사용자 만족도 4.0/5.0 이상
- 핵심 KPI 목표 달성

### 장기 (6개월)

- 데이터 기반 개선 사이클 정착
- 사용자 성장 지속
- 비즈니스 목표 달성

---

## 참고 사항

- 각 작업은 독립적으로 진행 가능하지만, 일부는 의존성이 있음
- 우선순위는 사용자 영향도와 비즈니스 가치를 기준으로 설정
- 실제 개발 시 일정 조정 가능
- 테스트 및 QA 시간은 별도로 고려 필요


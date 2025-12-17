# 당첨 확인 기능 구현 계획 (최종 보강판)

> **작성일**: 2024-12-19  
> **최종 수정일**: 2024-12-19 (기술 스택 일관성 보강)  
> **버전**: 3.2 (기술 스택 일관성 보강)  
> **상태**: 구체화된 실행 계획 (완전 무료 전략, 기술 스택 일관성 반영)

## 📋 문서 개요

이 문서는 당첨 확인 기능의 구현 계획을 담고 있습니다. 비판적 분석과 재검토를 거쳐 현실적이고 구체적인 실행 계획으로 발전시켰습니다.

**⚠️ 핵심 원칙: Phase 1 완전 무료 운영**
- 수익화 전까지 비용 발생 방지 ($0 유지)
- Vercel 무료 플랜 내에서 모든 기능 제공
- 별도 서버 인프라 사용 안 함
- 자동 스케줄러는 Phase 2로 연기

**참고 문서:**
- `SELECTION_CHECK_CRITICAL_ANALYSIS.md`: 초기 비판적 분석
- `SELECTION_CHECK_REVIEW_V2.md`: 재검토 결과
- `COST_MINIMIZATION_STRATEGY.md`: **비용 최소화 전략 (중요)**
- `ALL_SERVICES_COST_ANALYSIS.md`: **전체 서비스 비용 분석 (중요)**

## ⚠️ 중요 변경사항 요약

### v2.0 (비판적 분석 반영)
1. **기술 스택 변경**: Puppeteer → Python 크롤러 + 별도 서버
2. **일정 현실화**: 4주 → 8-12주
3. **범위 축소**: MVP는 리뷰노트 1개 사이트만
4. **보안 강화**: 쿠키 암호화, 세션 만료 처리
5. **테스트 계획 추가**: 통합 테스트, 모의 데이터 테스트
6. **모니터링 시스템 추가**: 에러 추적, 성공률 모니터링

### v3.0 (재검토 반영)
1. ✅ **Phase 0 프로토타입 단계 추가**: 사전 조사 및 프로토타입
2. ✅ **Phase 1 목표 수정**: "다른 사이트" 제거, 리뷰노트만
3. ✅ **별도 서버 인프라 구체화**: Railway/Render 선택 기준, API 구조 (v3.1에서 제거됨)
4. ✅ **네이버 세션 쿠키 관리 구체화**: 저장 구조, 암호화 방법, 만료 감지
5. ✅ **에러 처리 구체화**: 에러 분류, 재시도 전략, 사용자 메시지
6. ✅ **비용 추정 상세화**: 월간 비용 분석, 모니터링 계획
7. ✅ **테스트 전략 구체화**: 테스트 케이스, 모의 데이터 구조
8. ✅ **성공 지표 측정 방법**: 데이터 수집, 리포트 구조
9. ✅ **법적 고려사항 실행 계획**: 체크리스트, 사용자 동의 UI
10. ✅ **점진적 롤아웃 전략**: 베타 → 제한적 공개 → 전체 공개
11. ✅ **폴백 전략**: 실패 시 대응 방법
12. ✅ **사이트별 복잡도 분석**: 사전 조사 체크리스트

### v3.1 (비용 최소화 반영)
1. ✅ **Phase 1 완전 무료 전략**: Vercel 무료 플랜 내에서 모든 기능 제공
2. ✅ **별도 서버 제거**: Railway/Render 대신 Node.js + Cheerio 직접 구현
3. ✅ **자동 스케줄러 Phase 2로 연기**: 비용 및 리소스 문제로 제외
4. ✅ **비용 모니터링 강화**: 무료 플랜 한도 추적 및 알림 설정
5. ✅ **기술 스택 변경**: Python 크롤러 → Node.js + Cheerio (Vercel에서 직접 실행)

### v3.2 (기술 스택 일관성 보강) - **최신 버전**
1. ✅ **문서 전반 기술 스택 일관성 확보**: Python → Node.js로 모든 언급 수정
2. ✅ **일정과 기술 스택 일치**: Week 1 일정 수정
3. ✅ **체크리스트 업데이트**: Python 크롤러 → Node.js 크롤러
4. ✅ **옵션 설명 명확화**: 옵션 B와 C의 역할 구분
5. ✅ **Vercel 함수 실행 시간 제한 고려**: 10초 제한, 최적화 목표 5-8초
6. ✅ **Cheerio의 한계 명시**: JavaScript 렌더링 불가능, 폴백 전략 수립
7. ✅ **타임아웃 처리 추가**: 코드 예시에 타임아웃 로직 포함
8. ✅ **GitHub Actions 관계 명확화**: 기존 크롤러와 당첨 확인 크롤러 구분

---

## 📋 현재 상태 분석

### ✅ 이미 구현된 부분
1. **API 엔드포인트**: `/api/applications/[id]/check-selection`
   - 당첨 확인 요청 처리
   - 자동 선정 처리 로직
   - 캘린더 연동 트리거

2. **UI 컴포넌트**: `CheckSelectionButton`
   - 당첨 확인 버튼
   - 로딩 상태 표시
   - 결과 메시지 표시

3. **크롤러 팩토리**: `lib/selection-checkers/index.ts`
   - 사이트별 크롤러 선택 로직

4. **리뷰노트 크롤러 구조**: `lib/selection-checkers/reviewnote-checker.ts`
   - 기본 구조는 있으나 실제 크롤링 로직 미구현

5. **데이터베이스 스키마**
   - `applications.auto_detected`: 자동 확인 여부
   - `applications.detected_at`: 확인 시각
   - `users.naver_session_cookies`: 네이버 세션 쿠키

### ❌ 미구현 부분
1. **크롤러 API 실제 로직**: `/api/crawler/check-selection`
   - 현재는 구조만 있고 실제 크롤링 미구현

2. **사이트별 당첨 확인 크롤러**
   - 리뷰노트: 구조만 있음
   - 다른 사이트들: 미구현
     - dinnerqueen
     - reviewplace
     - revu
     - gangnam
     - modooexperience
     - pavlovu
     - seoulouba

3. **자동 당첨 확인 스케줄러**
   - 신청 마감일 후 자동 확인 기능 없음

4. **당첨 알림 시스템**
   - 이메일/푸시 알림 미구현

---

## 🎯 구현 목표

### Phase 1: 핵심 기능 구현 (우선순위: P0)
- [ ] 리뷰노트 당첨 확인 크롤러 완성
- [ ] 크롤러 API 실제 로직 구현
- [ ] 세션 관리 및 보안 강화
- [ ] 테스트 및 모니터링 시스템 구축

**⚠️ 중요**: Phase 1은 리뷰노트 1개 사이트만 완벽하게 구현합니다.

### Phase 2: 확장 및 자동화 (우선순위: P1)
- [ ] 자동 당첨 확인 스케줄러
- [ ] 당첨 알림 시스템
- [ ] 나머지 사이트 크롤러 구현

### Phase 3: 개선 및 최적화 (우선순위: P2)
- [ ] 크롤링 성능 최적화
- [ ] 에러 처리 개선
- [ ] 재시도 로직
- [ ] 통계 및 모니터링

---

## 📝 상세 구현 계획

### 1. 리뷰노트 당첨 확인 크롤러 완성

#### 1.1 현재 구조 분석
- 파일: `lib/selection-checkers/reviewnote-checker.ts`
- 문제: `/api/crawler/check-selection` API를 호출하지만 실제 크롤링 로직 없음

#### 1.2 구현 방안 (재검토됨)

**❌ 옵션 A: Puppeteer/Playwright (비현실적)**
- Vercel 서버리스 환경에서 실행 불가능
- 함수 크기 제한(50MB) 및 실행 시간 제한(10-60초) 초과
- 최소 100MB 이상의 크롬 바이너리 필요

**✅ 옵션 B: Python 크롤러 + GitHub Actions (비동기 처리)**
- 기존 Python 크롤러 인프라 활용
- GitHub Actions에서 주기적으로 실행 (무료)
- Vercel API에서 GitHub Actions 워크플로우 트리거
- **장점**: 기존 코드 재사용, 안정성 높음, **비용 무료**
- **단점**: 실시간 응답 불가능, 웹훅 또는 폴링 필요
- **권장**: Phase 2에서 자동 스케줄러로 활용

**✅ 옵션 C: Cheerio + HTTP 요청 (실시간 처리 - 권장)**
- 브라우저 없이 HTTP 요청 + HTML 파싱
- Vercel에서 실행 가능 (무료 플랜 내)
- **장점**: 실시간 응답 가능, 비용 무료
- **단점**: JavaScript 렌더링이 필요한 페이지는 불가능
- **⚠️ Cheerio의 한계**: 서버 사이드 렌더링된 HTML만 파싱 가능

**⚠️ 옵션 D: Python 크롤러 + 별도 서버 (Phase 2 이후 고려)**
- Railway, Render, AWS EC2 등 별도 서버 필요
- **단점**: 월 $5-20 비용 발생
- **권장**: Phase 1에서는 제외, 수익화 후 Phase 2에서 고려

**최종 권장: 옵션 C (Cheerio + HTTP 요청) - Phase 1**
- **비용 무료**: Vercel 무료 플랜 내에서 실행 가능
- **실시간 응답**: 사용자 요청 즉시 처리
- **구현 간단**: 별도 인프라 불필요
- **Phase 1 목표에 부합**: 무료로 전 기능 오픈

**⚠️ 중요 제한사항:**
- **Vercel 함수 실행 시간**: 최대 10초 (무료 플랜)
  - 목표: 5-8초 내 완료하도록 최적화
  - 타임아웃 처리 필수
- **Cheerio의 한계**: 
  - 서버 사이드 렌더링된 HTML만 파싱 가능
  - JavaScript로 동적 생성된 콘텐츠는 파싱 불가능
  - 리뷰노트는 Next.js이므로 `__NEXT_DATA__`에 데이터가 있을 것으로 예상
  - 만약 JavaScript 렌더링이 필요하면 Phase 0에서 확인 후 대안 필요

#### 1.3 구현 단계 (비용 최소화 반영)

**⚠️ Phase 1 전략: 무료 인프라만 사용**

**Step 1: Node.js에서 직접 크롤링 (Cheerio 사용)**
```typescript
// lib/selection-checkers/reviewnote-checker.ts

import * as cheerio from 'cheerio';

export async function checkReviewNoteSelection(
  campaignUrl: string,
  cookies: Cookie[]
): Promise<boolean> {
  // 1. "내 신청 내역" 페이지 URL
  const applicationsUrl = 'https://www.reviewnote.co.kr/my/applications';
  
  // 2. 쿠키를 헤더 형식으로 변환
  const cookieHeader = cookies
    .map(c => `${c.name}=${c.value}`)
    .join('; ');
  
  // 3. HTTP 요청으로 페이지 가져오기 (타임아웃 설정: 8초)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000); // Vercel 10초 제한 고려
  
  const response = await fetch(applicationsUrl, {
    headers: {
      'Cookie': cookieHeader,
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    },
    signal: controller.signal
  });
  
  clearTimeout(timeoutId);
  
  // 4. 세션 만료 확인
  if (response.status === 401 || response.status === 403) {
    throw new Error('세션이 만료되었습니다. 네이버로 다시 로그인해주세요.');
  }
  
  // 5. HTML 파싱
  const html = await response.text();
  const $ = cheerio.load(html);
  
  // 6. __NEXT_DATA__ 파싱 (Next.js 앱이므로)
  const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>(.*?)<\/script>/);
  if (nextDataMatch) {
    const nextData = JSON.parse(nextDataMatch[1]);
    // nextData에서 신청 내역 찾기
    // campaignUrl과 매칭되는 신청의 당첨 여부 확인
  }
  
  // 7. 또는 HTML에서 직접 파싱
  // "당첨", "선정", "합격" 등의 키워드 확인
  
  // 8. 특정 체험단의 당첨 여부 판단
  // campaignUrl과 매칭되는 신청 찾기
  // 당첨 여부 반환
  
  return false; // 임시
}
```

**Step 2: 크롤러 API 구현 (Vercel 무료 플랜)**
```typescript
// app/api/crawler/check-selection/route.ts
// Node.js에서 직접 크롤링 (Cheerio 사용)
// Vercel 무료 플랜 내에서 실행

import { checkReviewNoteSelection } from '@/lib/selection-checkers/reviewnote-checker';

export async function POST(request: NextRequest) {
  const { site, campaignUrl, cookies } = await request.json();
  
  // 재시도 로직 (최대 3회, 지수 백오프)
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      let result: boolean;
      
      // 사이트별 분기 처리
      switch (site) {
        case 'reviewnote':
          result = await checkReviewNoteSelection(campaignUrl, cookies);
          break;
        default:
          return NextResponse.json(
            { error: '해당 사이트는 아직 지원되지 않습니다.' },
            { status: 400 }
          );
      }
      
      return NextResponse.json({
        isSelected: result,
        success: true
      });
      
    } catch (error: any) {
      // 에러 분류
      if (error.name === 'AbortError' || error.message?.includes('timeout')) {
        // 타임아웃 오류: 즉시 실패
        return NextResponse.json(
          { error: '요청 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.' },
          { status: 408 }
        );
      }
      
      if (error.message?.includes('세션이 만료')) {
        // 인증 오류: 즉시 실패
        return NextResponse.json(
          { error: '세션이 만료되었습니다. 네이버로 다시 로그인해주세요.' },
          { status: 401 }
        );
      }
      
      // 네트워크 오류: 재시도
      if (attempt < 2) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        continue;
      }
      
      // 최종 실패
      return NextResponse.json(
        { error: error.message || '크롤링 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }
  }
}
```

**Step 4: 리뷰노트 크롤러 완성**
```typescript
// lib/selection-checkers/reviewnote-checker.ts
// 크롤러 API 호출 로직 개선
// 세션 만료 감지 및 에러 처리 강화
```

**예상 공수**: 5-7일 (비용 최소화 반영)
- Node.js 크롤러 구현 (Cheerio): 2-3일
- 크롤러 API 구현: 1일
- 세션 관리 및 에러 처리: 2-3일
- 테스트 및 디버깅: 1일

**⚠️ 비용**: **무료** (Vercel 무료 플랜 내)

---

### 2. 다른 사이트 크롤러 구현 (Phase 2로 연기)

#### 2.1 MVP 범위 축소

**⚠️ 중요**: Phase 1에서는 리뷰노트 1개 사이트만 완벽하게 구현합니다.
- 다른 사이트는 Phase 2 이후로 연기
- 사용자 피드백 수집 후 우선순위 재조정

#### 2.2 Phase 2 우선순위 (예정)

**1순위: reviewplace (리뷰플레이스)**
- 사용자 수 많음
- 당첨 확인 중요도 높음
- 예상 공수: 5-7일 (현실화됨)

**2순위: dinnerqueen (디너퀸)**
- 사용자 수 많음
- 예상 공수: 5-7일

**3순위: revu (리뷰)**
- 예상 공수: 4-6일

**4순위: 나머지 사이트들**
- gangnam, modooexperience, pavlovu, seoulouba
- 예상 공수: 각 3-5일

#### 2.3 사이트별 복잡도 분석 (구체화됨)

**⚠️ 주의**: 각 사이트마다 완전히 다른 구조

**사전 조사 체크리스트 (각 사이트마다):**
1. "내 신청 내역" 페이지 URL 확인
2. 인증 방식 확인 (네이버 로그인? 자체 로그인?)
3. HTML 구조 확인 (서버 사이드 렌더링? 클라이언트 사이드?)
4. 당첨 여부 표시 방법 확인 (텍스트? 클래스? API?)
5. 크롤링 가능 여부 확인 (robots.txt 확인)
6. Rate Limiting 존재 여부 확인

**예상 복잡도 (사전 조사 후 재추정 필요):**

**리뷰노트 (Phase 1)**
- 구조: Next.js 기반, `__NEXT_DATA__` 사용 가능
- 인증: 네이버 로그인 세션
- 예상 난이도: 중간
- 예상 공수: 6-8일

**리뷰플레이스 (Phase 2 후보)**
- 구조: 전통적인 서버 사이드 렌더링 (예상)
- 인증: 확인 필요
- 예상 난이도: 중간-높음
- 예상 공수: 5-7일 (사전 조사 후 재추정)

**디너퀸 (Phase 2 후보)**
- 구조: 확인 필요
- 인증: 다른 인증 방식 (예상)
- 예상 난이도: 높음
- 예상 공수: 5-7일 (사전 조사 후 재추정)

**개선 방안**:
- Phase 2 시작 전에 각 사이트별 상세 분석 문서 먼저 작성
- 프로토타입 구현 후 공수 재추정
- 우선순위 재조정: 사용자 수가 많은 1-2개만 Phase 2에서 구현

**Phase 2 총 예상 공수**: 15-20일 (현실화됨, 사전 조사 후 재추정)

---

### 3. 크롤러 API 실제 로직 구현

#### 3.1 현재 상태
- 파일: `app/api/crawler/check-selection/route.ts`
- 상태: 구조만 있고 실제 로직 없음

#### 3.2 구현 내용

**사이트별 분기 처리**
```typescript
switch (site) {
  case "reviewnote":
    return await checkReviewNoteSelection(campaignUrl, cookies);
  case "reviewplace":
    return await checkReviewPlaceSelection(campaignUrl, cookies);
  // ...
}
```

**크롤링 방법**
- Node.js + Cheerio로 Vercel API Route에서 직접 크롤링
- 사이트별 분기 처리
- 에러 핸들링 및 재시도 로직
- **⚠️ Vercel 함수 실행 시간 제한**: 최대 10초 (무료 플랜)

**예상 공수**: 6-8일 (현실화됨)
- 사이트별 분기 처리: 1일
- 에러 핸들링: 2-3일
- 재시도 로직: 1-2일
- 테스트 및 디버깅: 2-3일

---

### 4. 자동 당첨 확인 스케줄러

#### 4.1 목적
- 신청 마감일 + 1일 후 자동으로 당첨 여부 확인
- 사용자가 수동으로 확인하지 않아도 자동 처리

#### 4.2 구현 방안

**⚠️ Phase 1에서는 제외 (비용 및 리소스 문제)**

**이유:**
- Vercel Cron은 무료 플랜에서 제한적 (Pro 플랜 권장)
- 자동 스케줄러는 많은 함수 실행 시간 소모
- Phase 1 목표: 무료로 전 기능 오픈 → 비용 발생 방지

**Phase 2 이후 고려:**
- Vercel Cron Jobs 활용 (Pro 플랜 필요 시)
- 또는 GitHub Actions로 주기적 실행 (무료)
- 배치 처리로 비용 최소화

#### 4.3 구현 단계 (Phase 2로 연기)

**⚠️ 중요**: Phase 1에서는 스케줄러를 구현하지 않습니다.
- **비용 문제**: Vercel Cron Pro 플랜 필요 가능성
- **리소스 문제**: 많은 함수 실행 시간 소모
- **MVP는 수동 확인만 지원**: 사용자가 직접 버튼 클릭

**Phase 2 구현 내용:**

**Step 1: 스케줄러 API 구현**
- 신청 마감일이 어제인 북마크 조회
- **배치 처리**: 한 번에 최대 10-20건만 처리
- **우선순위 큐**: 사용자가 수동으로 확인한 적이 있는 신청 우선
- 각 신청에 대해 당첨 확인 API 호출
- 당첨된 경우 자동 처리

**Step 2: Vercel Cron 설정**
- `vercel.json`에 cron 설정 추가
- 매일 오전 9시 실행
- **비용 모니터링**: Vercel 대시보드에서 함수 실행 시간 추적

**Step 3: 에러 처리 및 로깅**
- 실패한 경우 다음 날 재시도 로직
- 로그 기록
- 모니터링 시스템 연동

**예상 공수**: 3-4일 (현실화됨)

---

### 5. 당첨 알림 시스템

#### 5.1 알림 채널
- 이메일 알림 (Resend 사용)
- 푸시 알림 (선택사항, 추후 구현)

#### 5.2 알림 시점
1. 자동 당첨 확인 시
2. 사용자가 수동으로 당첨 확인 시 (선택사항)

#### 5.3 구현 내용

**이메일 템플릿**
```typescript
// lib/email-templates/selection-notification.ts
// 당첨 축하 메시지
// 체험단 정보
// 리뷰 마감일 안내
```

**알림 발송 로직**
- 당첨 확인 API에서 자동 발송
- 스케줄러에서도 발송

**예상 공수**: 1-2일

---

## 🗓️ 전체 일정 계획 (현실화됨)

### Phase 0: 프로토타입 (1주) - **신규 추가**

**목표:**
- 리뷰노트 "내 신청 내역" 페이지 구조 파악
- 크롤링 가능 여부 확인
- 당첨 여부 판단 로직 프로토타입
- 공수 재추정

**구현 내용:**
- **Day 1-2**: 리뷰노트 "내 신청 내역" 페이지 분석
  - URL 구조 확인
  - 인증 방식 확인 (네이버 로그인 세션)
  - HTML 구조 분석
  - `__NEXT_DATA__` 데이터 확인
- **Day 3-4**: 프로토타입 크롤러 작성
  - Node.js + Cheerio로 크롤링 테스트
  - `__NEXT_DATA__` 파싱 또는 HTML 직접 파싱 테스트
  - 당첨 여부 판단 로직 프로토타입
  - Vercel 함수 실행 시간 측정 (10초 제한 확인)
- **Day 5**: 결과 분석 및 공수 재추정
  - 사이트 구조 분석 문서 작성
  - 프로토타입 코드 리뷰
  - 수정된 공수 추정

**결과물:**
- 사이트 구조 분석 문서
- 프로토타입 코드
- 수정된 공수 추정

---

### Phase 1 (MVP): 핵심 기능만 구현 (3-4주)

**목표:**
- **리뷰노트 1개 사이트만** 완벽하게 구현
- **완전 무료 운영**: Vercel 무료 플랜 내에서 모든 기능 제공
- 수동 입력은 항상 가능하도록 유지
- 자동 확인은 "보조 기능"으로 포지셔닝
- **비용 발생 방지**: 수익화 전까지 $0 유지

#### Week 1: 리뷰노트 크롤러 완성
- **Day 1-3**: Node.js 크롤러 구현 (Cheerio 사용)
  - "내 신청 내역" 페이지 크롤링 로직
  - HTML 파싱 및 당첨 여부 판단
  - `__NEXT_DATA__` 파싱 또는 HTML 직접 파싱
- **Day 4-5**: 네이버 세션 관리
  - 쿠키 암호화 저장
  - 세션 만료 감지

#### Week 2: 크롤러 API 구현 (무료 인프라)
- **Day 1-2**: Node.js 크롤러 구현
  - Cheerio를 사용한 HTML 파싱
  - 리뷰노트 "내 신청 내역" 페이지 크롤링
  - 당첨 여부 판단 로직
- **Day 3-4**: 크롤러 API 구현
  - Vercel API Route에서 직접 크롤링
  - 에러 처리 및 재시도 로직
  - 세션 만료 감지
- **Day 5**: 통합 테스트

#### Week 3: 세션 관리 및 보안
- **Day 1-2**: 세션 관리 개선
  - 쿠키 암호화 저장 (Supabase Vault)
  - 세션 만료 감지 및 알림
- **Day 3-4**: 에러 처리 강화
  - 네트워크 오류 vs 파싱 오류 vs 인증 오류 분류
  - 사용자 피드백: 실패 시 명확한 에러 메시지
- **Day 5**: 테스트 및 버그 수정

#### Week 4: 테스트 및 최적화
- **Day 1-3**: 통합 테스트
  - 실제 사이트에 대한 E2E 테스트 (rate limiting 주의)
  - 모의 데이터 테스트 (HTML 샘플 저장)
- **Day 4-5**: 모니터링 시스템 구축
  - Sentry 또는 유사 도구로 에러 모니터링
  - 일일 크롤링 성공률 리포트

**Phase 1 총 예상 기간**: 3-4주 (15-20일)

---

### Phase 2: 확장 및 자동화 (4-6주) - 수익화 후

**목표:**
- 추가 1-2개 사이트 지원
- 자동 확인 스케줄러 (제한적)
- **비용 고려**: 수익화 후 Vercel Pro 플랜 고려 가능

#### Week 5-6: 리뷰플레이스 크롤러
- **Day 1-3**: 사이트 구조 분석
- **Day 4-7**: 크롤러 구현
- **Day 8-10**: 테스트 및 최적화

#### Week 7-8: 자동 확인 스케줄러 (비용 최소화)
- **Day 1-2**: 스케줄러 API 구현
- **Day 3-4**: 배치 처리 및 우선순위 큐
- **Day 5**: GitHub Actions로 주기적 실행 (무료) 또는 Vercel Cron (Pro 플랜 필요 시)

#### Week 9-10: 당첨 알림 시스템
- **Day 1-2**: 이메일 템플릿 작성
- **Day 3-4**: 알림 발송 로직
- **Day 5**: 테스트

**Phase 2 총 예상 기간**: 4-6주 (20-30일)

---

### Phase 3: 나머지 사이트 및 개선 (지속적)

**목표:**
- 나머지 사이트들 점진적 추가
- 성능 최적화
- 사용자 피드백 반영

**총 예상 기간**: 8-12주 (40-60일)

---

## 🛠️ 기술 스택 및 도구 (수정됨)

### 필수 도구 (Phase 1: 무료)
- **Cheerio**: HTML 파싱 (Node.js에서, Vercel에서 실행)
- **Vercel**: 서버리스 함수 실행 (무료 플랜)
- **Supabase**: 데이터베이스 (무료 플랜)

### Phase 2 이후 고려 도구
- **Python + BeautifulSoup**: 크롤러 확장 시 (별도 서버 필요)
- **Railway/Render/AWS EC2**: 별도 서버 (수익화 후 고려)
- **Resend**: 이메일 발송 (Phase 2)
- **Vercel Pro**: 더 많은 함수 실행 시간 (60초 제한, 수익화 후)

### 선택 도구
- **Vercel Cron**: 스케줄링 (Phase 2)
- **Sentry**: 에러 모니터링 (필수)
- **Supabase Vault**: 쿠키 암호화 저장

### ❌ 제외된 도구
- **Puppeteer/Playwright**: Vercel 서버리스 환경에서 실행 불가능
- **별도 서버 (Railway/Render)**: Phase 1에서는 비용 발생으로 제외
- **Vercel Pro**: Phase 1에서는 무료 플랜으로 충분

---

## 📊 성공 지표 (현실화됨)

### Phase 1 완료 기준 (MVP)
- [ ] 리뷰노트 당첨 확인 성공률 **60% 이상** (초기 목표, 점진적 개선)
- [ ] 리뷰노트 1개 사이트 크롤러 구현 완료
- [ ] 크롤링 응답 시간 10초 이내 (Vercel 함수 실행 시간 제한 고려)
- [ ] 세션 만료 감지 및 알림 정상 작동
- [ ] 에러 모니터링 시스템 구축 완료

### Phase 2 완료 기준
- [ ] 리뷰노트 당첨 확인 성공률 **70% 이상** (개선 목표)
- [ ] 추가 1-2개 사이트 크롤러 구현 완료
- [ ] 자동 확인 스케줄러 정상 작동 (배치 처리)
- [ ] 당첨 알림 발송률 90% 이상

### 최종 목표 (장기)
- 자동 당첨 확인 성공률: **70-80%** (현실적 목표)
- 수동 입력 비율 감소: -40% (초기 목표)
- 당첨 누락률 감소: -30% (초기 목표)
- 사용자 만족도: 4.0/5.0 이상 (초기 목표)

**⚠️ 주의**: 초기 목표를 낮게 설정하고 점진적으로 개선

---

## 🔐 네이버 세션 쿠키 관리 (구체화됨)

### 쿠키 저장 구조

**쿠키 포맷:**
```typescript
// 쿠키는 JSON 배열로 저장
interface Cookie {
  name: string;      // 예: 'NID_AUT'
  value: string;     // 쿠키 값
  domain: string;    // 예: '.naver.com'
  path?: string;     // 예: '/'
  expires?: string; // 만료 시간 (ISO 8601)
}

// users.naver_session_cookies에 저장
// 예: JSON.stringify([{name: 'NID_AUT', value: '...', domain: '.naver.com'}, ...])
```

**암호화 저장 방법:**

**옵션 1: Supabase Vault (권장)**
```typescript
// Supabase Vault는 자동으로 암호화/복호화 처리
// 하지만 현재 Supabase 버전에서 지원 여부 확인 필요

// 대안: 환경 변수에 암호화 키 저장 후 직접 암호화
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.COOKIE_ENCRYPTION_KEY!;
const ALGORITHM = 'aes-256-gcm';

function encryptCookies(cookies: Cookie[]): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  
  let encrypted = cipher.update(JSON.stringify(cookies), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return JSON.stringify({
    iv: iv.toString('hex'),
    encrypted,
    authTag: authTag.toString('hex')
  });
}

function decryptCookies(encrypted: string): Cookie[] {
  const data = JSON.parse(encrypted);
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY, 'hex'),
    Buffer.from(data.iv, 'hex')
  );
  
  decipher.setAuthTag(Buffer.from(data.authTag, 'hex'));
  
  let decrypted = decipher.update(data.encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return JSON.parse(decrypted);
}
```

**옵션 2: 간단한 AES-256 암호화**
```typescript
// 위의 encryptCookies/decryptCookies 함수 사용
// 쿠키 저장 시: encryptCookies(cookies)
// 쿠키 사용 시: decryptCookies(encryptedCookies)
```

### 세션 만료 감지 로직

```typescript
// 세션 만료 감지 방법:

// 1. 크롤링 시도 시 401/403 에러 확인
async function checkSessionExpired(response: Response): boolean {
  if (response.status === 401 || response.status === 403) {
    return true;
  }
  
  // 2. "로그인이 필요합니다" 메시지 확인
  const text = await response.text();
  if (text.includes('로그인이 필요') || text.includes('로그인')) {
    return true;
  }
  
  // 3. 쿠키 만료 시간 추적 (가능한 경우)
  // 쿠키에 expires 필드가 있으면 확인
  // 하지만 네이버 쿠키는 보통 expires가 없음
  
  return false;
}

// 세션 만료 시 처리
if (await checkSessionExpired(response)) {
  // users 테이블에서 naver_session_cookies 삭제
  await supabase
    .from('users')
    .update({ naver_session_cookies: null })
    .eq('id', user.id);
  
  // 사용자에게 재로그인 요청
  throw new Error('세션이 만료되었습니다. 네이버로 다시 로그인해주세요.');
}
```

---

## ⚠️ 주의사항 및 리스크 (강화됨)

## 🔄 에러 처리 및 재시도 로직 (구체화됨)

### 에러 분류 및 처리 전략

```typescript
// 에러 타입 정의
enum ErrorType {
  NETWORK = 'NETWORK',        // 네트워크 오류
  AUTH = 'AUTH',              // 인증 오류
  PARSE = 'PARSE',            // 파싱 오류
  SERVER = 'SERVER',          // 사이트 서버 오류
  RATE_LIMIT = 'RATE_LIMIT',  // Rate Limiting
  UNKNOWN = 'UNKNOWN'         // 알 수 없는 오류
}

// 에러 타입별 처리 전략
const errorHandlingStrategy = {
  [ErrorType.NETWORK]: {
    retry: true,
    maxRetries: 3,
    backoff: 'exponential', // 1초, 2초, 4초
    userMessage: '네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
  },
  [ErrorType.AUTH]: {
    retry: false, // 즉시 실패
    userMessage: '세션이 만료되었습니다. 네이버로 다시 로그인해주세요.',
    action: 'REQUIRE_RELOGIN'
  },
  [ErrorType.PARSE]: {
    retry: false, // 즉시 실패
    userMessage: '페이지 구조가 변경되어 확인할 수 없습니다.',
    action: 'NOTIFY_DEVELOPER' // Sentry 알림
  },
  [ErrorType.SERVER]: {
    retry: true,
    maxRetries: 2,
    backoff: 'fixed', // 5초 간격
    userMessage: '사이트 서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
  },
  [ErrorType.RATE_LIMIT]: {
    retry: true,
    maxRetries: 1,
    backoff: 'fixed', // 10초 후
    userMessage: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.'
  },
  [ErrorType.UNKNOWN]: {
    retry: true,
    maxRetries: 1,
    backoff: 'fixed', // 3초 후
    userMessage: '오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
  }
};

// 에러 분류 함수
function classifyError(error: any, response?: Response): ErrorType {
  // 네트워크 오류
  if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
    return ErrorType.NETWORK;
  }
  
  // HTTP 상태 코드 기반 분류
  if (response) {
    if (response.status === 401 || response.status === 403) {
      return ErrorType.AUTH;
    }
    if (response.status === 429) {
      return ErrorType.RATE_LIMIT;
    }
    if (response.status >= 500) {
      return ErrorType.SERVER;
    }
  }
  
  // 파싱 오류 (특정 예외 메시지)
  if (error.message?.includes('parsing') || error.message?.includes('parse')) {
    return ErrorType.PARSE;
  }
  
  return ErrorType.UNKNOWN;
}

// 재시도 로직
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number,
  backoffType: 'exponential' | 'fixed',
  baseDelay: number = 1000
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries - 1) throw error;
      
      const delay = backoffType === 'exponential'
        ? baseDelay * Math.pow(2, attempt)
        : baseDelay;
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Max retries exceeded');
}
```

---

## 💰 비용 추정 (Phase 1: 무료 전략)

### ⚠️ Phase 1 목표: 완전 무료 운영

**핵심 원칙:**
- 수익화 전까지 비용 발생 방지
- Vercel 무료 플랜 내에서 모든 기능 제공
- 별도 서버 인프라 사용 안 함

### 월간 비용 분석 (Phase 1)

**Vercel 함수 실행 (무료 플랜)**
- 무료 플랜: 100GB-hours/월
- 예상 사용량:
  - 크롤러 API 호출: 일 100회 × 3초 = 300초/일
  - 월간: 9,000초 = 2.5시간
  - **예상 비용: 무료 플랜 내 (약 2.5% 사용)**
- 기타 API 호출 (검색, 신청 등): 일 1,000회 × 0.5초 = 500초/일
  - 월간: 15,000초 = 4.2시간
  - **총 사용량: 약 6.7시간/월 (무료 플랜 내)**

**Supabase (무료 플랜)**
- 무료 플랜: 500MB DB, 5GB 대역폭, 50,000 MAU
- 예상 사용량: 100MB DB (20%), 1.3GB 대역폭 (26%), 5,000 MAU (10%)
- **리스크**: 낮음 (여유 있음)

**GitHub Actions (기존 캠페인 크롤러 - 체험단 목록 수집)**
- **⚠️ 중요**: 당첨 확인 크롤러와는 별개
- **목적**: 체험단 사이트에서 새로운 체험단 정보 수집 (일 2회 실행)
- **실행 위치**: GitHub Actions
- **비용**: 
  - Public repository: 무제한 무료 ✅
  - Private repository: 2,000분/월 (예상 사용량: 1,800분/월 = 90% 사용)
- **권장**: Public repository로 전환 (무제한 무료, 리스크 제거)
- **리스크**: 중간 (Private repo인 경우)

**당첨 확인 크롤러 (신규)**
- **목적**: 사용자별 당첨 여부 확인 (사용자 요청 시 실시간 실행)
- **실행 위치**: Vercel API Route
- **비용**: Vercel 무료 플랜 내 (함수 실행 시간 포함)
- **리스크**: 낮음

**기타 서비스**
- Google Calendar API: 무료 (할당량 내, 비용 없음)
- Google OAuth / Naver OAuth: 무료 (무제한)
- Resend (이메일): 무료 티어 3,000건/월 (Phase 1에서는 미사용)

**총 예상 비용 (Phase 1): 월 $0 (완전 무료)**

### Phase 2 이후 비용 고려사항

**성장 후 (MAU 5,000명 이상):**
- Vercel Pro 플랜 고려: $20/월
  - 무료 플랜 한도 초과 시 필요
  - 더 많은 함수 실행 시간 필요
- Supabase Pro 플랜 고려: $25/월
  - 데이터베이스 크기 증가 시 필요
- **총 예상 비용: 월 $45-50 (수익화 후 고려)**

**비용 모니터링 계획:**
- Vercel 대시보드에서 함수 실행 시간 추적
- Supabase 대시보드에서 사용량 추적
- 월간 사용량 리포트 생성
- **무료 플랜 한도 80% 도달 시 알림 설정**

---

## 🧪 테스트 전략 (구체화됨)

### 테스트 케이스

**1. 정상 케이스**
- ✅ 당첨된 신청: `isSelected = true` 반환
- ✅ 미당첨 신청: `isSelected = false` 반환
- ✅ 신청 내역이 없는 경우: `isSelected = false` 반환

**2. 에러 케이스**
- ✅ 세션 만료: 명확한 에러 메시지 + 재로그인 요청
- ✅ 네트워크 오류: 재시도 후 실패 시 에러
- ✅ 파싱 오류: 개발자 알림 (Sentry)
- ✅ 사이트 서버 오류: 재시도 후 실패 시 에러

**3. 엣지 케이스**
- ✅ 신청 내역이 없는 경우
- ✅ 당첨 여부가 불명확한 경우 (예: "심사 중")
- ✅ 여러 개의 동일한 체험단 신청
- ✅ 쿠키 형식이 잘못된 경우
- ✅ 크롤러 서버가 다운된 경우

### 모의 데이터 구조

```python
# tests/fixtures/reviewnote_selected.html
# 실제 HTML 샘플 저장 (당첨된 경우)

# tests/fixtures/reviewnote_not_selected.html
# 실제 HTML 샘플 저장 (미당첨인 경우)

# tests/fixtures/reviewnote_session_expired.html
# 세션 만료 페이지 샘플
```

**테스트 실행 방법:**
```python
# tests/test_reviewnote_checker.py

def test_check_selection_selected():
    with open('tests/fixtures/reviewnote_selected.html') as f:
        html = f.read()
    # HTML 파싱 로직 테스트
    assert check_selection_parse(html, campaign_url) == True

def test_check_selection_not_selected():
    with open('tests/fixtures/reviewnote_not_selected.html') as f:
        html = f.read()
    assert check_selection_parse(html, campaign_url) == False
```

---

## 📊 성공 지표 측정 방법 (구체화됨)

### 성공률 측정 방법

**분자**: 성공한 크롤링 수
- `isSelected` 값이 정확하게 반환된 경우
- 사용자가 수동으로 확인한 결과와 일치하는 경우

**분모**: 전체 크롤링 시도 수
- 성공 + 실패 (에러 발생)
- 세션 만료로 인한 실패는 제외 (사용자 문제)

**데이터 수집:**
```typescript
// 각 크롤링 시도마다 로그 저장
interface CrawlingLog {
  id: string;
  user_id: string;
  application_id: string;
  site: string;
  success: boolean;
  error_type?: ErrorType;
  duration_ms: number;
  timestamp: string;
  user_verified?: boolean; // 사용자가 수동으로 확인한 결과와 일치하는지
}

// 주간 리포트 생성
interface WeeklyReport {
  week: string;
  total_attempts: number;
  successful: number;
  failed: number;
  success_rate: number;
  avg_duration_ms: number;
  error_breakdown: Record<ErrorType, number>;
}
```

**측정 주기:**
- 일일: 기본 통계
- 주간: 상세 리포트
- 월간: 트렌드 분석

---

## ⚖️ 법적 고려사항 실행 계획 (구체화됨)

### 법적 검토 체크리스트

**각 사이트마다 확인:**
- [ ] 이용약관에서 크롤링 금지 조항 확인
- [ ] robots.txt 확인
- [ ] 개인정보 처리방침 확인 (쿠키 사용 관련)
- [ ] 법무팀 또는 변호사 상담 (필요 시)

**사용자 동의:**
- [ ] 크롤링 사용에 대한 명시적 동의 UI
- [ ] 개인정보 처리방침 업데이트
- [ ] 쿠키 저장 및 활용에 대한 안내

**구현 방법:**
```typescript
// 사용자 동의 UI
// settings 페이지에 추가

<div className="space-y-4">
  <h3>당첨 확인 자동화</h3>
  <p>네이버 로그인 세션을 활용하여 당첨 여부를 자동으로 확인합니다.</p>
  
  <label>
    <input
      type="checkbox"
      checked={consent}
      onChange={(e) => setConsent(e.target.checked)}
    />
    당첨 확인 자동화 사용에 동의합니다.
  </label>
  
  <p className="text-sm text-gray-600">
    - 네이버 세션 쿠키가 암호화되어 저장됩니다.
    - 세션은 24시간 내 만료될 수 있습니다.
    - 동의를 철회할 수 있습니다.
  </p>
</div>
```

---

## 🚀 점진적 롤아웃 전략 (신규 추가)

### 1단계: 베타 테스트 (1-2주)
- 소수 사용자에게만 제공 (10-20명)
- 피드백 수집
- 버그 수정
- 성공률 모니터링

### 2단계: 제한적 공개 (2-4주)
- 리뷰노트 사용자 중 일부만 (50-100명)
- 성공률 모니터링
- 문제점 해결
- 사용자 피드백 반영

### 3단계: 전체 공개
- 모든 사용자에게 제공
- 지속적 모니터링
- 지속적 개선

---

## 🛡️ 폴백(Fallback) 전략 (신규 추가)

### 크롤링 실패 시 대응

**자동 확인 실패 시:**
1. 사용자에게 명확한 에러 메시지 표시
2. 수동 입력 버튼 강조
3. "나중에 다시 시도" 옵션 제공

**세션 만료 시:**
1. "네이버로 다시 로그인" 버튼 표시
2. 재로그인 후 자동 재시도
3. 세션 갱신 안내

**구현 예시:**
```typescript
// CheckSelectionButton 컴포넌트 개선

{result?.error && (
  <div className="space-y-2">
    <div className="text-red-600">{result.message}</div>
    
    {result.errorType === ErrorType.AUTH && (
      <button onClick={handleReLogin}>
        네이버로 다시 로그인
      </button>
    )}
    
    <button onClick={handleManualInput}>
      수동으로 입력하기
    </button>
    
    <button onClick={handleRetry}>
      나중에 다시 시도
    </button>
  </div>
)}
```

---

## ⚠️ 주의사항 및 리스크 (강화됨)

### 비용 관련 리스크 (Phase 1)

1. **Vercel 무료 플랜 한도 초과**
   - **위험**: 함수 실행 시간이 100GB-hours/월 초과 시 Pro 플랜 필요 ($20/월)
   - **대응**: 
     - 사용량 모니터링 필수
     - 함수 실행 시간 최적화
     - 무료 플랜 한도 80% 도달 시 알림
     - 한도 초과 시 기능 제한 또는 Phase 2로 연기

2. **Supabase 무료 플랜 한도 초과**
   - **위험**: 
     - 데이터베이스 크기 초과 시: Pro 플랜 필요 ($25/월)
     - 대역폭 초과 시: $0.09/GB 추가 비용
     - MAU 초과 시: $0.00325/MAU 추가 비용
   - **대응**: 
     - 사용량 모니터링 필수
     - 데이터 최적화 (불필요한 데이터 삭제, 오래된 로그 정리)
     - 쿼리 최적화 (페이지네이션, 인덱스)
     - 무료 플랜 한도 80% 도달 시 알림

3. **GitHub Actions 무료 플랜 한도 초과**
   - **위험**: Private repository에서 2,000분/월 초과 시 추가 비용 발생
     - Linux: $0.008/분
     - 예상: 1,800분/월 사용 (90% 사용률)
   - **대응**: 
     - **Public repository로 전환 (최우선 권장)**: 무제한 무료
     - 크롤러 실행 시간 최적화
     - 크롤러 실행 빈도 조정 (필요 시)
     - 무료 플랜 한도 80% 도달 시 알림

4. **예상치 못한 트래픽 급증**
   - **위험**: 갑작스러운 사용자 증가로 인한 비용 발생
   - **대응**: 
     - Rate Limiting 설정
     - 사용량 모니터링 및 알림
     - 필요 시 기능 제한 (예: 크롤링 빈도 제한)

### 기술적 리스크

1. **사이트 구조 변경**: 크롤러가 작동하지 않을 수 있음
   - **대응**: 
     - 정기적인 모니터링 및 업데이트
     - 파싱 실패율이 특정 임계값 초과 시 알림
     - 회귀 테스트: 사이트 구조 변경 감지

2. **로그인 세션 만료**: 네이버 세션 쿠키가 만료될 수 있음
   - **대응**: 
     - 세션 만료 감지 및 사용자 재로그인 안내
     - 세션 갱신 로직 (가능한 경우)
     - 사용자에게 주기적 재로그인 요청 (UX 저하, 하지만 필수)

3. **크롤링 차단**: 사이트에서 크롤링을 차단할 수 있음
   - **대응**: 
     - User-Agent 설정 (정당한 크롤러임을 표시)
     - 요청 간 최소 2-3초 간격 유지
     - Rate Limiting 준수

4. **Vercel 무료 플랜 한도 초과**: 함수 실행 시간이 100GB-hours/월 초과 시
   - **대응**: 
     - 사용량 모니터링 필수 (Vercel 대시보드)
     - 무료 플랜 한도 80% 도달 시 알림 설정
     - 함수 실행 시간 최적화 (캐싱, 배치 처리)
     - 한도 초과 시 Phase 2로 연기 또는 Vercel Pro 고려 (수익화 후)

5. **네트워크 오류 및 타임아웃**: 크롤링 중 자주 발생
   - **대응**: 
     - 재시도 로직 (최소 3회, 지수 백오프)
     - 에러 분류 및 적절한 처리

### 보안 리스크

1. **쿠키 평문 저장**: 민감한 인증 정보 노출 위험
   - **대응**: 
     - Supabase Vault 또는 환경 변수로 암호화 저장
     - 쿠키는 암호화하여 저장

2. **세션 정보 유출**: 데이터베이스 해킹 시 위험
   - **대응**: 
     - 최소 권한 원칙
     - 정기적인 보안 감사

### 법적/윤리적 고려사항 (강화됨)

1. **robots.txt 준수**: 각 사이트의 robots.txt 확인
   - **대응**: 
     - 크롤링 전 robots.txt 확인
     - 금지된 경로는 크롤링하지 않음

2. **과도한 요청 방지**: 적절한 요청 간격 유지
   - **대응**: 
     - 요청 간 최소 2-3초 간격
     - Rate Limiting 준수

3. **개인정보 보호**: 사용자 세션 쿠키 안전하게 관리
   - **대응**: 
     - 암호화 저장
     - 최소한의 정보만 저장
     - 사용자 동의: 크롤링 사용에 대한 명시적 동의

4. **서비스 약관 위반 가능성**
   - **대응**: 
     - 법무 검토: 각 사이트의 이용약관 확인
     - 크롤링 금지 사이트는 제외

5. **개인정보보호법 준수**
   - **대응**: 
     - 사용자 쿠키 저장 및 활용에 대한 명시적 동의
     - 개인정보 처리방침 업데이트

---

## 📝 다음 단계 (수정됨)

### 즉시 시작 가능한 작업 (Phase 1)
1. ✅ **리뷰노트 크롤러 완성** (가장 우선)
   - Node.js + Cheerio로 크롤러 구현
   - "내 신청 내역" 페이지 크롤링 로직
   - HTML 파싱 및 당첨 여부 판단
2. ✅ **크롤러 API 실제 로직 구현**
   - Vercel API Route에서 직접 크롤링
   - 사이트별 분기 처리
   - 에러 처리 및 재시도 로직
4. ✅ **세션 관리 개선**
   - 쿠키 암호화 저장
   - 세션 만료 감지

### 준비 작업
1. **Cheerio 패키지 설치**
   ```bash
   npm install cheerio
   npm install --save-dev @types/cheerio
   ```
2. **Supabase Vault 설정** (또는 간단한 AES 암호화)
   - 쿠키 암호화 저장
   - 환경 변수에 암호화 키 저장
3. **Sentry 계정 생성** (무료 티어 사용)
   - 에러 모니터링
   - 무료 플랜: 월 5,000 이벤트
4. **Vercel 대시보드 모니터링 설정**
   - 함수 실행 시간 추적
   - 무료 플랜 한도 모니터링
5. **Supabase 대시보드 모니터링 설정**
   - 데이터베이스 크기 추적
   - 대역폭 사용량 추적
   - MAU 추적
6. **GitHub Actions 최적화**
   - **Public repository로 전환 검토** (무제한 무료)
   - 또는 크롤러 실행 시간 최적화
7. **Resend API 키 설정** (Phase 2, 현재 미사용)
8. **Vercel Cron 설정 방법 확인** (Phase 2, 현재 미사용)

---

## 🔗 관련 파일 목록

### 구현 대상 파일
- `app/api/crawler/check-selection/route.ts` - 크롤러 API
- `lib/selection-checkers/reviewnote-checker.ts` - 리뷰노트 크롤러
- `lib/selection-checkers/reviewplace-checker.ts` - 리뷰플레이스 크롤러 (신규)
- `lib/selection-checkers/dinnerqueen-checker.ts` - 디너퀸 크롤러 (신규)
- `lib/selection-checkers/index.ts` - 크롤러 팩토리 (업데이트)
- `app/api/cron/check-selections/route.ts` - 스케줄러 (신규)
- `lib/email-templates/selection-notification.ts` - 이메일 템플릿 (신규)

### 참고 파일
- `app/api/applications/[id]/check-selection/route.ts` - 당첨 확인 API
- `components/features/CheckSelectionButton.tsx` - UI 컴포넌트
- `crawler/sites/*.py` - 기존 Python 크롤러 (참고용)

---

## 💡 추가 개선 아이디어

### Phase 1에서 필수 (재시도 로직)
1. **재시도 로직**: 크롤링 실패 시 자동 재시도 (최소 3회, 지수 백오프)
2. **에러 분류**: 네트워크 오류 vs 파싱 오류 vs 인증 오류
3. **상세 로그**: 크롤링 과정 상세 로깅

### Phase 2 개선
1. **캐싱**: 동일 체험단의 중복 확인 방지
2. **모니터링 대시보드**: 일일 크롤링 성공률 리포트
3. **사이트 구조 변경 감지**: 파싱 실패율이 특정 임계값 초과 시 알림

### 장기 개선
1. **AI 기반 당첨 확인**: HTML 구조 변경에 강건한 방법
2. **사용자 피드백**: 크롤링 결과 정확도 피드백 수집
3. **통계 대시보드**: 당첨 확인 성공률, 사이트별 통계
4. **A/B 테스트**: 자동 확인 vs 수동 입력의 정확도 비교

---

## 📋 체크리스트

### Phase 0: 프로토타입 체크리스트

- [ ] 리뷰노트 "내 신청 내역" 페이지 URL 확인
- [ ] 인증 방식 확인 (네이버 로그인 세션)
- [ ] HTML 구조 분석
- [ ] `__NEXT_DATA__` 데이터 확인
- [ ] 당첨 여부 판단 로직 프로토타입 작성
- [ ] 사이트 구조 분석 문서 작성
- [ ] 공수 재추정

### Phase 1 (MVP) 체크리스트

#### Week 1: 리뷰노트 크롤러 완성
- [ ] Node.js 크롤러에 `checkReviewNoteSelection` 함수 추가
- [ ] "내 신청 내역" 페이지 크롤링 로직 구현
- [ ] HTML 파싱 및 당첨 여부 판단 로직
- [ ] 네이버 세션 쿠키 활용 로직
- [ ] 에러 처리 및 엣지 케이스 처리

#### Week 2: 크롤러 API 구현 (무료 인프라)
- [ ] Cheerio 패키지 설치 및 설정
- [ ] Node.js 크롤러 구현 (리뷰노트)
  - "내 신청 내역" 페이지 크롤링 로직
  - HTML 파싱 및 당첨 여부 판단
  - __NEXT_DATA__ 파싱 (Next.js 앱)
- [ ] 크롤러 API 엔드포인트 구현 (`/api/crawler/check-selection`)
- [ ] 에러 처리 및 재시도 로직 (에러 분류별 전략 적용)
- [ ] 세션 만료 감지 로직

#### Week 3: 세션 관리 및 보안
- [ ] 쿠키 저장 구조 정의 (JSON 배열)
- [ ] 쿠키 암호화 로직 구현 (AES-256-GCM)
- [ ] 암호화 키 환경 변수 설정
- [ ] 세션 만료 감지 로직 (401/403, 메시지 확인)
- [ ] 사용자 재로그인 안내 UI
- [ ] 에러 분류 시스템 구현 (네트워크/파싱/인증/서버/Rate Limit)
- [ ] 사용자 피드백: 명확한 에러 메시지

#### Week 4: 테스트 및 모니터링
- [ ] 테스트 케이스 작성 (정상/에러/엣지 케이스)
- [ ] 모의 데이터 준비 (HTML 샘플 저장)
- [ ] 통합 테스트 (실제 사이트 E2E, rate limiting 주의)
- [ ] 모의 데이터 테스트 실행
- [ ] Sentry 에러 모니터링 설정
- [ ] 크롤링 로그 저장 구조 구현
- [ ] 일일 크롤링 성공률 리포트 생성 로직
- [ ] 회귀 테스트: 사이트 구조 변경 감지

### Phase 2 체크리스트 (예정)

#### 사전 조사
- [ ] 리뷰플레이스 사이트 구조 분석
- [ ] 디너퀸 사이트 구조 분석
- [ ] 각 사이트별 크롤링 가능 여부 확인
- [ ] 우선순위 재조정

#### 구현
- [ ] 추가 사이트 크롤러 구현 (1-2개)
- [ ] 자동 확인 스케줄러 구현
- [ ] 당첨 알림 시스템 구현

---

---

## 📝 요약

### 핵심 내용

이 계획은 **당첨 확인 기능**을 구현하기 위한 상세한 로드맵입니다. 비판적 분석과 재검토를 거쳐 현실적이고 구체적인 실행 계획으로 발전시켰습니다.

**주요 특징:**
- ✅ **현실적인 일정**: 8-12주 (Phase 0 포함)
- ✅ **구체적인 구현 방법**: 코드 예시, API 구조, 에러 처리 전략
- ✅ **안전한 접근**: 보안, 법적 고려사항, 점진적 롤아웃
- ✅ **측정 가능한 목표**: 성공 지표, 테스트 전략, 모니터링
- ✅ **완전 무료 전략**: Phase 1 비용 $0 (Vercel 무료 플랜 내)

### 비용 전략

**Phase 1 (0~6개월): 완전 무료**
- Vercel 무료 플랜: 100GB-hours/월 (예상 사용량: 6.7시간/월)
- Supabase 무료 플랜: 500MB DB, 2GB 대역폭
- **총 비용: 월 $0**

**Phase 2 (수익화 후): 비용 고려**
- Vercel Pro: $20/월 (필요 시)
- Supabase Pro: $25/월 (필요 시)
- **총 비용: 월 $45-50 (수익화 후 고려)**

### 다음 단계

1. **즉시 시작**: Phase 0 프로토타입 단계
   - 리뷰노트 "내 신청 내역" 페이지 분석
   - 프로토타입 크롤러 작성
   - 공수 재추정

2. **준비 작업**:
   - Cheerio 패키지 설치 (`npm install cheerio`)
   - Sentry 계정 생성
   - 암호화 키 생성
   - Vercel 환경 변수 설정 확인

3. **Phase 1 시작**: 프로토타입 완료 후
   - 리뷰노트 크롤러 완성 (Node.js + Cheerio)
   - Vercel API Route 구현
   - 에러 처리 및 재시도 로직
   - 테스트 및 모니터링

---

**작성일**: 2024-12-19  
**최종 수정일**: 2024-12-19 (비용 최소화 반영)  
**작성자**: AI Assistant  
**버전**: 3.1 (비용 최소화 반영)  
**상태**: 구체화된 실행 계획 (완전 무료 전략)  
**참고 문서**: 
- `SELECTION_CHECK_CRITICAL_ANALYSIS.md` (비판적 분석)
- `SELECTION_CHECK_REVIEW_V2.md` (재검토 결과)

**⚠️ 중요 변경사항 (v3.1)**
- Phase 1 비용: **월 $0 (완전 무료)**
- 기술 스택: Python 크롤러 + 별도 서버 → Node.js + Cheerio (Vercel 직접 실행)
- 자동 스케줄러: Phase 2로 연기 (비용 문제)

## 📋 주요 개선 사항 (v3.0)

1. ✅ **Phase 0 프로토타입 단계 추가**: 사전 조사 및 프로토타입
2. ✅ **Phase 1 목표 수정**: "다른 사이트" 제거, 리뷰노트만
3. ✅ **별도 서버 인프라 구체화**: Railway/Render 선택 기준, API 구조
4. ✅ **네이버 세션 쿠키 관리 구체화**: 저장 구조, 암호화 방법, 만료 감지
5. ✅ **에러 처리 구체화**: 에러 분류, 재시도 전략, 사용자 메시지
6. ✅ **비용 추정 상세화**: 월간 비용 분석, 모니터링 계획
7. ✅ **테스트 전략 구체화**: 테스트 케이스, 모의 데이터 구조
8. ✅ **성공 지표 측정 방법**: 데이터 수집, 리포트 구조
9. ✅ **법적 고려사항 실행 계획**: 체크리스트, 사용자 동의 UI
10. ✅ **점진적 롤아웃 전략**: 베타 → 제한적 공개 → 전체 공개
11. ✅ **폴백 전략**: 실패 시 대응 방법
12. ✅ **사이트별 복잡도 분석**: 사전 조사 체크리스트

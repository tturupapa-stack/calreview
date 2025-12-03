# 🎯 캘리뷰 (Calreview) 기획서

> 작성일: 2024-12-03  
> 버전: v1.0  
> 상태: 기획완료

---

## 1. 프로젝트 개요

### 한 줄 요약
체험단 통합 검색 + 구글 캘린더 연동으로 일정 관리까지 한번에 해결하는 서비스

### 해결하려는 문제
- **현재 상황**: 체험단 사이트가 70개 이상으로 너무 많고, 각 사이트마다 특성이 달라 일일이 확인해야 함
- **문제점**: 
  - 여러 사이트를 돌아다니며 체험단 찾는 데 시간 낭비
  - 당첨 후 방문일, 리뷰 마감일 관리가 어려움 (누구랑, 어디로, 몇시에, 마감일이 언제인지 헷갈림)
  - 리뷰 마감일 놓쳐서 패널티 받는 경우 발생
- **이 서비스로 해결되는 것**: 
  - 한 곳에서 여러 사이트 체험단 검색
  - 당첨 시 구글 캘린더 자동 연동으로 일정 관리
  - 마감 알림으로 리뷰 작성 놓치지 않음

### 타겟 유저
- **주요 타겟**: 월 5회 이상 체험단 활동하는 블로거/인스타그래머
- **부 타겟**: 체험단 막 시작한 초보 블로거
- **유저 특성**: 20-40대 여성, 일정 관리에 어려움을 느끼는 활발한 체험단 활동자
- **예상 사용 빈도**: 주 3-5회 (체험단 검색 및 관리)

---

## 2. 핵심 기능 정의

### MVP 기능 (반드시 필요)

| 우선순위 | 기능명 | 설명 | 무료/프리미엄 |
|---------|-------|------|--------------|
| P0 | 체험단 통합 검색 | 5개 사이트 크롤링 + 필터(지역, 카테고리, 마감순, 유형) | 무료 |
| P0 | 회원가입/로그인 | 카카오, 구글 소셜 로그인 | 무료 |
| P0 | 신청 트래킹 | "신청함" 버튼으로 내가 신청한 체험단 목록 관리 | 무료 |
| P0 | 당첨 등록 | 당첨 시 "당첨" 체크 + 방문일/마감일 입력 | 무료 |
| P0 | 구글 캘린더 연동 | 당첨 등록 시 구글 캘린더에 자동 일정 생성 | **프리미엄** |
| P0 | 마감 알림 | D-3, D-1 이메일 알림 | **프리미엄** |

### 확장 기능 (나중에 추가)

| 우선순위 | 기능명 | 설명 | 예상 난이도 |
|---------|-------|------|------------|
| P1 | 경쟁률 표시 | 실시간 신청자 수 / 모집 인원 | 보통 |
| P1 | 새 체험단 알림 | 관심 카테고리/지역 새 체험단 오픈 시 알림 | 보통 |
| P1 | 당첨 이력 분석 | 월별 당첨 횟수, 사이트별 통계 | 쉬움 |
| P1 | 크롤링 사이트 확장 | 서울오빠, 포블로그, 미블 등 추가 | 보통 |
| P2 | 카카오 알림톡 | 이메일 대신 카톡 알림 | 보통 |
| P2 | 광고주 대시보드 | B2B 확장용 자체 체험단 등록 | 어려움 |

---

## 3. 크롤링 대상 사이트 (MVP)

| 순위 | 사이트 | URL | 특징 |
|------|--------|-----|------|
| 1 | 리뷰노트 | reviewnote.co.kr | 캠페인 수 최다, 신흥 1위 |
| 2 | 레뷰 (REVU) | revu.net | 가장 오래된 NO.1, 회원 많음 |
| 3 | 디너의여왕 | dinnerqueen.net | 맛집 특화, 제공 내역 퀄리티 |
| 4 | 강남맛집 | 강남맛집.net | 맛집 특화 |
| 5 | 리뷰플레이스 | reviewplace.co.kr | 퀄리티 좋은 캠페인 |

---

## 4. 유저 플로우

### 메인 시나리오 (무료 사용자)

```
1. [진입] 캘리뷰 접속 (검색 또는 직접 URL)
   ↓
2. [검색] 지역/카테고리/유형 필터로 체험단 검색
   ↓
3. [상세] 마음에 드는 체험단 클릭 → 상세 정보 확인
   ↓
4. [신청] "원본 사이트에서 신청" 버튼 → 해당 사이트로 이동
   ↓
5. [트래킹] 캘리뷰로 돌아와 "신청함" 버튼 클릭
   ↓
6. [결과] 당첨되면 "당첨" 체크
   ↓
7. [유도] "구글 캘린더 연동은 프리미엄 기능입니다" → 업그레이드 유도
```

### 메인 시나리오 (프리미엄 사용자)

```
1~5. (무료와 동일)
   ↓
6. [당첨 등록] "당첨" 체크 + 방문 예정일, 리뷰 마감일 입력
   ↓
7. [자동 연동] 구글 캘린더에 일정 2개 생성
   - 방문일: "캘리뷰: [가게명] 방문"
   - 마감일: "캘리뷰: [가게명] 리뷰 마감"
   ↓
8. [알림] D-3, D-1에 리뷰 마감 이메일 알림
   ↓
9. [완료] 리뷰 작성 후 "완료" 체크 → 통계에 반영
```

### 화면 목록

| 화면명 | 경로 | 주요 요소 |
|-------|------|----------|
| 랜딩/메인 | `/` | 서비스 소개, 검색 바로가기, 프리미엄 안내 |
| 검색 | `/search` | 필터 (지역, 카테고리, 유형, 마감순), 체험단 리스트 |
| 체험단 상세 | `/campaign/[id]` | 상세 정보, 원본 링크, 신청/당첨 버튼 |
| 내 신청 목록 | `/my/applied` | 신청한 체험단 리스트, 상태 관리 |
| 내 당첨 목록 | `/my/selected` | 당첨 체험단, 캘린더 연동 상태, 마감일 표시 |
| 프리미엄 | `/premium` | 기능 비교, 가격, 결제 |
| 설정 | `/settings` | 알림 설정, 캘린더 연결, 계정 관리 |
| 로그인 | `/login` | 카카오/구글 소셜 로그인 |

---

## 5. 데이터 구조

### User (사용자)
```
- id: uuid (PK)
- email: string
- name: string
- avatar_url: string (nullable)
- provider: enum (kakao, google)
- is_premium: boolean (default: false)
- premium_plan: enum (monthly, yearly, null)
- premium_started_at: timestamp (nullable)
- premium_expires_at: timestamp (nullable)
- google_calendar_connected: boolean (default: false)
- google_refresh_token: string (nullable, encrypted)
- notification_email: boolean (default: true)
- created_at: timestamp
- updated_at: timestamp
```

### Campaign (체험단)
```
- id: uuid (PK)
- source: enum (reviewnote, revu, dinnerqueen, gangnam, reviewplace)
- source_id: string (원본 사이트 ID)
- source_url: string (원본 링크)
- title: string
- description: text (nullable)
- thumbnail_url: string (nullable)
- category: enum (food, beauty, product, travel, etc)
- region: string (서울 강남구, 경기 성남시 등)
- type: enum (visit, delivery, reporter)
- reward: string (제공 내역 설명)
- reward_value: integer (nullable, 추정 가치)
- capacity: integer (모집 인원)
- application_deadline: timestamp (신청 마감일)
- review_deadline_days: integer (nullable, 체험 후 며칠 내 작성)
- is_active: boolean (default: true)
- created_at: timestamp (크롤링 시점)
- updated_at: timestamp
```

### Application (신청/당첨 관리)
```
- id: uuid (PK)
- user_id: uuid (FK → User)
- campaign_id: uuid (FK → Campaign)
- status: enum (applied, selected, completed, cancelled)
- visit_date: date (nullable, 당첨 시 입력)
- review_deadline: date (nullable, 당첨 시 입력)
- calendar_visit_event_id: string (nullable)
- calendar_deadline_event_id: string (nullable)
- reminder_d3_sent: boolean (default: false)
- reminder_d1_sent: boolean (default: false)
- notes: text (nullable, 메모)
- created_at: timestamp
- updated_at: timestamp
```

### Payment (결제 이력)
```
- id: uuid (PK)
- user_id: uuid (FK → User)
- plan: enum (monthly, yearly)
- amount: integer
- payment_key: string (토스페이먼츠)
- status: enum (pending, completed, cancelled, refunded)
- paid_at: timestamp (nullable)
- created_at: timestamp
```

### 데이터 관계
```
[User] 1:N [Application] N:1 [Campaign]
[User] 1:N [Payment]
```

---

## 6. 기술 스택

| 구분 | 기술 | 선택 이유 |
|------|-----|----------|
| 프론트엔드 | Next.js 14 (App Router) | SSR/SEO, 빠른 개발 |
| 스타일링 | Tailwind CSS | 빠른 UI 개발 |
| 백엔드/DB | Supabase | 인증, DB, 실시간 통합 |
| 크롤링 | Python + BeautifulSoup | 유연한 크롤링 |
| 크롤링 스케줄 | GitHub Actions or Supabase Edge Functions | 무료/저렴한 스케줄링 |
| 캘린더 연동 | Google Calendar API | 핵심 프리미엄 기능 |
| 결제 | 토스페이먼츠 | 국내 결제, 낮은 수수료 |
| 이메일 | Resend or Supabase | 알림 발송 |
| 배포 | Vercel | 간편한 배포, 무료 티어 |

### 외부 연동
- [x] Google OAuth (로그인 + 캘린더)
- [x] Kakao OAuth (로그인)
- [x] Google Calendar API (일정 생성)
- [x] 토스페이먼츠 API (결제)
- [x] Resend API (이메일 알림)

---

## 7. 비즈니스 모델

### 가격 정책

| 플랜 | 가격 | 기능 |
|------|------|------|
| 무료 | 0원 | 검색, 신청 트래킹, 당첨 등록 (수동) |
| 프리미엄 월간 | 4,900원/월 | + 구글 캘린더 연동, 마감 알림, 광고 제거 |
| 프리미엄 연간 | 49,000원/년 | 월간과 동일 (17% 할인, 월 ~4,083원) |

### 수익 목표

| 시점 | MAU | 유료 전환 (5%) | 월 수익 |
|------|-----|---------------|--------|
| 3개월 | 500명 | 25명 | 12만원 |
| 6개월 | 2,000명 | 100명 | 49만원 |
| 12개월 | 10,000명 | 500명 | 245만원 |

### Phase 3 확장 (B2B)
- 자체 체험단 중개 플랫폼
- 광고주 대시보드
- 데이터 리포트 판매

---

## 8. 디자인 방향

### 레퍼런스
- 전체 분위기: 깔끔하고 모던한 SaaS 느낌
- 참고: Notion, Linear, 토스

### UI 키워드
- 스타일: 미니멀, 모던, 깔끔
- 메인 컬러: 보라/파랑 계열 (캘린더 느낌)
- 서브 컬러: 화이트, 그레이
- 폰트: Pretendard (한글), Inter (영문)

### 핵심 UI 원칙
- 검색 결과는 카드형 리스트
- 필터는 상단 고정
- 모바일 퍼스트 (반응형)
- 프리미엄 기능은 자연스럽게 노출 (락 아이콘)

---

## 9. 일정 계획

| 단계 | 기간 | 산출물 |
|------|------|--------|
| 기획 완료 | 완료 | 이 문서 |
| 프로젝트 셋업 | 1-2일 | Next.js, Supabase 초기 설정 |
| 크롤러 개발 | 5-7일 | 5개 사이트 크롤링 + DB 저장 |
| 인증/회원 | 2-3일 | 소셜 로그인, 프로필 |
| 검색 기능 | 3-4일 | 필터, 리스트, 상세 페이지 |
| 신청/당첨 관리 | 3-4일 | 트래킹, 상태 관리 |
| 캘린더 연동 | 3-4일 | Google Calendar API |
| 결제 연동 | 2-3일 | 토스페이먼츠 |
| 알림 시스템 | 2-3일 | 이메일 알림 |
| 테스트/수정 | 3-4일 | QA, 버그 수정 |
| **MVP 출시** | **~6주** | 베타 오픈 |

---

## 10. 리스크 & 대응

| 리스크 | 대응 방안 |
|--------|----------|
| 크롤링 차단 | User-Agent 로테이션, 요청 간격 조절, 필요시 해당 사이트 제외 |
| 사이트 구조 변경 | 크롤러 모듈화로 빠른 수정 가능하게 |
| 낮은 유료 전환율 | 프리미엄 기능 체험 기간 제공 (7일 무료) |
| 경쟁 서비스 | 캘린더 연동이라는 명확한 차별점 유지 |

---

## 11. 성공 지표

### 정량 지표
- [ ] 출시 1개월: MAU 200명
- [ ] 출시 3개월: MAU 500명, 유료 전환 5%
- [ ] 출시 6개월: MAU 2,000명

### 정성 지표
- [ ] "캘린더 연동 덕분에 마감 안 놓쳐요" 피드백
- [ ] 재방문율 50% 이상
- [ ] 프리미엄 해지율 10% 이하

---

*이 문서는 개발 진행하면서 계속 업데이트합니다*

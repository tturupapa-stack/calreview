# 캘리뷰 개발 진행 상황

> 최종 업데이트: 2025-12-08 (디자인 리뉴얼 & 상세 지역 필터 구현)

## 📊 전체 진행률

- **Phase 0**: 기획 ✅ 100%
- **Phase 1**: 프로젝트 셋업 ✅ 100%
- **Phase 2**: 크롤러 개발 ✅ 95% (Supabase DB 저장 제외)
- **Phase 3**: 인증/회원 시스템 ✅ 90% (OAuth 설정 필요)
- **Phase 4**: 검색 기능 ✅ 80% (스마트 서치 구현 중)
- **Phase 5**: 신청/당첨 관리 ⏸️ 0%
- **Phase 6**: 프리미엄 기능 ⏸️ 0%
- **Phase 7**: 테스트 & QA ⏸️ 0%
- **Phase 8**: 배포 & 런칭 ⏸️ 0%

**전체 진행률**: 약 45%

---

## ✅ 완료된 작업

### Phase 1: 프로젝트 셋업
- ✅ Next.js 프로젝트 생성 (App Router, Tailwind CSS)
- ✅ 폴더 구조 정리
- ✅ Supabase 프로젝트 생성 및 연결
- ✅ 환경 변수 설정
- ✅ 기본 레이아웃 및 헤더 구현

### Phase 2: 크롤러 개발
- ✅ Python 환경 설정 (venv)
- ✅ 공통 Campaign 스키마 정의
  - 필드: title, url, site_name, category, deadline, location, image_url, channel
- ✅ 4개 사이트 크롤러 구현
  - ✅ 리뷰노트: D-day 계산, 채널 정보 추출
  - ✅ 디너의여왕: 채널 정보 추출 (기본값: 블로그)
  - ✅ 강남맛집: 카테고리, 지역, 마감일 추출
  - ✅ 리뷰플레이스: 카테고리, 채널 아이콘 순서 기반 추출
- ✅ GitHub Actions 스케줄링 설정 (하루 3회: 오전 9시, 오후 3시, 오후 9시)
- ✅ 크롤링 결과 JSON 파일 저장

### Phase 3: 인증/회원 시스템
- ✅ 로그인 페이지 UI (`/login`)
- ✅ 카카오/구글 로그인 연동 코드 구현
- ✅ 인증 콜백 처리 (`/auth/callback`)
- ✅ 세션 관리 및 미들웨어
- ✅ 사용자 프로필 메뉴 컴포넌트 (UserMenu)
- ✅ 로그아웃 기능
- ✅ 보호된 라우트 설정 (`/my/*`)
- ✅ Supabase 데이터베이스 설정
  - ✅ users, campaigns, applications, payments 테이블 생성
  - ✅ auth.users → public.users 자동 동기화 트리거
  - ✅ RLS 정책 설정
- ✅ 환경 변수 설정 완료

### Phase 4: 검색 기능 (진행 중)
- [x] 검색 페이지 UI (`/search`)
- [x] 필터 컴포넌트 (지역, 카테고리, 유형, 정렬)
- [x] 검색 API 엔드포인트 (`/api/campaigns`)
- [x] Supabase 쿼리 최적화
- [x] 체험단 상세 페이지 (`/campaign/[id]`)
- [x] Supabase에 크롤링 데이터 저장
- [x] **스마트 서치 기능 구현**
  - [x] 자연어 검색 파서 (`lib/search-parser.ts`)
  - [x] 검색 API에 자연어 쿼리 처리 추가
  - [x] 검색 기록 저장 기능 (Supabase 테이블 생성)
  - [x] 자연어 검색 입력 UI (검색창 개선)
  - [ ] 자주 찾는 태그 컴포넌트 구현

### Phase 4.6: Crawler & Search Improvements (완료)
- [x] **크롤러 안정화**
  - [x] 상세 페이지 크롤링(리뷰 기간 추출) 타임아웃 오류 수정 (`seoulouba`, `modooexperience`, `pavlovu`)
  - [x] 크롤러 성능 개선 (타임아웃 시간 단축)
  - [x] 마감된 캠페인 데이터베이스 정리 및 비활성화 로직 확인
- [x] **검색 기능 개선**
  - [x] 마감된 캠페인 자동 필터링 (KST 기준)
  - [x] 검색 결과 페이지네이션 중복 키 오류 수정 (Deduplication)
  - [x] **채널 필터 추가** (블로그, 인스타, 유튜브 등)

### Phase 4.5: Design System Upgrade (완료)
- [x] **디자인 시스템 고도화**
  - [x] Tailwind CSS v4 Theme 설정 (`globals.css`)
  - [x] Typography 개선: `Inter` (본문), `Outfit` (헤딩) 적용
  - [x] Color System 재정의 (HSL 변수 기반)
- [x] **UI 컴포넌트 리팩토링**
  - [x] `Button`: cva 기반의 변형(Variant) 지원 컴포넌트 구현
  - [x] `Card`: 프리미엄 스타일(그림자, 테두리, 배경 흐림) 적용
  - [x] `Header` / `Footer`: 인라인 스타일 제거 및 Tailwind 클래스 적용
- [x] **페이지 디자인 리뉴얼**
  - [x] 랜딩 페이지 (`/`): 히어로 섹션, 그라디언트 배경, 기능 소개 그리드 디자인 

---

## 📝 주요 파일 구조

```
/app
  /(auth)
    /login          # 로그인 페이지 ✅
  /auth
    /callback       # OAuth 콜백 처리 ✅
  /api              # API Routes
  /(main)           # 메인 페이지
/components
  /ui
    Button.tsx      # 버튼 컴포넌트 ✅
    Card.tsx        # 카드 컴포넌트 ✅
    Footer.tsx      # 푸터 컴포넌트 ✅
    Header.tsx      # 헤더 컴포넌트 ✅
  /features
    UserMenu.tsx    # 사용자 메뉴 ✅
/lib
  supabase.ts       # 클라이언트 Supabase 클라이언트 ✅
  supabase-server.ts # 서버 Supabase 클라이언트 ✅
  search-parser.ts  # 자연어 검색 파서 ✅
/crawler
  /sites            # 4개 사이트 크롤러 ✅
  main.py           # 크롤러 실행 스크립트 ✅
  models.py         # Campaign 스키마 ✅
/.github
  /workflows
    crawler.yml     # GitHub Actions 워크플로우 ✅
```

---

## 🔧 기술 스택 현황

- ✅ Next.js 14 (App Router)
- ✅ Tailwind CSS
- ✅ TypeScript
- ✅ Supabase (Auth, PostgreSQL)
- ✅ Python (BeautifulSoup, requests)
- ✅ GitHub Actions
- ⏸️ Google Calendar API (Phase 6)
- ⏸️ 토스페이먼츠 (Phase 6)
- ⏸️ Resend (Phase 6)

---

## 📅 다음 마일스톤

1. **OAuth 설정 완료** (Phase 3 마무리)
   - 카카오/구글 로그인 테스트
   - 사용자 프로필 확인

2. **Phase 4 진행 중** (검색 기능)
   - ✅ Supabase에 크롤링 데이터 저장 완료
   - ✅ 검색 페이지 UI 구현 완료
   - ✅ 필터 기능 구현 완료
   - ✅ 스마트 서치 기능 구현 중
     - ✅ 자연어 검색 파서 완료
     - ✅ 검색 API 개선 완료
     - ⏸️ 자연어 검색 입력 UI 구현 필요
     - ⏸️ 자주 찾는 태그 컴포넌트 구현 필요

---

## 🐛 알려진 이슈

- 없음

---

## 📚 참고 문서

- [기획서](./PROJECT_PLANNING.md)
- [개발 체크리스트](./DEVELOPMENT_CHECKLIST.md)
- [Phase 3 설정 가이드](./PHASE3_SETUP.md)
- [GitHub Actions 설정 가이드](./GITHUB_ACTIONS_SETUP.md)
- [스마트 서치 기능 가이드](./SMART_SEARCH.md)
- [디자인 시스템](./DESIGN_SYSTEM.md)


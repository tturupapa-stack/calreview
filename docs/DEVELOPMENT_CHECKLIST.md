# ✅ 캘리뷰 (Calreview) 개발 체크리스트

> 시작일: 2024-12-03  
> 목표 배포일: 6주 내 (2025-01 중순)  
> 현재 단계: 🔴 기획완료 → 개발 시작

---

## Phase 0: 기획 ✅ 완료

- [x] 서비스 아이디어 정의
- [x] 경쟁 서비스 분석 (인플렉서, 콜라보매니저)
- [x] 차별점 정의 (구글 캘린더 연동)
- [x] 수익 모델 설계 (프리미엄 구독)
- [x] MVP 기능 범위 확정
- [x] 크롤링 대상 사이트 선정 (5개)
- [x] 기술 스택 결정
- [x] PROJECT_PLANNING.md 작성

---

## Phase 1: 프로젝트 셋업 ⏱️ 1-2일

### 개발 환경
- [ ] 프로젝트 폴더 생성
- [ ] Git 초기화
- [ ] GitHub 레포지토리 생성 & 연결
- [ ] .gitignore 설정
- [ ] .env.local 파일 생성

### Next.js 설정
- [ ] `npx create-next-app@latest calreview` (App Router)
- [ ] Tailwind CSS 확인
- [ ] 폴더 구조 정리
  ```
  /app
    /api
    /(auth)
    /(main)
  /components
  /lib
  /types
  ```
- [ ] 기본 레이아웃 설정

### Supabase 설정
- [ ] Supabase 프로젝트 생성
- [ ] 환경 변수 설정 (SUPABASE_URL, SUPABASE_ANON_KEY)
- [ ] Supabase 클라이언트 설정 (`/lib/supabase.ts`)
- [ ] 테이블 생성 (users, campaigns, applications, payments)
- [ ] RLS(Row Level Security) 정책 설정

### 배포 설정
- [ ] Vercel 프로젝트 연결
- [ ] 환경 변수 Vercel에 등록
- [ ] 자동 배포 확인

**Phase 1 완료 체크**: `npm run dev`로 기본 화면 + Supabase 연결 확인? ✅

---

## Phase 2: 크롤러 개발 ⏱️ 5-7일

### 크롤러 환경 설정
- [ ] Python 환경 설정 (venv)
- [ ] 필요 패키지 설치 (requests, beautifulsoup4, supabase-py)
- [ ] Supabase 연결 테스트

### 사이트별 크롤러 개발

**리뷰노트 (reviewnote.co.kr)**
- [ ] 페이지 구조 분석
- [ ] 크롤링 로직 구현
- [ ] 데이터 파싱 (제목, 카테고리, 지역, 마감일 등)
- [ ] DB 저장 테스트
- [ ] 중복 체크 로직

**레뷰 (revu.net)**
- [ ] 페이지 구조 분석
- [ ] 크롤링 로직 구현
- [ ] 데이터 파싱
- [ ] DB 저장 테스트

**디너의여왕 (dinnerqueen.net)**
- [ ] 페이지 구조 분석
- [ ] 크롤링 로직 구현
- [ ] 데이터 파싱
- [ ] DB 저장 테스트

**강남맛집**
- [ ] 페이지 구조 분석
- [ ] 크롤링 로직 구현
- [ ] 데이터 파싱
- [ ] DB 저장 테스트

**리뷰플레이스 (reviewplace.co.kr)**
- [ ] 페이지 구조 분석
- [ ] 크롤링 로직 구현
- [ ] 데이터 파싱
- [ ] DB 저장 테스트

### 크롤러 스케줄링
- [ ] GitHub Actions 워크플로우 작성
- [ ] 크롤링 주기 설정 (하루 2-3회)
- [ ] 에러 알림 설정

### 데이터 정제
- [ ] 카테고리 통일 (각 사이트 카테고리 → 공통 카테고리 매핑)
- [ ] 지역 정규화 (서울 강남구, 서울시 강남구 → 서울 강남구)
- [ ] 마감된 체험단 is_active = false 처리

**Phase 2 완료 체크**: 5개 사이트 데이터가 DB에 정상 저장되는가? ✅

---

## Phase 3: 인증/회원 시스템 ⏱️ 2-3일

### 소셜 로그인 설정
- [ ] Kakao Developers 앱 등록
- [ ] Google Cloud Console OAuth 설정
- [ ] Supabase Auth 소셜 프로바이더 설정

### 로그인 구현
- [ ] 로그인 페이지 UI (`/login`)
- [ ] 카카오 로그인 연동
- [ ] 구글 로그인 연동
- [ ] 콜백 처리
- [ ] 세션 관리

### 사용자 프로필
- [ ] users 테이블 자동 생성 트리거 (auth.users → public.users)
- [ ] 프로필 페이지 UI
- [ ] 로그아웃 기능

### 인증 미들웨어
- [ ] 보호된 라우트 설정 (/my/*)
- [ ] 로그인 리다이렉트

**Phase 3 완료 체크**: 카카오/구글 로그인 후 사용자 정보 표시되는가? ✅

---

## Phase 4: 검색 기능 ⏱️ 3-4일

### 검색 페이지 UI
- [ ] 검색 페이지 레이아웃 (`/search`)
- [ ] 필터 컴포넌트
  - [ ] 지역 선택 (시/도, 구/군)
  - [ ] 카테고리 선택 (맛집, 뷰티, 제품 등)
  - [ ] 유형 선택 (방문형, 배송형, 기자단)
  - [ ] 정렬 (마감임박순, 최신순)
- [ ] 체험단 카드 컴포넌트
- [ ] 무한 스크롤 or 페이지네이션

### 검색 API
- [ ] GET /api/campaigns 엔드포인트
- [ ] 필터 쿼리 파라미터 처리
- [ ] Supabase 쿼리 최적화
- [ ] 검색 결과 캐싱 (선택)

### 체험단 상세 페이지
- [ ] 상세 페이지 UI (`/campaign/[id]`)
- [ ] 원본 사이트 링크 버튼
- [ ] 신청/당첨 버튼 (로그인 시)
- [ ] 관련 체험단 추천 (선택)

### 랜딩 페이지
- [ ] 메인 페이지 UI (`/`)
- [ ] 서비스 소개 섹션
- [ ] 검색 바로가기
- [ ] 프리미엄 기능 소개

**Phase 4 완료 체크**: 필터로 검색하고 상세 페이지까지 이동 가능? ✅

---

## Phase 5: 신청/당첨 관리 ⏱️ 3-4일

### 신청 트래킹
- [ ] "신청함" 버튼 구현
- [ ] applications 테이블에 저장
- [ ] 신청 취소 기능

### 내 신청 목록
- [ ] 내 신청 페이지 UI (`/my/applied`)
- [ ] 상태별 필터 (신청중, 당첨, 완료)
- [ ] 상태 변경 기능

### 당첨 등록
- [ ] "당첨" 상태 변경
- [ ] 방문 예정일 입력 모달
- [ ] 리뷰 마감일 입력 (또는 자동 계산)

### 내 당첨 목록
- [ ] 내 당첨 페이지 UI (`/my/selected`)
- [ ] 마감일 D-day 표시
- [ ] 캘린더 연동 상태 표시 (프리미엄)
- [ ] "완료" 체크 기능

**Phase 5 완료 체크**: 신청 → 당첨 → 완료 플로우가 정상 동작? ✅

---

## Phase 6: 프리미엄 기능 ⏱️ 5-7일

### 구글 캘린더 연동
- [ ] Google Calendar API 설정
- [ ] OAuth 스코프 추가 (calendar.events)
- [ ] 캘린더 연결 버튼 (`/settings`)
- [ ] 연결 해제 기능
- [ ] 일정 생성 함수
  - [ ] 방문일 이벤트 생성
  - [ ] 마감일 이벤트 생성 (알림 포함)
- [ ] 당첨 등록 시 자동 캘린더 추가

### 결제 연동
- [ ] 토스페이먼츠 가입 및 API 키 발급
- [ ] 결제 SDK 연동
- [ ] 프리미엄 페이지 UI (`/premium`)
- [ ] 월간/연간 플랜 선택
- [ ] 결제 처리 API (`/api/payment`)
- [ ] 결제 완료 콜백 처리
- [ ] 구독 상태 업데이트
- [ ] 결제 이력 저장

### 프리미엄 체크
- [ ] 프리미엄 전용 기능 가드
- [ ] 프리미엄 배지 표시
- [ ] 만료 예정 알림

### 알림 시스템
- [ ] Resend API 설정
- [ ] 이메일 템플릿 작성
  - [ ] 마감 D-3 알림
  - [ ] 마감 D-1 알림
- [ ] 크론잡 설정 (매일 오전 9시)
- [ ] 알림 발송 로직
- [ ] 알림 설정 페이지 (on/off)

**Phase 6 완료 체크**: 당첨 등록 시 구글 캘린더에 일정 생성 + 마감 알림 발송? ✅

---

## Phase 7: 테스트 & QA ⏱️ 3-4일

### 기능 테스트
- [ ] 회원가입/로그인 정상 동작
- [ ] 검색 및 필터 정상 동작
- [ ] 신청/당첨 관리 정상 동작
- [ ] 캘린더 연동 정상 동작
- [ ] 결제 정상 동작
- [ ] 알림 정상 발송

### 엣지 케이스
- [ ] 비로그인 상태에서 신청 버튼 클릭
- [ ] 이미 신청한 체험단 재신청 방지
- [ ] 마감된 체험단 처리
- [ ] 캘린더 연결 없이 당첨 등록
- [ ] 결제 실패 시 처리
- [ ] 구독 만료 시 처리

### 반응형/크로스 브라우저
- [ ] 모바일 (iOS Safari, Android Chrome)
- [ ] 데스크톱 (Chrome, Safari, Firefox)
- [ ] 태블릿

### 성능
- [ ] 검색 페이지 로딩 속도
- [ ] 이미지 최적화
- [ ] API 응답 시간

### 버그 수정 로그
| 발견일 | 버그 내용 | 해결 여부 |
|--------|----------|----------|
| | | ⬜ |

**Phase 7 완료 체크**: 주요 시나리오 전체 통과? ✅

---

## Phase 8: 배포 & 런칭 ⏱️ 1-2일

### 배포 전 체크
- [ ] console.log 정리
- [ ] 환경 변수 Vercel 등록 완료
- [ ] 빌드 에러 없음 (`npm run build`)
- [ ] 메타 태그 설정 (title, description, og:image)
- [ ] favicon 설정
- [ ] robots.txt, sitemap.xml

### 배포
- [ ] 프로덕션 배포
- [ ] 커스텀 도메인 연결 (나중에)
- [ ] SSL 확인

### 배포 후 체크
- [ ] 실제 URL 접속 확인
- [ ] 결제 테스트 (실결제)
- [ ] 카카오톡 공유 미리보기 확인
- [ ] 크롤러 스케줄 동작 확인

### 런칭
- [ ] 베타 테스터 모집 (블로거 커뮤니티)
- [ ] 피드백 수집 채널 준비 (카카오톡 채널 or 폼)
- [ ] 초기 사용자 온보딩

**Phase 8 완료 체크**: 실제 서비스 URL로 전체 플로우 동작? ✅

---

## 📌 Quick Reference

### 주요 명령어
```bash
# 개발 서버
npm run dev

# 빌드
npm run build

# 크롤러 실행 (Python)
cd crawler && python main.py

# Supabase 타입 생성
npx supabase gen types typescript --project-id <project-id> > types/database.ts
```

### 환경 변수 목록
```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
KAKAO_CLIENT_ID=
KAKAO_CLIENT_SECRET=

# Google Calendar
GOOGLE_CALENDAR_CLIENT_ID=
GOOGLE_CALENDAR_CLIENT_SECRET=

# 결제
TOSS_CLIENT_KEY=
TOSS_SECRET_KEY=

# 이메일
RESEND_API_KEY=
```

### Git 커밋 컨벤션
```
feat: 새 기능 추가
fix: 버그 수정
style: UI 스타일 변경
refactor: 코드 리팩토링
docs: 문서 수정
chore: 기타 작업
```

---

## 🗓️ 일일 작업 로그

### 2024-12-03
**완료**
- 기획서 작성 완료
- 개발 체크리스트 작성

**내일 할 일**
- Phase 1 시작: 프로젝트 셋업

---

*체크리스트는 매일 업데이트합니다*

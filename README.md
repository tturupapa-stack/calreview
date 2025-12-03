# 캘리뷰 (Calreview)

**체험단 통합 검색 + 구글 캘린더 연동 서비스**

## 🎯 프로젝트 개요

캘리뷰는 여러 체험단 사이트를 한 곳에서 검색하고, 당첨 시 구글 캘린더에 자동으로 일정을 등록해주는 웹 서비스입니다.

### 핵심 차별점
- **검색**: 5개 체험단 사이트 통합 검색
- **구글 캘린더 연동**: 당첨 시 자동 일정 등록 (프리미엄)
- **마감 알림**: D-3, D-1 이메일 알림 (프리미엄)

## 🛠️ 기술 스택

- **Frontend**: Next.js 14 (App Router) + Tailwind CSS + TypeScript
- **Backend/DB**: Supabase (Auth, PostgreSQL, Edge Functions)
- **Crawler**: Python (BeautifulSoup) + GitHub Actions
- **Calendar**: Google Calendar API
- **Payment**: 토스페이먼츠
- **Email**: Resend
- **Deployment**: Vercel

## 📁 폴더 구조

```
/app
  /api              # API Routes
  /(auth)           # 로그인 관련 페이지
  /(main)           # 메인 서비스 페이지
/components
  /ui               # 공통 UI 컴포넌트
  /features         # 기능별 컴포넌트
/lib
  /supabase.ts      # Supabase 클라이언트
  /utils.ts         # 유틸 함수
/types
  /database.ts      # Supabase 타입
/docs               # 기획 문서
/crawler            # Python 크롤러 (별도 개발 예정)
```

## 🚀 시작하기

### 1. 환경 변수 설정

`env.example` 파일을 참고하여 `.env.local` 파일을 생성하고 필요한 환경 변수를 설정하세요.

```bash
cp env.example .env.local
```

필수 환경 변수:
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase 프로젝트 URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase 익명 키

### 2. 의존성 설치

```bash
npm install
```

### 3. 개발 서버 실행

```bash
npm run dev
```

http://localhost:3000 에서 확인할 수 있습니다.

## 📚 참고 문서

- [기획서](./docs/PROJECT_PLANNING.md): 상세 프로젝트 기획
- [개발 체크리스트](./docs/DEVELOPMENT_CHECKLIST.md): Phase별 개발 일정
- [Claude 가이드](./docs/CLAUDE.md): 프로젝트 요약

## 📝 주요 명령어

```bash
npm run dev          # 개발 서버
npm run build        # 프로덕션 빌드
npm run start        # 프로덕션 서버
npm run lint         # ESLint
```

## 🎯 개발 로드맵

- [x] **Phase 1**: 프로젝트 셋업
- [ ] **Phase 2**: 크롤러 개발
- [ ] **Phase 3**: 인증/회원 시스템
- [ ] **Phase 4**: 검색 기능
- [ ] **Phase 5**: 신청/당첨 관리
- [ ] **Phase 6**: 프리미엄 기능 (캘린더, 결제, 알림)
- [ ] **Phase 7**: 테스트 & QA
- [ ] **Phase 8**: 배포 & 런칭

## 💰 비즈니스 모델

- **무료**: 검색, 신청 트래킹
- **프리미엄 월간**: 4,900원/월
- **프리미엄 연간**: 49,000원/년 (17% 할인)

## 📄 라이선스

이 프로젝트는 개인 프로젝트입니다.

# 캘리뷰 (Calreview)

## 프로젝트 설명
체험단 통합 검색 + 구글 캘린더 연동 서비스. 여러 체험단 사이트를 크롤링해서 한 곳에서 검색하고, 당첨 시 구글 캘린더에 자동으로 일정을 등록해주는 웹 서비스.

## 핵심 차별점
- 기존 서비스(인플렉서, 모아뷰): 검색만 제공
- 캘리뷰: 검색 + **구글 캘린더 연동** + 마감 알림 (프리미엄)

## 기술 스택
- **Frontend**: Next.js 14 (App Router) + Tailwind CSS
- **Backend/DB**: Supabase (Auth, PostgreSQL, Edge Functions)
- **Crawler**: Python (BeautifulSoup) + GitHub Actions
- **Calendar**: Google Calendar API
- **Payment**: 토스페이먼츠
- **Email**: Resend
- **Deployment**: Vercel

## 폴더 구조
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
/crawler            # Python 크롤러 (별도 폴더)
```

## 주요 기능
1. **체험단 통합 검색** (무료)
   - 5개 사이트 크롤링 (리뷰노트, 레뷰, 디너의여왕, 강남맛집, 리뷰플레이스)
   - 필터: 지역, 카테고리, 유형, 마감순

2. **신청 트래킹** (무료)
   - 내가 신청한 체험단 목록 관리
   - 상태: 신청중 → 당첨 → 완료

3. **구글 캘린더 연동** (프리미엄)
   - 당첨 시 방문일/마감일 구글 캘린더에 자동 등록

4. **마감 알림** (프리미엄)
   - D-3, D-1 이메일 알림

## 비즈니스 모델
- 무료: 검색, 신청 트래킹
- 프리미엄 월간: 4,900원/월
- 프리미엄 연간: 49,000원/년 (17% 할인)

## DB 테이블
- `users`: 사용자 정보, 프리미엄 상태
- `campaigns`: 크롤링한 체험단 정보
- `applications`: 사용자별 신청/당첨 관리
- `payments`: 결제 이력

## 코딩 컨벤션
- 컴포넌트: PascalCase (예: CampaignCard.tsx)
- 함수/변수: camelCase
- 파일명: kebab-case (예: campaign-card.tsx) 또는 PascalCase
- API Routes: kebab-case
- 한국어 주석 사용 OK
- Tailwind 클래스 사용, 인라인 스타일 지양

## 현재 진행 상황
- [x] 기획 완료
- [ ] Phase 1: 프로젝트 셋업
- [ ] Phase 2: 크롤러 개발
- [ ] Phase 3: 인증/회원 시스템
- [ ] Phase 4: 검색 기능
- [ ] Phase 5: 신청/당첨 관리
- [ ] Phase 6: 프리미엄 기능 (캘린더, 결제, 알림)
- [ ] Phase 7: 테스트
- [ ] Phase 8: 배포

## 참고 문서
- `PROJECT_PLANNING.md`: 상세 기획서
- `DEVELOPMENT_CHECKLIST.md`: 개발 체크리스트

## 자주 사용하는 명령어
```bash
npm run dev          # 개발 서버
npm run build        # 빌드
npm run lint         # 린트
```

## 환경 변수
`.env.local` 파일에 다음 변수들 필요:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- GOOGLE_CLIENT_ID / SECRET
- KAKAO_CLIENT_ID / SECRET
- TOSS_CLIENT_KEY / SECRET_KEY
- RESEND_API_KEY

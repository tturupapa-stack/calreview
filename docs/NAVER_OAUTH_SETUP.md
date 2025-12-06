# 네이버 OAuth 설정 가이드

## 왜 네이버 로그인인가?

### UX 최적화 전략
대부분의 체험단 사이트들은 **네이버 블로그 인증**이 필수입니다:
- 리뷰노트, 디너의여왕, 강남맛집 등 → 네이버 블로그 URL 필수
- 신청 시 네이버 계정으로 로그인 필요
- 리뷰 작성 시에도 네이버 블로그 사용

### 핵심 편의성
```
1. 캘리뷰에서 네이버 로그인 → 네이버 세션 유지
2. 체험단 원본 사이트 이동 → 이미 네이버 로그인됨 ✅
3. 별도 로그인 없이 바로 신청 가능!
```

**결과**: 사용자가 매번 네이버 로그인을 반복하지 않고, 원클릭으로 체험단 신청까지 완료할 수 있습니다.

---

## 1. 네이버 Developers 애플리케이션 등록

### 1.1 네이버 Developers 접속
1. [네이버 Developers](https://developers.naver.com/) 접속
2. 우측 상단 "로그인" 클릭
3. 네이버 계정으로 로그인

### 1.2 애플리케이션 등록
1. 상단 메뉴에서 **"Application"** → **"애플리케이션 등록"** 클릭
2. 애플리케이션 정보 입력:
   - **애플리케이션 이름**: `캘리뷰` (또는 원하는 이름)
   - **사용 API**: `네이버 로그인` 체크
   - **로그인 오픈 API 서비스 환경**:
     - `PC웹` 체크
     - 서비스 URL: `http://localhost:3000` (개발)
     - Callback URL: `http://localhost:3000/auth/callback`
   - **제공 정보 선택**:
     - 필수: `회원이름`, `이메일 주소`, `프로필 사진`

3. **"등록하기"** 클릭

### 1.3 Client ID & Secret 확인
1. 등록 완료 후, 생성된 애플리케이션 클릭
2. **Client ID**와 **Client Secret** 복사
   - Client ID: `abcd1234efgh5678` 형식
   - Client Secret: `ABCD1234` 형식

## 2. Supabase 설정

### 2.1 네이버 OAuth Provider 활성화
1. [Supabase Dashboard](https://app.supabase.com/) 접속
2. 프로젝트 선택
3. 좌측 메뉴: **Authentication** → **Providers**
4. **Naver** 찾아서 클릭
5. 설정:
   - **Enable Sign in with Naver**: ON
   - **Naver Client ID**: 위에서 복사한 Client ID 입력
   - **Naver Client Secret**: 위에서 복사한 Client Secret 입력
6. **Save** 클릭

### 2.2 Callback URL 확인
- Supabase의 Callback URL: `https://YOUR_PROJECT.supabase.co/auth/v1/callback`
- 이 URL을 네이버 Developers의 Callback URL에 추가해야 합니다

## 3. 네이버 Developers Callback URL 추가 (프로덕션)

### 3.1 프로덕션 환경 설정
1. 네이버 Developers 애플리케이션 관리 페이지
2. **"PC웹"** 섹션에서 **"서비스 URL"** 및 **"Callback URL"** 추가:
   - 서비스 URL: `https://calreview.vercel.app`
   - Callback URL 추가:
     - `https://YOUR_PROJECT.supabase.co/auth/v1/callback`
     - `https://calreview.vercel.app/auth/callback`

## 4. 환경 변수 설정

### 4.1 로컬 환경 (.env.local)
```bash
# Naver OAuth
NAVER_CLIENT_ID=abcd1234efgh5678
NAVER_CLIENT_SECRET=ABCD1234
```

### 4.2 Vercel 환경 변수
1. [Vercel Dashboard](https://vercel.com/) → 프로젝트 선택
2. **Settings** → **Environment Variables**
3. 다음 변수 추가:
   - `NAVER_CLIENT_ID`: 네이버 Client ID
   - `NAVER_CLIENT_SECRET`: 네이버 Client Secret

## 5. 테스트

### 5.1 로컬 테스트
```bash
npm run dev
```

1. `http://localhost:3000/login` 접속
2. **"네이버로 시작하기"** 버튼 클릭
3. 네이버 로그인 화면에서 로그인
4. 정보 제공 동의
5. 메인 페이지로 리다이렉트 확인

### 5.2 확인 사항
- [ ] 로그인 성공
- [ ] 사용자 정보 저장 (이름, 이메일)
- [ ] 프로필 사진 표시
- [ ] 로그아웃 기능 동작

## 트러블슈팅

### "redirect_uri_mismatch" 오류
- Callback URL이 정확히 일치하는지 확인
- 개발: `http://localhost:3000/auth/callback`
- 프로덕션: `https://YOUR_PROJECT.supabase.co/auth/v1/callback`

### "invalid_client" 오류
- Client ID와 Client Secret이 정확한지 확인
- 환경 변수가 제대로 설정되었는지 확인

### 로그인 후 사용자 정보가 없음
- Supabase의 `handle_new_user` 트리거 확인
- `public.users` 테이블에 데이터가 저장되는지 확인

## 참고 자료

- [네이버 로그인 API 명세](https://developers.naver.com/docs/login/api/)
- [Supabase Auth 문서](https://supabase.com/docs/guides/auth)


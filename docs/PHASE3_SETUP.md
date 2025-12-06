# Phase 3: 인증/회원 시스템 설정 가이드

## 📋 개요

Phase 3에서는 카카오/구글 소셜 로그인을 구현하고 사용자 프로필을 관리합니다.

## ⚙️ 설정 단계

### 1. Supabase 데이터베이스 설정

1. Supabase Dashboard 접속
2. SQL Editor 열기
3. `docs/supabase-setup.sql` 파일의 내용을 복사하여 실행
   - users 테이블 생성
   - auth.users → public.users 자동 동기화 트리거
   - RLS 정책 설정

### 2. 카카오 OAuth 설정

#### 2.1 Kakao Developers 앱 등록

1. [Kakao Developers](https://developers.kakao.com/) 접속
2. 내 애플리케이션 > 애플리케이션 추가하기
3. 앱 이름, 사업자명 입력 후 생성

#### 2.2 플랫폼 설정

1. 앱 설정 > 플랫폼 > Web 플랫폼 등록
2. 사이트 도메인 등록:
   - 개발: `http://localhost:3000`
   - 프로덕션: `https://your-domain.com`

#### 2.3 카카오 로그인 활성화

1. 제품 설정 > 카카오 로그인 > 활성화 설정: ON
2. Redirect URI 등록:
   - 개발: `http://localhost:3000/auth/callback`
   - 프로덕션: `https://your-domain.com/auth/callback`

#### 2.4 REST API 키 확인

1. 앱 설정 > 앱 키에서 REST API 키 복사
2. Supabase Dashboard > Authentication > Providers > Kakao 설정:
   - Enabled: ON
   - Client ID (REST API 키): 입력
   - Client Secret: (선택사항, 필요시 설정)

### 3. 구글 OAuth 설정

#### 3.1 Google Cloud Console 설정

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. APIs & Services > Credentials > Create Credentials > OAuth client ID
4. Application type: Web application
5. Authorized redirect URIs 추가:
   - `https://[your-project-ref].supabase.co/auth/v1/callback`

#### 3.2 OAuth 동의 화면 설정

1. OAuth consent screen 설정
2. User type: External 선택
3. 앱 정보 입력 (앱 이름, 사용자 지원 이메일 등)
4. 범위(Scopes) 추가:
   - `openid`
   - `email`
   - `profile`

#### 3.3 Supabase에 구글 OAuth 설정

1. Supabase Dashboard > Authentication > Providers > Google 설정:
   - Enabled: ON
   - Client ID: Google Cloud Console에서 발급받은 Client ID
   - Client Secret: Google Cloud Console에서 발급받은 Client Secret

### 4. 환경 변수 설정

`.env.local` 파일에 다음 변수들이 필요합니다:

```env
# Supabase (이미 설정되어 있어야 함)
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OAuth (Supabase에서 자동 처리되므로 별도 설정 불필요)
# 하지만 나중에 Google Calendar API를 위해 필요할 수 있음
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

**참고**: Supabase Auth를 사용하면 OAuth 클라이언트 ID/Secret은 Supabase Dashboard에서만 설정하면 됩니다. Next.js 앱에서는 별도로 환경 변수를 설정할 필요가 없습니다.

---

## 3. 네이버 OAuth 설정 (선택)

### 3-1. 네이버 개발자 센터 설정

1. [네이버 개발자 센터](https://developers.naver.com) 접속

2. **애플리케이션 등록**:
   - "Application" > "애플리케이션 등록" 클릭
   - 애플리케이션 이름: `캘리뷰`
   - 사용 API: `네이버 로그인`
   - 로그인 오픈 API 서비스 환경:
     - PC 웹: ✅ 체크
     - 모바일 웹: ✅ 체크 (선택)

3. **서비스 URL 설정**:
   - 개발: `http://localhost:3000`
   - 프로덕션: `https://calreview.vercel.app`

4. **Callback URL 설정** (중요!):
   ```
   개발: http://localhost:3000/auth/callback
   프로덕션: https://calreview.vercel.app/auth/callback
   ```

5. **Client ID & Client Secret 복사**:
   - 애플리케이션 정보 페이지에서 확인

### 3-2. Supabase 네이버 Provider 설정

⚠️ **중요**: Supabase는 네이버를 기본 지원하지 않으므로, 추가 설정이 필요합니다.

**방법 1: Supabase가 네이버를 지원하는 경우** (2024년 기준 미지원)
1. Supabase Dashboard > Authentication > Providers
2. "Naver" 찾아서 Enable
3. Client ID와 Client Secret 입력

**방법 2: 커스텀 구현 필요** (현재)
- Supabase가 네이버를 직접 지원하지 않으므로, 커스텀 OAuth 플로우 구현 필요
- 또는 네이버 로그인 API를 직접 사용하여 세션 생성
- 자세한 구현은 Phase 3.5에서 진행 예정

**현재 상태**: 네이버 로그인 버튼 UI는 추가되었으나, 실제 OAuth 연동은 추가 구현 필요

---

### 5. 테스트

1. 개발 서버 실행:
   ```bash
   npm run dev
   ```

2. 로그인 페이지 접속: `http://localhost:3000/login`

3. 카카오/구글/네이버 로그인 버튼 클릭하여 테스트
   - ⚠️ 네이버는 현재 UI만 구현된 상태 (실제 OAuth는 추가 구현 필요)

4. 로그인 성공 후:
   - 메인 페이지로 리다이렉트되는지 확인
   - 헤더에 사용자 메뉴가 표시되는지 확인
   - Supabase Dashboard > Authentication > Users에서 사용자 생성 확인
   - Supabase Dashboard > Table Editor > users에서 public.users 테이블에 데이터 생성 확인

## 🔧 문제 해결

### 로그인이 안 되는 경우

1. **Supabase Redirect URL 확인**
   - Supabase Dashboard > Authentication > URL Configuration
   - Site URL과 Redirect URLs에 올바른 URL이 등록되어 있는지 확인

2. **카카오/구글 OAuth 설정 확인**
   - Redirect URI가 정확히 일치하는지 확인
   - Client ID/Secret이 올바른지 확인

3. **브라우저 콘솔 확인**
   - 개발자 도구 > Console에서 오류 메시지 확인

### users 테이블에 데이터가 생성되지 않는 경우

1. Supabase SQL Editor에서 트리거가 제대로 생성되었는지 확인:
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
   ```

2. 트리거 함수 확인:
   ```sql
   SELECT * FROM pg_proc WHERE proname = 'handle_new_user';
   ```

3. 수동으로 사용자 생성 테스트:
   ```sql
   -- auth.users에 사용자가 있는지 확인
   SELECT * FROM auth.users;
   
   -- public.users에 동일한 ID의 사용자가 있는지 확인
   SELECT * FROM public.users;
   ```

## 📝 다음 단계

Phase 3 완료 후:
- Phase 4: 검색 기능 구현
- Phase 5: 신청/당첨 관리
- Phase 6: 프리미엄 기능 (캘린더, 결제, 알림)


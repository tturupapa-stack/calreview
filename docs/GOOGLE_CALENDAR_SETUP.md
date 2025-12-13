# Google Calendar OAuth 설정 가이드

## 1. Google Cloud Console 설정

### 1.1 OAuth 2.0 클라이언트 ID 확인/생성

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 프로젝트 선택 (또는 새 프로젝트 생성)
3. **APIs & Services** → **Credentials** 이동
4. **OAuth 2.0 Client IDs** 확인:
   - 이미 있다면 사용
   - 없다면 **+ CREATE CREDENTIALS** → **OAuth client ID** 생성

### 1.2 OAuth 동의 화면 설정

1. **APIs & Services** → **OAuth consent screen**
2. 사용자 유형 선택 (External 또는 Internal)
3. 앱 정보 입력:
   - 앱 이름: Cally
   - 사용자 지원 이메일: 선택
   - 개발자 연락처: 선택
4. **저장 후 계속**

### 1.3 범위(Scopes) 추가

1. **Scopes** 섹션에서 **ADD OR REMOVE SCOPES** 클릭
2. 다음 범위 추가:
   - `https://www.googleapis.com/auth/calendar.events` (캘린더 이벤트 생성/수정/삭제)
   - `https://www.googleapis.com/auth/calendar.readonly` (캘린더 읽기)
3. **UPDATE** → **저장 후 계속**

### 1.4 테스트 사용자 추가 (개발 단계)

- 앱이 아직 검토되지 않은 경우, 테스트 사용자 목록에 이메일 추가

### 1.5 OAuth 2.0 클라이언트 ID 생성

1. **Credentials** → **+ CREATE CREDENTIALS** → **OAuth client ID**
2. 애플리케이션 유형: **Web application**
3. 이름: `Cally Calendar API` (또는 원하는 이름)
4. **승인된 리디렉션 URI**에 추가:
   ```
   개발: http://localhost:3000/api/auth/google-calendar/callback
   프로덕션: https://cally.kr/api/auth/google-calendar/callback
   ```
5. **만들기** 클릭
6. **Client ID**와 **Client Secret** 복사 (한 번만 표시되므로 안전하게 보관)

### 1.6 Google Calendar API 활성화

1. **APIs & Services** → **Library**
2. "Google Calendar API" 검색
3. **ENABLE** 클릭

---

## 2. Vercel 환경 변수 설정

### 2.1 Vercel 대시보드에서 설정

1. [Vercel Dashboard](https://vercel.com/dashboard) 접속
2. 프로젝트 선택 → **Settings** → **Environment Variables**
3. 다음 환경 변수 추가:

   | Variable Name | Value | Environment |
   |--------------|-------|-------------|
   | `GOOGLE_CALENDAR_CLIENT_ID` | Google Cloud Console에서 복사한 Client ID | Production, Preview, Development |
   | `GOOGLE_CALENDAR_CLIENT_SECRET` | Google Cloud Console에서 복사한 Client Secret | Production, Preview, Development |

4. 각 변수마다:
   - **Add** 클릭
   - 변수 이름 입력
   - 값 입력
   - Environment 선택 (모두 체크 권장)
   - **Save** 클릭

### 2.2 환경 변수 확인

환경 변수가 올바르게 설정되었는지 확인하려면:

1. 관리자 계정으로 로그인
2. `/api/admin/check-env` 엔드포인트 접속
3. 환경 변수 상태 확인

또는 Vercel 대시보드에서 직접 확인:
- **Settings** → **Environment Variables**에서 모든 변수가 표시되는지 확인

---

## 3. 로컬 개발 환경 설정

`.env.local` 파일에 다음 추가:

```env
GOOGLE_CALENDAR_CLIENT_ID=your_client_id_here
GOOGLE_CALENDAR_CLIENT_SECRET=your_client_secret_here
```

⚠️ **주의**: `.env.local` 파일은 Git에 커밋하지 마세요 (이미 .gitignore에 포함되어 있음)

---

## 4. 배포 후 확인

### 4.1 환경 변수 확인

1. 배포 완료 후 관리자로 로그인
2. 브라우저에서 다음 URL 접속:
   ```
   https://cally.kr/api/admin/check-env
   ```
3. 응답에서 환경 변수 상태 확인:
   ```json
   {
     "status": "ok",
     "envStatus": {
       "GOOGLE_CALENDAR_CLIENT_ID": true,
       "GOOGLE_CALENDAR_CLIENT_SECRET": true,
       "NEXT_PUBLIC_SUPABASE_URL": true,
       "NEXT_PUBLIC_APP_URL": true
     },
     "message": "모든 필수 환경 변수가 설정되어 있습니다."
   }
   ```

### 4.2 구글 캘린더 연결 테스트

1. `/settings` 페이지 접속
2. "구글 캘린더 연결" 버튼 클릭
3. Google 인증 화면에서 권한 승인
4. 연결 성공 메시지 확인

---

## 5. 문제 해결

### 5.1 "401 invalid_client: The OAuth client was not found" 오류

**원인:**
- `GOOGLE_CALENDAR_CLIENT_ID` 환경 변수가 설정되지 않음
- Client ID 값이 잘못됨
- 환경 변수가 배포에 반영되지 않음

**해결:**
1. Vercel 환경 변수 확인 (Settings → Environment Variables)
2. 환경 변수 이름이 정확한지 확인 (`GOOGLE_CALENDAR_CLIENT_ID`, `GOOGLE_CALENDAR_CLIENT_SECRET`)
3. 환경 변수 추가/수정 후 **재배포** 필요
4. Google Cloud Console에서 Client ID가 활성화되어 있는지 확인

### 5.2 "redirect_uri_mismatch" 오류

**원인:**
- Redirect URI가 Google Cloud Console에 등록되지 않음
- Redirect URI 형식이 일치하지 않음

**해결:**
1. Google Cloud Console → APIs & Services → Credentials
2. OAuth 2.0 클라이언트 ID 선택
3. "승인된 리디렉션 URI"에 다음 추가:
   - `https://cally.kr/api/auth/google-calendar/callback`
   - (개발 환경 사용 시) `http://localhost:3000/api/auth/google-calendar/callback`
4. 저장

### 5.3 "invalid_grant" 오류

**원인:**
- Refresh token이 만료됨
- 사용자가 Google에서 앱 접근 권한을 취소함

**해결:**
- 설정 페이지에서 연결 해제 후 다시 연결

### 5.4 환경 변수 확인 방법

관리자 계정으로 다음 URL 접속:
```
https://cally.kr/api/admin/check-env
```

누락된 환경 변수가 있으면 응답에 표시됩니다.

---

## 6. 보안 주의사항

⚠️ **중요:**
- `GOOGLE_CALENDAR_CLIENT_SECRET`는 절대 클라이언트 코드나 공개 저장소에 노출하지 마세요
- Vercel 환경 변수는 서버 사이드에서만 접근 가능하도록 설정되어 있습니다
- Client Secret을 분실한 경우, Google Cloud Console에서 새로 생성해야 합니다

---

## 참고 링크

- [Google Cloud Console](https://console.cloud.google.com/)
- [Google Calendar API 문서](https://developers.google.com/calendar/api)
- [OAuth 2.0 설정 가이드](https://developers.google.com/identity/protocols/oauth2)

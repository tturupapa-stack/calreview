# Google Calendar OAuth 401 invalid_client 오류 해결 가이드

## 오류 메시지
```
401 오류: invalid_client
The OAuth client was not found.
```

## 원인 분석

이 오류는 다음과 같은 경우에 발생합니다:

1. **OAuth 클라이언트 ID가 Google Cloud Console에 존재하지 않음**
2. **OAuth 클라이언트 ID 값이 잘못됨**
3. **OAuth 클라이언트가 삭제되었거나 비활성화됨**
4. **환경 변수에 잘못된 값이 설정됨**

## 해결 방법

### 1단계: Google Cloud Console에서 OAuth 클라이언트 확인

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 프로젝트 선택
3. **APIs & Services** → **Credentials** 이동
4. **OAuth 2.0 Client IDs** 목록 확인
5. 다음 Client ID가 존재하는지 확인:
   ```
   1051917801304-437opdjtn7f151eq39573fqpstljboh8.apps.googleusercontent.com
   ```

### 2단계: OAuth 클라이언트가 없는 경우 새로 생성

1. **+ CREATE CREDENTIALS** → **OAuth client ID** 클릭
2. **Application type**: `Web application` 선택
3. **Name**: `Cally Calendar API` (또는 원하는 이름)
4. **Authorized redirect URIs**에 다음 추가:
   ```
   https://cally.kr/api/auth/google-calendar/callback
   ```
   (개발 환경 사용 시)
   ```
   http://localhost:3000/api/auth/google-calendar/callback
   ```
5. **CREATE** 클릭
6. **Client ID**와 **Client Secret** 복사

### 3단계: Vercel 환경 변수 업데이트

새로 생성한 Client ID와 Secret을 Vercel에 설정:

```bash
# Production 환경
printf "새로운_CLIENT_ID" | vercel env rm GOOGLE_CALENDAR_CLIENT_ID production --yes
printf "새로운_CLIENT_ID" | vercel env add GOOGLE_CALENDAR_CLIENT_ID production

printf "새로운_CLIENT_SECRET" | vercel env rm GOOGLE_CALENDAR_CLIENT_SECRET production --yes
printf "새로운_CLIENT_SECRET" | vercel env add GOOGLE_CALENDAR_CLIENT_SECRET production

# Preview 환경도 동일하게 설정
# Development 환경도 동일하게 설정
```

또는 Vercel 대시보드에서:
1. 프로젝트 → **Settings** → **Environment Variables**
2. `GOOGLE_CALENDAR_CLIENT_ID` 수정 (새로운 값 입력)
3. `GOOGLE_CALENDAR_CLIENT_SECRET` 수정 (새로운 값 입력)

### 4단계: Redirect URI 확인

Google Cloud Console에서 OAuth 클라이언트의 **Authorized redirect URIs**에 다음이 정확히 등록되어 있는지 확인:

```
https://cally.kr/api/auth/google-calendar/callback
```

⚠️ **중요**: 
- URL은 정확히 일치해야 합니다 (대소문자, 슬래시 포함)
- 끝에 슬래시(`/`)가 있으면 안 됩니다
- `http://`와 `https://`를 구분합니다

### 5단계: Google Calendar API 활성화 확인

1. **APIs & Services** → **Library**
2. "Google Calendar API" 검색
3. **ENABLE**되어 있는지 확인 (비활성화되어 있으면 활성화)

### 6단계: 재배포 및 테스트

환경 변수를 변경한 후:

1. Vercel에서 자동 재배포 대기 (또는 수동 재배포)
2. 배포 완료 후 `/settings` 페이지에서 다시 연결 시도
3. 오류가 계속되면 브라우저 개발자 도구의 Network 탭에서 실제 사용된 Client ID 확인

## 추가 확인 사항

### 현재 설정된 환경 변수 확인

관리자 계정으로 다음 URL 접속:
```
https://cally.kr/api/admin/check-env
```

응답에서 `GOOGLE_CALENDAR_CLIENT_ID`와 `GOOGLE_CALENDAR_CLIENT_SECRET`이 `true`로 표시되는지 확인.

### OAuth 동의 화면 설정 확인

1. **APIs & Services** → **OAuth consent screen**
2. 다음 범위(Scopes)가 추가되어 있는지 확인:
   - `https://www.googleapis.com/auth/calendar.events`
   - `https://www.googleapis.com/auth/calendar.readonly`
3. **테스트 사용자**에 본인 이메일(`tturupapa@gmail.com`) 추가 (앱이 검토되지 않은 경우)

## 빠른 체크리스트

- [ ] Google Cloud Console에 OAuth 클라이언트 존재 확인
- [ ] Redirect URI가 정확히 등록되어 있는지 확인
- [ ] Vercel 환경 변수가 올바른 값으로 설정되어 있는지 확인
- [ ] 환경 변수 변경 후 재배포 완료
- [ ] Google Calendar API 활성화 확인
- [ ] OAuth 동의 화면에 필요한 범위 추가 확인

## 문제가 계속되는 경우

1. Vercel 로그 확인:
   ```bash
   vercel logs --follow
   ```

2. 브라우저 개발자 도구에서 Network 탭 확인:
   - `/api/auth/google-calendar/connect` 요청 확인
   - 실제 생성된 `authUrl`의 `client_id` 파라미터 확인

3. Google Cloud Console에서 새로운 OAuth 클라이언트 생성 후 다시 시도

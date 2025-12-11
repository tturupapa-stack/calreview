# 네이버 OAuth 로그인 오류 해결 가이드

## 오류 메시지
"cally 서비스 설정에 오류가 있어 네이버 아이디로 로그인할 수 없습니다."

## 원인 분석

이 오류는 네이버 개발자 센터에서 **Callback URL이 일치하지 않을 때** 발생합니다.

## 해결 방법

### 1단계: 네이버 개발자 센터 설정 확인

1. [네이버 개발자 센터](https://developers.naver.com/) 접속
2. **Application** > **내 애플리케이션** 클릭
3. **캘리뷰** 애플리케이션 선택

### 2단계: 서비스 URL 확인

**PC웹** 섹션에서:
- **서비스 URL**: `https://cally.kr` (정확히 일치해야 함)
- 슬래시(`/`) 없이 입력

### 3단계: Callback URL 확인 (가장 중요!)

**Callback URL** 섹션에 **정확히** 다음 URL이 있어야 합니다:

```
https://cally.kr/api/auth/naver/callback
```

**주의사항:**
- URL 끝에 슬래시(`/`)가 있으면 안 됩니다
- 대소문자 구분: `cally.kr` (소문자)
- 프로토콜: `https://` (필수)
- 경로: `/api/auth/naver/callback` (정확히 일치)

### 4단계: 개발용 URL도 유지

개발 환경을 위해 다음 URL도 함께 등록:
```
http://localhost:3000/api/auth/naver/callback
```

### 5단계: 저장 및 확인

1. **저장** 또는 **수정하기** 버튼 클릭
2. 저장 완료 메시지 확인
3. 설정이 제대로 저장되었는지 다시 확인

## Vercel 환경 변수 확인

Vercel Dashboard > Settings > Environment Variables에서 확인:

```
NEXT_PUBLIC_APP_URL=https://cally.kr
NAVER_CLIENT_ID=your_client_id
NAVER_CLIENT_SECRET=your_client_secret
```

**중요**: 환경 변수 변경 후 **Vercel 재배포**가 필요할 수 있습니다.

## 재배포 방법

환경 변수를 변경했다면:

```bash
# Vercel CLI로 재배포
vercel --prod

# 또는 Vercel Dashboard에서 수동 재배포
# Deployments > 최신 배포 > Redeploy
```

## 테스트 방법

1. 네이버 개발자 센터 설정 저장 완료 확인
2. 브라우저 캐시 삭제 (Ctrl+Shift+Delete 또는 Cmd+Shift+Delete)
3. `https://cally.kr/login` 접속
4. **"네이버로 시작하기"** 버튼 클릭
5. 네이버 로그인 진행

## 여전히 오류가 발생하는 경우

### 체크리스트

- [ ] 네이버 개발자 센터 서비스 URL: `https://cally.kr` (정확히 일치)
- [ ] 네이버 개발자 센터 Callback URL: `https://cally.kr/api/auth/naver/callback` (정확히 일치)
- [ ] Vercel 환경 변수 `NEXT_PUBLIC_APP_URL=https://cally.kr` 설정됨
- [ ] Vercel 재배포 완료
- [ ] 브라우저 캐시 삭제
- [ ] 시크릿 모드에서 테스트

### 추가 확인 사항

1. **네이버 Client ID/Secret 확인**
   - Vercel 환경 변수에 올바른 값이 설정되어 있는지 확인
   - 네이버 개발자 센터에서 Client ID/Secret이 변경되지 않았는지 확인

2. **네트워크 확인**
   - 개발자 도구 > Network 탭에서 요청 확인
   - `redirect_uri_mismatch` 오류가 있는지 확인

3. **로그 확인**
   - Vercel Dashboard > Functions > Logs에서 오류 로그 확인

## 참고

- 네이버 OAuth는 Callback URL이 **정확히 일치**해야 합니다
- URL 끝의 슬래시, 대소문자, 프로토콜 모두 중요합니다
- 설정 변경 후 즉시 반영되지 않을 수 있으므로 몇 분 기다려보세요

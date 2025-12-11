# cally.kr 도메인 설정 가이드

## 완료된 작업

✅ Vercel에 도메인 추가 완료
✅ 네임서버를 Vercel로 변경 완료

## 다음 단계

### 1. DNS 전파 확인 (5분~24시간 소요)

DNS 전파가 완료되면 `https://cally.kr`로 접속 가능합니다.

확인 방법:
```bash
nslookup cally.kr
# 또는
dig cally.kr
```

### 2. Supabase 리다이렉트 URL 업데이트 ⚠️ 중요

**Supabase Dashboard > Authentication > URL Configuration**에서:

1. **Site URL** 변경:
   ```
   https://cally.kr
   ```

2. **Redirect URLs** 업데이트:
   ```
   https://cally.kr/auth/callback
   http://localhost:3000/auth/callback
   ```

### 3. Google OAuth 리다이렉트 URL 업데이트

**Google Cloud Console > APIs & Services > Credentials**에서:

1. OAuth 2.0 Client ID 선택
2. **Authorized redirect URIs**에 추가:
   ```
   https://[your-project-ref].supabase.co/auth/v1/callback
   ```
   (Supabase 콜백 URL은 변경 불필요 - Supabase가 처리)

3. **Authorized JavaScript origins**에 추가 (필요시):
   ```
   https://cally.kr
   ```

### 4. Naver OAuth 리다이렉트 URL 업데이트

**네이버 개발자 센터 > 애플리케이션 관리**에서:

1. 서비스 URL 업데이트:
   ```
   https://cally.kr
   ```

2. Callback URL 업데이트:
   ```
   https://cally.kr/auth/callback
   ```

### 5. Vercel 환경 변수 업데이트 (선택사항)

Vercel Dashboard > Settings > Environment Variables에서:

```
NEXT_PUBLIC_APP_URL=https://cally.kr
```

(코드에서 동적으로 처리되므로 필수는 아님)

## 확인 사항

DNS 전파 완료 후:

1. ✅ `https://cally.kr` 접속 확인
2. ✅ SSL 인증서 자동 발급 확인 (Vercel이 자동 처리)
3. ✅ 구글/네이버 로그인 테스트
4. ✅ 리다이렉트가 올바르게 작동하는지 확인

## 트러블슈팅

### 도메인이 아직 작동하지 않는 경우

1. DNS 전파 대기 (최대 24시간)
2. `vercel domains verify cally.kr` 명령어로 상태 확인
3. Vercel Dashboard > Domains에서 도메인 상태 확인

### SSL 인증서 발급 지연

- Vercel이 자동으로 SSL 인증서를 발급합니다 (보통 몇 분 소요)
- DNS 전파 완료 후 자동으로 처리됩니다

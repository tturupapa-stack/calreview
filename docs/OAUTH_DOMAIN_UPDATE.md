# OAuth 도메인 업데이트 가이드 (cally.kr)

## ⚠️ 수동 설정 필요

다음 OAuth 제공자들의 대시보드에서 도메인을 `cally.kr`로 업데이트해야 합니다.

## 1. Supabase 설정 (필수)

**Supabase Dashboard > Authentication > URL Configuration**:

1. **Site URL**:
   ```
   https://cally.kr
   ```

2. **Redirect URLs** (각각 새 줄에 입력):
   ```
   https://cally.kr/auth/callback
   http://localhost:3000/auth/callback
   ```

3. **Save** 클릭

## 2. Google OAuth 설정

**Google Cloud Console > APIs & Services > Credentials**:

1. OAuth 2.0 Client ID 선택
2. **Authorized JavaScript origins**에 추가:
   ```
   https://cally.kr
   ```
3. **Save** 클릭

**참고**: Supabase가 OAuth 콜백을 처리하므로, Supabase 콜백 URL은 변경할 필요 없습니다.

## 3. Naver OAuth 설정

**네이버 개발자 센터 > 애플리케이션 관리**:

1. **서비스 URL** 업데이트:
   ```
   https://cally.kr
   ```

2. **Callback URL** 업데이트:
   ```
   https://cally.kr/auth/callback
   ```

3. **저장** 클릭

## 확인 방법

설정 완료 후:

1. `https://cally.kr/login` 접속
2. 구글/네이버 로그인 테스트
3. 로그인 후 `https://cally.kr`로 올바르게 리다이렉트되는지 확인

## 문제 해결

### 여전히 localhost로 리다이렉트되는 경우

1. 브라우저 캐시 삭제
2. Supabase Dashboard 설정 확인
3. DNS 전파 완료 확인 (`nslookup cally.kr`)
4. Vercel 배포 완료 확인

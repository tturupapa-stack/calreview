# 네이버 OAuth 정확한 설정 가이드

## ⚠️ 현재 생성되는 URL

코드에서 생성되는 정확한 URL:
- **서비스 URL**: `https://cally.kr`
- **Callback URL**: `https://cally.kr/api/auth/naver/callback`

## 네이버 개발자 센터 정확한 설정 방법

### 1단계: 애플리케이션 선택
1. [네이버 개발자 센터](https://developers.naver.com/) 접속
2. 로그인
3. **"Application"** > **"내 애플리케이션"** 클릭
4. **"캘리뷰"** 애플리케이션 선택

### 2단계: PC웹 설정 확인

**"PC웹"** 섹션에서:

#### 서비스 URL
```
https://cally.kr
```
- 슬래시(`/`) 없이 입력
- `http://`가 아닌 `https://` 사용
- 소문자 `cally.kr` (대문자 없음)

#### Callback URL (가장 중요!)

**Callback URL** 입력란에 **정확히** 다음을 입력:

```
https://cally.kr/api/auth/naver/callback
```

**주의사항:**
- ❌ `https://cally.kr/api/auth/naver/callback/` (끝에 슬래시 있으면 안 됨)
- ❌ `http://cally.kr/api/auth/naver/callback` (http가 아닌 https)
- ❌ `https://Cally.kr/api/auth/naver/callback` (대문자 없어야 함)
- ✅ `https://cally.kr/api/auth/naver/callback` (정확히 이 형식)

### 3단계: 개발용 URL도 함께 등록 (선택사항)

개발 환경을 위해 다음도 함께 등록할 수 있습니다:
```
http://localhost:3000/api/auth/naver/callback
```

### 4단계: 저장

1. **"저장"** 또는 **"수정하기"** 버튼 클릭
2. 저장 완료 메시지 확인
3. 페이지를 새로고침하여 설정이 저장되었는지 다시 확인

## 설정 확인 체크리스트

네이버 개발자 센터에서 다음을 확인하세요:

- [ ] 서비스 URL: `https://cally.kr` (정확히 일치)
- [ ] Callback URL: `https://cally.kr/api/auth/naver/callback` (정확히 일치)
- [ ] URL 끝에 슬래시(`/`) 없음
- [ ] `https://` 프로토콜 사용 (http 아님)
- [ ] 소문자 사용 (`cally.kr`)
- [ ] 저장 완료 확인

## 테스트 방법

1. 네이버 개발자 센터 설정 저장 완료 확인
2. **5-10분 대기** (네이버 서버에 설정 반영 시간)
3. 브라우저 캐시 완전 삭제:
   - Chrome: Ctrl+Shift+Delete (Windows) / Cmd+Shift+Delete (Mac)
   - 또는 시크릿 모드 사용
4. `https://cally.kr/login` 접속
5. **"네이버로 시작하기"** 버튼 클릭
6. 네이버 로그인 진행

## 여전히 오류가 발생하는 경우

### 추가 확인 사항

1. **네이버 Client ID/Secret 확인**
   - Vercel Dashboard > Settings > Environment Variables
   - `NAVER_CLIENT_ID`와 `NAVER_CLIENT_SECRET`이 올바른지 확인
   - 네이버 개발자 센터의 Client ID/Secret과 일치하는지 확인

2. **네이버 개발자 센터에서 애플리케이션 상태 확인**
   - 애플리케이션이 활성화되어 있는지 확인
   - "네이버 로그인" API가 활성화되어 있는지 확인

3. **브라우저 개발자 도구 확인**
   - F12 키로 개발자 도구 열기
   - Network 탭에서 네이버 OAuth 요청 확인
   - 오류 메시지 확인

4. **Vercel 로그 확인**
   - Vercel Dashboard > Deployments > 최신 배포 > Functions > Logs
   - `/api/auth/naver/connect` 또는 `/api/auth/naver/callback` 관련 오류 확인

## 참고

- 네이버 OAuth는 Callback URL이 **정확히 일치**해야 합니다
- 설정 변경 후 즉시 반영되지 않을 수 있으므로 몇 분 기다려보세요
- 네이버 개발자 센터에서 설정을 저장한 후 페이지를 새로고침하여 확인하세요

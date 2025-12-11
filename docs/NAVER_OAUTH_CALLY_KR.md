# 네이버 OAuth cally.kr 도메인 설정 가이드

## ⚠️ 중요: 네이버 개발자 센터 설정 업데이트 필요

네이버 로그인 오류를 해결하려면 네이버 개발자 센터에서 Callback URL을 업데이트해야 합니다.

## 1. 네이버 개발자 센터 설정

### 1.1 애플리케이션 관리 페이지 접속
1. [네이버 개발자 센터](https://developers.naver.com/) 접속
2. 로그인 후 **"Application"** > **"내 애플리케이션"** 클릭
3. **"캘리뷰"** 애플리케이션 선택

### 1.2 서비스 URL 업데이트
**"PC웹"** 섹션에서:
- **서비스 URL**: `https://cally.kr`

### 1.3 Callback URL 업데이트 (중요!)
**"Callback URL"** 섹션에 다음 URL 추가:
```
https://cally.kr/api/auth/naver/callback
```

**참고**: 기존 URL들도 유지하세요:
- `http://localhost:3000/api/auth/naver/callback` (개발용)
- 기타 필요한 URL들

### 1.4 저장
**"저장"** 또는 **"수정하기"** 버튼 클릭

## 2. Vercel 환경 변수 확인

Vercel Dashboard > Settings > Environment Variables에서 다음 변수들이 설정되어 있는지 확인:

```
NAVER_CLIENT_ID=your_naver_client_id
NAVER_CLIENT_SECRET=your_naver_client_secret
NEXT_PUBLIC_APP_URL=https://cally.kr
```

## 3. 테스트

설정 완료 후:

1. `https://cally.kr/login` 접속
2. **"네이버로 시작하기"** 버튼 클릭
3. 네이버 로그인 진행
4. 로그인 성공 후 `https://cally.kr`로 리다이렉트되는지 확인

## 문제 해결

### "redirect_uri_mismatch" 오류
- 네이버 개발자 센터의 Callback URL이 정확히 `https://cally.kr/api/auth/naver/callback`인지 확인
- URL 끝에 슬래시(`/`)가 없어야 합니다

### "캘리뷰에 로그인할 수 없습니다" 오류
- 네이버 개발자 센터에서 서비스 URL이 `https://cally.kr`로 설정되어 있는지 확인
- Callback URL이 정확히 일치하는지 확인

### 여전히 오류가 발생하는 경우
1. 브라우저 캐시 삭제
2. 네이버 개발자 센터 설정 저장 확인
3. Vercel 환경 변수 확인
4. Vercel 재배포 (환경 변수 변경 후)

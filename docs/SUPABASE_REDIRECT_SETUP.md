# Supabase 리다이렉트 URL 설정 가이드

## 문제 상황

프로덕션 환경에서 구글 로그인 후 `localhost:3000`으로 리다이렉트되는 문제가 발생할 수 있습니다.

## 원인

Supabase Auth는 Dashboard에 설정된 **Site URL**을 기본값으로 사용합니다. 프로덕션 URL이 등록되지 않으면 localhost로 리다이렉트됩니다.

## 해결 방법

### 1. Supabase Dashboard 접속

1. [Supabase Dashboard](https://app.supabase.com/) 접속
2. 프로젝트 선택

### 2. URL Configuration 설정

1. 좌측 메뉴에서 **Authentication** 클릭
2. **URL Configuration** 탭 클릭

### 3. Site URL 설정

**Site URL** 필드에 프로덕션 URL 입력:
```
https://calreview-kq7ob9xia-tturupapas-projects.vercel.app
```

### 4. Redirect URLs 추가

**Redirect URLs** 섹션에 다음 URL들을 추가:

```
https://calreview-kq7ob9xia-tturupapas-projects.vercel.app/auth/callback
http://localhost:3000/auth/callback
```

**참고**: 여러 URL을 추가하려면 각 URL을 새 줄에 입력하거나 쉼표로 구분합니다.

### 5. 저장

**Save** 버튼을 클릭하여 설정을 저장합니다.

## 확인 사항

설정 후 다음을 확인하세요:

1. ✅ Site URL이 프로덕션 URL로 설정되어 있는지
2. ✅ Redirect URLs에 프로덕션 콜백 URL이 포함되어 있는지
3. ✅ 개발 환경용 localhost URL도 포함되어 있는지

## 추가 참고

- Supabase는 Site URL을 기본 리다이렉트 대상으로 사용합니다
- 코드에서 `redirectTo` 옵션을 명시해도, Supabase Dashboard 설정이 우선순위가 높을 수 있습니다
- 프로덕션과 개발 환경 모두 지원하려면 두 URL을 모두 추가해야 합니다

## 트러블슈팅

### 여전히 localhost로 리다이렉트되는 경우

1. 브라우저 캐시를 지우고 다시 시도
2. Supabase Dashboard 설정이 제대로 저장되었는지 확인
3. Vercel 환경 변수 `NEXT_PUBLIC_APP_URL`이 설정되어 있는지 확인
4. 배포가 완료되었는지 확인 (새 배포가 필요할 수 있음)

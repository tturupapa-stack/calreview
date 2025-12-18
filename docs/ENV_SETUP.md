# 환경 변수 설정 가이드

## 필수 환경 변수

### Google Analytics 설정

1. [Google Analytics](https://analytics.google.com/) 접속
2. 속성 선택 또는 새 속성 생성
3. 관리 > 데이터 스트림 > 웹 스트림 선택
4. 측정 ID 복사 (예: `G-XXXXXXXXXX`)

`.env.local` 파일에 추가:
```bash
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

### Cron Secret 설정

`CRON_SECRET`은 이미 자동 생성되었습니다. Vercel에 배포할 때 이 값을 환경 변수로 설정하세요.

Vercel 대시보드에서:
1. 프로젝트 설정 > Environment Variables
2. `CRON_SECRET` 추가 (현재 `.env.local`에 있는 값)

## 확인 방법

환경 변수가 제대로 설정되었는지 확인:

```bash
# 로컬에서 확인
cat .env.local | grep -E "NEXT_PUBLIC_GA_ID|CRON_SECRET"
```

## 주의사항

- `.env.local` 파일은 Git에 커밋하지 마세요 (이미 .gitignore에 포함됨)
- Vercel에 배포할 때는 Vercel 대시보드에서 환경 변수를 설정하세요
- `NEXT_PUBLIC_` 접두사가 있는 변수는 클라이언트 사이드에서도 접근 가능합니다




# GitHub Actions 크롤러 스케줄링 설정 가이드

## 📋 개요

GitHub Actions를 사용하여 크롤러를 자동으로 실행하는 워크플로우를 설정합니다.

## ⚙️ 설정 방법

### 1. GitHub Secrets 등록

GitHub 저장소의 Settings > Secrets and variables > Actions에서 다음 환경 변수를 등록하세요:

- `NEXT_PUBLIC_SUPABASE_URL`: Supabase 프로젝트 URL
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase Service Role Key

### 2. 워크플로우 파일 확인

`.github/workflows/crawler.yml` 파일이 생성되어 있는지 확인하세요.

### 3. 스케줄 확인

현재 설정된 크롤링 스케줄:
- **매일 오전 9시 (KST)**: UTC 00:00
- **매일 오후 3시 (KST)**: UTC 06:00
- **매일 오후 9시 (KST)**: UTC 12:00

스케줄을 변경하려면 `.github/workflows/crawler.yml` 파일의 `cron` 값을 수정하세요.

### 4. 수동 실행

GitHub 저장소의 Actions 탭에서 "Crawler Schedule" 워크플로우를 선택하고 "Run workflow" 버튼을 클릭하여 수동으로 실행할 수 있습니다.

## 📊 실행 결과 확인

### Artifacts

크롤링 결과 JSON 파일은 GitHub Actions의 Artifacts에 자동으로 업로드됩니다:
- Actions 탭 > 실행된 워크플로우 > Artifacts 섹션
- 최대 7일간 보관됩니다

### 로그 확인

각 워크플로우 실행의 로그는 Actions 탭에서 확인할 수 있습니다.

### 오류 알림

크롤러 실행 중 오류가 발생하면 자동으로 GitHub Issue가 생성됩니다.

## 🔧 스케줄 커스터마이징

Cron 표현식 형식: `분 시 일 월 요일`

예시:
```yaml
# 매일 오전 9시 (KST)
- cron: '0 0 * * *'

# 매일 오전 9시, 오후 3시, 오후 9시 (KST)
- cron: '0 0,6,12 * * *'

# 매일 오전 9시만 (KST)
- cron: '0 0 * * *'
```

**참고**: GitHub Actions는 UTC 시간을 사용하므로, KST(한국 시간)로 설정하려면 9시간을 빼야 합니다.
- KST 09:00 = UTC 00:00
- KST 15:00 = UTC 06:00
- KST 21:00 = UTC 12:00

## 🚨 문제 해결

### 크롤러가 실행되지 않는 경우

1. GitHub Secrets가 올바르게 설정되었는지 확인
2. 워크플로우 파일의 문법 오류 확인
3. Actions 탭에서 오류 로그 확인

### 타임아웃 오류

크롤러 실행 시간이 30분을 초과하면 타임아웃됩니다. 필요시 `.github/workflows/crawler.yml`의 `timeout-minutes` 값을 조정하세요.

### 의존성 설치 실패

`requirements.txt`에 필요한 패키지가 모두 포함되어 있는지 확인하세요.


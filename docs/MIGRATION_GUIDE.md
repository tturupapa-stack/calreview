# 데이터베이스 마이그레이션 가이드

## 개요

UX 개선 작업을 위해 다음 데이터베이스 변경사항이 필요합니다.

## 마이그레이션 실행 방법

1. Supabase Dashboard 접속
2. SQL Editor 열기
3. `docs/supabase-kpi-migration.sql` 파일의 내용을 복사하여 실행

## 변경 사항

### 1. 새 테이블 생성

- **kpi_metrics**: KPI 지표 저장
- **review_deadline_feedback**: 리뷰 마감일 계산 정확도 피드백 (선택사항)

### 2. 기존 테이블 수정

#### applications 테이블
- `auto_detected` (BOOLEAN): 자동 당첨 확인 여부
- `detected_at` (TIMESTAMPTZ): 당첨 확인 시각

#### users 테이블
- `naver_session_cookies` (TEXT): 네이버 로그인 세션 쿠키 (당첨 확인용)
- `last_active_at` (TIMESTAMPTZ): 마지막 활동 시각 (KPI 계산용)

### 3. 인덱스 및 트리거

- KPI 계산 최적화를 위한 인덱스 추가
- 사용자 활동 자동 업데이트 트리거 추가

## 환경 변수 설정

`.env.local` 파일에 다음 변수를 추가하세요:

```bash
# Google Analytics
NEXT_PUBLIC_GA_ID=your_google_analytics_measurement_id

# Cron Secret (Vercel Cron 인증용)
CRON_SECRET=your_random_secret_key_here
```

## Vercel Cron 설정

`vercel.json` 파일이 이미 생성되어 있습니다. Vercel에 배포하면 자동으로 매일 새벽 1시에 KPI가 계산됩니다.

## 확인 사항

마이그레이션 후 다음을 확인하세요:

1. ✅ `kpi_metrics` 테이블이 생성되었는지
2. ✅ `applications` 테이블에 `auto_detected`, `detected_at` 필드가 추가되었는지
3. ✅ `users` 테이블에 `naver_session_cookies`, `last_active_at` 필드가 추가되었는지
4. ✅ 인덱스가 생성되었는지
5. ✅ 트리거가 생성되었는지

## 문제 해결

### RLS 정책 오류
RLS 정책이 이미 존재하는 경우 오류가 발생할 수 있습니다. 이 경우 해당 정책을 먼저 삭제한 후 다시 실행하세요.

### 트리거 중복 오류
트리거가 이미 존재하는 경우 `CREATE TRIGGER IF NOT EXISTS` 구문을 사용하거나 기존 트리거를 삭제한 후 실행하세요.



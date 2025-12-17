# 데브 서버 캠페인 비활성화 SQL 쿼리

테스트 중인 사이트(`stylec`)를 제외한 모든 새 사이트와 리스크 사이트의 캠페인을 비활성화하는 SQL 쿼리입니다.

## Supabase SQL Editor에서 실행

```sql
-- 테스트 중이 아닌 새 사이트들의 캠페인 비활성화
UPDATE campaigns
SET is_active = false
WHERE source IN ('modan', 'myinfluencer', 'chuble', 'real_review', 'dinodan')
  AND is_active = true;

-- 리스크 사이트들의 캠페인 비활성화 (이미 실행했을 수도 있음)
UPDATE campaigns
SET is_active = false
WHERE source IN ('reviewnote', 'reviewplace', 'seoulouba', 'modooexperience')
  AND is_active = true;

-- 대체된 사이트들의 캠페인 비활성화
UPDATE campaigns
SET is_active = false
WHERE source IN ('gangnam', 'pavlovu')
  AND is_active = true;

-- 확인: 활성화된 캠페인 수 확인
SELECT source, COUNT(*) as count
FROM campaigns
WHERE is_active = true
GROUP BY source
ORDER BY count DESC;
```

## 비활성화 대상 사이트

### 새 사이트 (테스트 대기 중)
- `modan` - 모두의체험단
- `myinfluencer` - 마이인플루언서
- `chuble` - 츄블
- `real_review` - 리얼리뷰
- `dinodan` - 디노단

### 리스크 사이트 (robots.txt 위반)
- `reviewnote` - /campaigns/ 경로 금지
- `reviewplace` - /pr 경로 금지
- `seoulouba` - 전체 경로 금지
- `modooexperience` - /campaign.php 경로 금지

### 대체된 사이트
- `gangnam` - 대체됨
- `pavlovu` - 대체됨

## 활성화 유지 사이트

- `dinnerqueen` - 기존 유지
- `stylec` - 현재 테스트 중

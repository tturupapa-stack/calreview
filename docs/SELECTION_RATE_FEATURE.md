# 당첨확률 표시 기능 설계 문서

> 작성일: 2025-12-18
> 상태: 설계 중

---

## 1. 개요

체험단 캠페인의 당첨확률을 실시간으로 계산하여 사용자에게 표시하는 기능

### 1.1 목표
- 사용자가 당첨 가능성이 높은 캠페인을 쉽게 찾을 수 있도록 지원
- 경쟁사(콜라보매니저) 대비 차별화된 인사이트 제공

---

## 2. 데이터 제공 현황

### 2.1 사이트별 데이터 가용성

| 사이트 | 모집인원 | 신청자수 | 데이터 소스 | 확률 계산 |
|-------|---------|---------|------------|----------|
| stylec | ✅ | ✅ | API | **가능** |
| chuble | ✅ | ✅ | HTML | **가능** |
| dinodan | ✅ | ✅ | HTML | **가능** |
| modan | ❌ | ❌ | - | 불가 |
| real_review | ✅ | ❌ | HTML | 불가 |

### 2.2 데이터 상세

#### stylec (API)
```json
{
  "tr_recruit_max": 30,    // 모집인원
  "tr_enroll_cnt": 63      // 신청자수
}
```

#### chuble / dinodan (HTML)
```
신청자수/모집인원 형식: "6/50", "34/50"
위치: .common_graph_rows_top 또는 카드 텍스트 내
```

---

## 3. 데이터베이스 설계

### 3.1 campaigns 테이블 컬럼 추가

```sql
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS recruit_count INTEGER;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS applicant_count INTEGER;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS selection_rate DECIMAL(5,2);
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS rate_updated_at TIMESTAMPTZ;

COMMENT ON COLUMN campaigns.recruit_count IS '모집인원';
COMMENT ON COLUMN campaigns.applicant_count IS '신청자수';
COMMENT ON COLUMN campaigns.selection_rate IS '당첨확률 (%)';
COMMENT ON COLUMN campaigns.rate_updated_at IS '확률 데이터 최종 업데이트 시간';
```

### 3.2 인덱스

```sql
CREATE INDEX IF NOT EXISTS idx_campaigns_selection_rate
ON campaigns(selection_rate DESC)
WHERE is_active = true AND selection_rate IS NOT NULL;
```

---

## 4. 확률 계산 로직

### 4.1 기본 공식

```
당첨확률(%) = (모집인원 / 신청자수) × 100
```

### 4.2 등급 분류

| 등급 | 확률 범위 | 색상 | Tailwind Class |
|-----|----------|------|----------------|
| 매우높음 | 50% 이상 | 초록 | `bg-green-500` |
| 높음 | 30-49% | 연두 | `bg-lime-500` |
| 보통 | 10-29% | 노랑 | `bg-yellow-500` |
| 낮음 | 5-9% | 주황 | `bg-orange-500` |
| 매우낮음 | 5% 미만 | 빨강 | `bg-red-500` |

### 4.3 예외 처리

```typescript
function calculateSelectionRate(recruitCount: number, applicantCount: number): number | null {
  // 신청자가 0명이면 100% 반환
  if (applicantCount === 0) return 100;

  // 모집인원이 0이면 null 반환
  if (recruitCount === 0) return null;

  // 확률 계산 (최대 100%)
  const rate = (recruitCount / applicantCount) * 100;
  return Math.min(rate, 100);
}
```

---

## 5. 크롤러 수정

### 5.1 Campaign 모델 수정

```python
# crawler/models.py
@dataclass
class Campaign:
    # ... 기존 필드 ...
    recruit_count: Optional[int] = None      # 모집인원
    applicant_count: Optional[int] = None    # 신청자수
```

### 5.2 사이트별 크롤러 수정

#### stylec.py
```python
def _parse_campaign(item: dict) -> Campaign | None:
    # ... 기존 코드 ...

    recruit_count = item.get("tr_recruit_max")
    applicant_count = item.get("tr_enroll_cnt")

    return Campaign(
        # ... 기존 필드 ...
        recruit_count=int(recruit_count) if recruit_count else None,
        applicant_count=int(applicant_count) if applicant_count else None,
    )
```

#### chuble.py / dinodan.py
```python
def _parse_campaign_element(card, category_id: str) -> Campaign | None:
    # ... 기존 코드 ...

    # 신청자수/모집인원 추출 (X/Y 형식)
    recruit_count = None
    applicant_count = None

    count_match = re.search(r'(\d+)\s*/\s*(\d+)', card.get_text())
    if count_match:
        applicant_count = int(count_match.group(1))
        recruit_count = int(count_match.group(2))

    return Campaign(
        # ... 기존 필드 ...
        recruit_count=recruit_count,
        applicant_count=applicant_count,
    )
```

---

## 6. API 설계

### 6.1 기존 API 응답 확장

```typescript
// GET /api/campaigns
interface CampaignResponse {
  // ... 기존 필드 ...
  recruit_count: number | null;
  applicant_count: number | null;
  selection_rate: number | null;
  rate_grade: 'very_high' | 'high' | 'medium' | 'low' | 'very_low' | null;
}
```

### 6.2 정렬 옵션 추가

```
GET /api/campaigns?sort=selection_rate_desc  // 당첨확률 높은 순
GET /api/campaigns?sort=selection_rate_asc   // 당첨확률 낮은 순
```

### 6.3 필터 옵션 추가

```
GET /api/campaigns?min_rate=30  // 30% 이상만
GET /api/campaigns?rate_grade=very_high,high  // 매우높음, 높음만
```

---

## 7. UI 컴포넌트

### 7.1 SelectionRateBadge 컴포넌트

```tsx
// components/ui/SelectionRateBadge.tsx
interface SelectionRateBadgeProps {
  rate: number | null;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

function SelectionRateBadge({ rate, size = 'md', showLabel = true }: SelectionRateBadgeProps) {
  if (rate === null) return null;

  const { grade, color, label } = getGradeInfo(rate);

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${color}`}>
      <span className="font-bold">{rate.toFixed(0)}%</span>
      {showLabel && <span className="text-xs">{label}</span>}
    </span>
  );
}
```

### 7.2 CampaignCard 수정

```tsx
// 카드에 확률 배지 추가
<div className="flex items-center gap-2">
  <SelectionRateBadge rate={campaign.selection_rate} size="sm" />
  <span className="text-xs text-muted-foreground">
    {campaign.applicant_count}/{campaign.recruit_count}명
  </span>
</div>
```

### 7.3 상세 페이지 프로그레스바

```tsx
// 상세 페이지용 확률 표시
<div className="space-y-2">
  <div className="flex justify-between text-sm">
    <span>당첨확률</span>
    <span className="font-bold">{rate}%</span>
  </div>
  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
    <div
      className={`h-full ${getGradeColor(rate)}`}
      style={{ width: `${Math.min(rate, 100)}%` }}
    />
  </div>
  <div className="flex justify-between text-xs text-muted-foreground">
    <span>신청 {applicantCount}명</span>
    <span>모집 {recruitCount}명</span>
  </div>
</div>
```

---

## 8. 데이터 업데이트 주기

### 8.1 크롤링 시 업데이트
- 정기 크롤링 시 자동 업데이트
- 새 캠페인 발견 시 초기 데이터 수집

### 8.2 실시간 업데이트 (Phase 2)
- 캠페인 상세 페이지 접근 시 실시간 갱신
- 캐시: 10분간 유효

---

## 9. 구현 순서

### Phase 1 (MVP)
1. [x] 사이트별 데이터 가용성 분석
2. [ ] DB 스키마 마이그레이션
3. [ ] Campaign 모델 수정
4. [ ] stylec 크롤러 수정
5. [ ] chuble/dinodan 크롤러 수정
6. [ ] API 응답 확장
7. [ ] SelectionRateBadge 컴포넌트
8. [ ] CampaignCard에 배지 추가
9. [ ] 정렬 옵션 추가

### Phase 2 (개선)
- [ ] 상세 페이지 실시간 갱신
- [ ] 확률 기반 필터
- [ ] 히스토리 데이터 수집 (평균 경쟁률 분석)

---

## 10. 제한사항

1. **modan**: 데이터 미제공으로 확률 표시 불가
2. **real_review**: 신청자수 미제공으로 확률 표시 불가
3. **데이터 정확도**: 크롤링 시점 기준 (실시간 아님)

---

## 변경 이력

| 날짜 | 변경 내용 |
|-----|---------|
| 2025-12-18 | 초안 작성, 데이터 가용성 분석 완료 |

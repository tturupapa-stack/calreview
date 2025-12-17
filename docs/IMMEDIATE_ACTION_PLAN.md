# 즉시 대처방안 실행 가이드

## 실행 완료 사항 ✅

### 1. 크롤링 중단
- ✅ `crawler/main.py`에서 리스크 높은 4개 사이트 제거 완료
- 중단된 사이트:
  - `reviewnote` (리뷰노트)
  - `reviewplace` (리뷰플레이스)
  - `seoulouba` (서울오빠)
  - `modooexperience` (모두의체험단)

### 2. 숨김 처리 스크립트 작성
- ✅ `crawler/scripts/hide_risky_campaigns.py` 생성 완료
- 실행 방법: `python -m crawler.scripts.hide_risky_campaigns`

### 3. 대체 사이트 분석
- ✅ `docs/REPLACEMENT_SITES_ANALYSIS.md` 작성 완료

---

## 즉시 실행해야 할 작업

### Step 1: 기존 게시물 숨김 처리

```bash
# 프로젝트 루트에서 실행
cd /Users/larkkim/calreview
python3 -m crawler.scripts.hide_risky_campaigns
```

또는 Python 경로가 다른 경우:
```bash
python -m crawler.scripts.hide_risky_campaigns
```

**예상 결과**:
- 리뷰노트: 활성 캠페인 → `is_active=false`로 변경
- 리뷰플레이스: 활성 캠페인 → `is_active=false`로 변경
- 서울오빠: 활성 캠페인 → `is_active=false`로 변경
- 모두의체험단: 활성 캠페인 → `is_active=false`로 변경

---

### Step 2: 크롤러 스케줄 확인

GitHub Actions 워크플로우가 자동으로 실행되는 경우, 다음 크롤링부터는 중단된 사이트는 자동으로 제외됩니다.

**확인 사항**:
- `.github/workflows/crawler.yml` 확인
- 다음 스케줄 실행 시 중단된 사이트는 크롤링되지 않음

---

### Step 3: 대체 사이트 robots.txt 확인 결과

#### ✅ 크롤링 가능한 사이트 (즉시 개발 가능)

1. **스타일씨 (stylec.co.kr)** ⭐ 최우선
   ```
   User-agent: *
   Allow: /
   Disallow: /adm
   Disallow: /cs/
   Disallow: /review/search/
   ```
   - **상태**: ✅ 크롤링 가능
   - **제한**: 관리자/고객센터 경로만 금지
   - **우선순위**: 최우선

2. **모두의체험단 (modan.kr)**
   ```
   User-agent: *
   Allow: /
   Disallow: /site_join
   Disallow: /login
   ...
   ```
   - **상태**: ✅ 크롤링 가능
   - **제한**: 회원가입/로그인 경로만 금지
   - **주의**: 기존 `modooexperience`와 동일 사이트인지 확인 필요

3. **마이인플루언서 (myinfluencer.co.kr)**
   ```
   User-Agent: *
   Allow:/
   ```
   - **상태**: ✅ 크롤링 가능
   - **제한**: 없음

4. **츄블 (chuble.net)**
   ```
   User-agent: * 
   Disallow: /data/
   Disallow: /admin/
   ...
   ```
   - **상태**: ✅ 크롤링 가능
   - **제한**: 관리자/템플릿 경로만 금지

#### ⚠️ 주의 필요 사이트

5. **리뷰원정대 (xn--vk1bn0kvydxrlprb.com)**
   ```
   User-agent: *
   Disallow: /campaign.php
   ```
   - **상태**: 🟡 부분 제한
   - **제한**: `/campaign.php` 경로 금지
   - **가능성**: `campaign_list.php`는 금지되지 않아 목록 크롤링 가능할 수 있음
   - **확인 필요**: 실제 크롤링 경로가 `/campaign.php`인지 확인

---

## 대체 사이트 크롤러 개발 우선순위

### Phase 1: 즉시 개발 (1주일 이내)

1. **스타일씨 (stylec.co.kr)**
   - robots.txt: ✅ 허용
   - 우선순위: 최우선
   - 예상 데이터량: 높음

2. **모두의체험단 (modan.kr)**
   - robots.txt: ✅ 허용
   - 우선순위: 높음
   - 주의: 기존 사이트와 동일 여부 확인

### Phase 2: 추가 개발 (2주일 이내)

3. **마이인플루언서 (myinfluencer.co.kr)**
   - robots.txt: ✅ 허용
   - 우선순위: 중간

4. **츄블 (chuble.net)**
   - robots.txt: ✅ 허용
   - 우선순위: 중간

### Phase 3: 검토 필요

5. **리뷰원정대 (xn--vk1bn0kvydxrlprb.com)**
   - robots.txt: 🟡 부분 제한
   - 우선순위: 낮음 (경로 확인 후 결정)

---

## 데이터베이스 스키마 업데이트 필요

현재 `campaigns` 테이블의 `source` 필드에 CHECK 제약조건이 있어 새 사이트 추가 시 업데이트 필요:

```sql
-- 기존 제약조건 제거
ALTER TABLE public.campaigns 
DROP CONSTRAINT IF EXISTS campaigns_source_check;

-- 새 제약조건 추가 (대체 사이트 포함)
ALTER TABLE public.campaigns 
ADD CONSTRAINT campaigns_source_check 
CHECK (source IN (
  'reviewnote', 'revu', 'dinnerqueen', 'gangnam', 'reviewplace',
  'seoulouba', 'modooexperience', 'pavlovu',
  'stylec', 'chuble', 'modan', 'myinfluencer', 'reviewexpedition'
));
```

---

## 실행 체크리스트

### 즉시 실행 (오늘)

- [ ] 숨김 처리 스크립트 실행
  ```bash
  python3 -m crawler.scripts.hide_risky_campaigns
  ```
- [ ] 숨김 처리 결과 확인 (Supabase에서 확인)
- [ ] 크롤러 스케줄 확인 (GitHub Actions)

### 단기 실행 (1주일 이내)

- [ ] 스타일씨 크롤러 개발
- [ ] 모두의체험단(modan.kr) 크롤러 개발
- [ ] 데이터베이스 스키마 업데이트
- [ ] 테스트 크롤링 실행

### 중기 실행 (2주일 이내)

- [ ] 마이인플루언서 크롤러 개발
- [ ] 츄블 크롤러 개발
- [ ] 프로덕션 배포

---

## 예상 데이터 변화

### 크롤링 중단 전
- 총 크롤링 사이트: 7개
- 예상 일일 캠페인 수: 약 500-800개

### 크롤링 중단 후 (대체 없이)
- 총 크롤링 사이트: 3개 (dinnerqueen, gangnam, pavlovu)
- 예상 일일 캠페인 수: 약 100-200개
- **데이터 감소**: 약 70-80% 감소

### 대체 사이트 추가 후 (Phase 1 완료)
- 총 크롤링 사이트: 5개 (기존 3개 + 스타일씨, modan.kr)
- 예상 일일 캠페인 수: 약 300-500개
- **데이터 회복**: 약 60-70% 회복

### 대체 사이트 추가 후 (Phase 2 완료)
- 총 크롤링 사이트: 7개 (기존 3개 + 대체 4개)
- 예상 일일 캠페인 수: 약 400-600개
- **데이터 회복**: 약 80-90% 회복

---

## 모니터링

### 크롤링 로그 확인
- 크롤러 실행 후 로그에서 중단된 사이트가 실행되지 않는지 확인
- 에러 로그 확인

### 데이터베이스 모니터링
- 일일 수집 캠페인 수 추이 확인
- 사이트별 수집량 확인
- 숨김 처리된 캠페인 수 확인

---

## 롤백 계획

만약 대체 사이트 개발이 지연되거나 문제가 발생할 경우:

1. **임시 조치**: 기존 3개 사이트(dinnerqueen, gangnam, pavlovu)만으로 운영
2. **협의 진행**: 중단된 사이트 운영자와 크롤링 허가 협의
3. **점진적 복구**: 협의 완료된 사이트부터 단계적 재개

---

## 문의 및 협의 템플릿

### 사이트 운영자 협의 이메일 템플릿

```
제목: [cally.kr] 크롤링 허가 요청

안녕하세요.

저는 cally.kr을 운영하는 [회사명/이름]입니다.

저희 서비스는 체험단 정보를 수집하여 사용자에게 제공하는 플랫폼입니다.
[사이트명]의 공개된 캠페인 정보를 크롤링하여 사용자에게 제공하고자 합니다.

크롤링 조건:
- User-Agent: CallyBot/1.0 (+https://cally.kr/bot)
- 요청 빈도: 적절한 간격 유지 (서버 부하 최소화)
- 수집 정보: 캠페인 제목, 카테고리, 마감일, 지역 등 공개 정보만
- 상업적 사용: 사용자에게 정보 제공 목적

크롤링 허가를 받을 수 있다면, 다음 정보를 제공해주시면 감사하겠습니다:
- 허가 여부
- 크롤링 조건 (요청 빈도, 수집 범위 등)
- 연락처

감사합니다.

[이름]
[연락처]
[이메일]
```

---

## 참고 문서

- 상세 리스크 분석: `docs/CRAWLING_RISK_ANALYSIS.md`
- 대체 사이트 분석: `docs/REPLACEMENT_SITES_ANALYSIS.md`

---

**문서 버전**: 1.0  
**작성일**: 2025년 1월  
**최종 업데이트**: 2025년 1월

# cally.kr 크롤링 리스크 분석 보고서

## 개요
본 보고서는 cally.kr이 크롤링하는 7개 사이트의 `robots.txt` 및 이용약관을 분석하여 법적, 기술적 리스크를 종합적으로 평가한 것입니다.

**작성일**: 2025년 1월
**분석 대상 사이트**: 7개 체험단 플랫폼

---

## 1. 사이트별 상세 분석

### 1.1 리뷰노트 (reviewnote.co.kr)

#### 크롤링 경로
- **실제 크롤링 경로**: `/campaigns/{id}` (예: `https://www.reviewnote.co.kr/campaigns/12345`)
- **크롤링 방식**: 메인 페이지의 `__NEXT_DATA__`에서 캠페인 정보 추출

#### robots.txt 분석
```
User-Agent: *
Allow: /
Allow: /users/customerSupport
Disallow: /campaigns/
Disallow: /users/
```

**리스크 평가**: 🔴 **매우 높음**
- **직접 위반**: `/campaigns/` 경로가 명시적으로 `Disallow`되어 있음
- cally.kr은 정확히 이 경로를 크롤링하고 있어 **robots.txt 위반**이 명확함

#### 이용약관 분석
- 웹 검색 결과에서 정확한 이용약관 문서를 찾지 못함
- Google Play 스토어에 개인정보처리방침은 존재하나, 웹사이트 이용약관은 확인 필요

**권고사항**:
1. ⚠️ **즉시 조치 필요**: `/campaigns/` 경로 크롤링 중단 또는 사전 협의
2. 사이트 운영자와 크롤링 허가 협의 필요
3. 이용약관 전문 확인 후 추가 리스크 평가

---

### 1.2 디너의여왕 (dinnerqueen.net)

#### 크롤링 경로
- **실제 크롤링 경로**: `/taste?ct=전체&page={N}` (예: `https://dinnerqueen.net/taste?ct=전체&page=1`)
- **크롤링 방식**: HTML 파싱을 통한 캠페인 목록 수집

#### robots.txt 분석
```
User-agent: *
Allow: /
```

**리스크 평가**: 🟢 **낮음**
- robots.txt에 명시적인 제한이 없음
- 일반적인 크롤링이 허용된 것으로 보임

#### 이용약관 분석
- 웹 검색 결과에서 정확한 이용약관 문서를 찾지 못함

**권고사항**:
1. 이용약관 확인 후 자동화된 데이터 수집 금지 조항 여부 확인
2. 현재는 기술적 제약이 없으나, 법적 리스크는 별도 평가 필요

---

### 1.3 강남맛집 (xn--939au0g4vj8sq.net)

#### 크롤링 경로
- **실제 크롤링 경로**: `/cp/?ca={category_id}&page={N}` (예: `https://xn--939au0g4vj8sq.net/cp/?ca=2005&page=1`)
- **크롤링 방식**: 카테고리별 페이지 크롤링

#### robots.txt 분석
```
User-agent: *
Allow: /
Disallow: /adm
Disallow: /biz
Disallow: /MySql
Disallow: /plugin
Disallow: /review
Disallow: /cp/?id=1512660
Sitemap: https://xn--939au0g4vj8sq.net/sitemap.xml
```

**리스크 평가**: 🟡 **중간**
- `/review` 경로는 금지되어 있으나, 실제 크롤링 경로는 `/cp/`임
- `/cp/?id=1512660` 같은 특정 ID는 금지되어 있으나, 일반적인 `/cp/?ca=` 경로는 명시적 금지 없음
- **주의**: `/review` 경로를 크롤링하지 않도록 주의 필요

#### 이용약관 분석
- 웹 검색 결과에서 정확한 이용약관 문서를 찾지 못함
- 강남구체육회 관련 약관은 발견되었으나, 해당 도메인과는 무관한 것으로 판단됨

**권고사항**:
1. `/review` 경로는 절대 크롤링하지 않도록 주의
2. 이용약관 확인 필요

---

### 1.4 리뷰플레이스 (reviewplace.co.kr)

#### 크롤링 경로
- **실제 크롤링 경로**: `/pr/?id={id}` (예: `https://www.reviewplace.co.kr/pr/?id=12345`)
- **크롤링 방식**: 카테고리별 목록 페이지에서 상세 페이지 링크 수집

#### robots.txt 분석
```
User-agent: Googlebot
Disallow: /

User-agent: *
Allow: /$
Disallow: /board.php
Disallow: /bbs/board.php
Disallow: /bbs
Disallow: /pr
Disallow: /bd
Disallow: /theme
Disallow: /widget
Disallow: /detail.php
Disallow: /bbs_detail.php
Disallow: /html_file.php
Disallow: /bbs_list.php
Disallow: /happy_map.php
Disallow: /member_list.php
Disallow: /biz
```

**리스크 평가**: 🔴 **매우 높음**
- **직접 위반**: `/pr` 경로가 명시적으로 `Disallow`되어 있음
- cally.kr은 정확히 이 경로(`/pr/?id=`)를 크롤링하고 있어 **robots.txt 위반**이 명확함
- Googlebot은 완전히 차단되어 있음

#### 이용약관 분석
- 웹 검색 결과에서 리뷰플레이스 이용약관 링크는 발견되었으나, 실제 내용 확인 필요
- 사이트 하단에 "이용약관" 링크가 존재하는 것으로 확인됨

**권고사항**:
1. ⚠️ **즉시 조치 필요**: `/pr/` 경로 크롤링 중단 또는 사전 협의
2. 사이트 운영자와 크롤링 허가 협의 필요
3. 이용약관 전문 확인 후 추가 리스크 평가

---

### 1.5 서울오빠 (seoulouba.co.kr)

#### 크롤링 경로
- **실제 크롤링 경로**: `/campaign/?cat={category_id}&page={N}` (예: `https://www.seoulouba.co.kr/campaign/?cat=378&page=1`)
- **크롤링 방식**: 카테고리별 페이지 크롤링

#### robots.txt 분석
```
User-agent: *
Disallow: /
Allow: /$
```

**리스크 평가**: 🔴 **매우 높음**
- **극도로 제한적**: 루트 페이지(`/`)만 허용하고 모든 하위 경로는 금지
- cally.kr은 `/campaign/` 경로를 크롤링하고 있어 **robots.txt 위반**이 명확함
- 이는 가장 제한적인 robots.txt 설정 중 하나임

#### 이용약관 분석
- 웹 검색 결과에서 정확한 이용약관 문서를 찾지 못함

**권고사항**:
1. ⚠️ **즉시 조치 필요**: `/campaign/` 경로 크롤링 중단 또는 사전 협의
2. 사이트 운영자와 크롤링 허가 협의 필수
3. 이 사이트는 가장 높은 리스크를 가짐

---

### 1.6 모두의체험단 (xn--6j1br0ag3lba435lvsj96p.com)

#### 크롤링 경로
- **실제 크롤링 경로**: `/campaign.php?cp_id={id}` (예: `https://xn--6j1br0ag3lba435lvsj96p.com/campaign.php?cp_id=12345`)
- **크롤링 방식**: 카테고리별 목록 페이지에서 상세 페이지 링크 수집

#### robots.txt 분석
```
User-agent: *

User-agent: Googlebot
User-agent: NaverBot
User-agent: Yeti
User-agent: Daumoa
Disallow: /admin/
Disallow: /campaign.php
```

**리스크 평가**: 🔴 **매우 높음**
- **직접 위반**: 주요 검색 엔진 봇(Googlebot, NaverBot 등)에 대해 `/campaign.php`가 명시적으로 `Disallow`되어 있음
- cally.kr은 정확히 이 경로를 크롤링하고 있어 **robots.txt 위반**이 명확함
- 일반 `User-agent: *`에는 명시적 금지가 없으나, 검색 엔진 봇에 대한 금지 의도가 명확함

#### 이용약관 분석
- 웹 검색 결과에서 "모두세일" 등 유사 사이트의 이용약관은 발견되었으나, 정확한 도메인의 이용약관은 확인 필요
- `modan.kr`이 관련 사이트일 가능성이 있으나 확인 필요

**권고사항**:
1. ⚠️ **즉시 조치 필요**: `/campaign.php` 경로 크롤링 중단 또는 사전 협의
2. 사이트 운영자와 크롤링 허가 협의 필요
3. 이용약관 전문 확인 후 추가 리스크 평가

---

### 1.7 파블로 (pavlovu.com)

#### 크롤링 경로
- **실제 크롤링 경로**: `/review_campaign.php?p_id={id}` (예: `https://pavlovu.com/review_campaign.php?p_id=12345`)
- **크롤링 방식**: 카테고리별 목록 페이지에서 상세 페이지 링크 수집

#### robots.txt 분석
```
User-agent: *

User-agent: Googlebot
User-agent: NaverBot
User-agent: Yeti
User-agent: Daumoa
Disallow: /admin/
```

**리스크 평가**: 🟡 **중간**
- `/admin/` 경로만 금지되어 있고, `/review_campaign.php` 경로에 대한 명시적 금지는 없음
- 일반적인 크롤링이 허용된 것으로 보임

#### 이용약관 분석
- 웹 검색 결과에서 정확한 이용약관 문서를 찾지 못함

**권고사항**:
1. 이용약관 확인 후 자동화된 데이터 수집 금지 조항 여부 확인
2. 현재는 기술적 제약이 낮으나, 법적 리스크는 별도 평가 필요

---

## 2. 종합 리스크 평가

### 2.1 robots.txt 위반 사이트 (즉시 조치 필요)

| 사이트 | 위반 경로 | 위반 정도 | 우선순위 |
|--------|----------|----------|----------|
| **리뷰노트** | `/campaigns/` | 명시적 금지 | 🔴 최우선 |
| **리뷰플레이스** | `/pr` | 명시적 금지 | 🔴 최우선 |
| **서울오빠** | `/campaign/` | 전체 금지 (루트만 허용) | 🔴 최우선 |
| **모두의체험단** | `/campaign.php` | 검색엔진 봇 금지 | 🔴 최우선 |

### 2.2 주의 필요 사이트

| 사이트 | 주의 사항 | 우선순위 |
|--------|----------|----------|
| **강남맛집** | `/review` 경로 크롤링 금지 | 🟡 중간 |
| **파블로** | 이용약관 확인 필요 | 🟡 중간 |

### 2.3 낮은 리스크 사이트

| 사이트 | 상태 |
|--------|------|
| **디너의여왕** | robots.txt 제약 없음 (이용약관 확인 필요) |

---

## 3. 법적 리스크 분석

### 3.1 robots.txt 위반의 법적 의미

1. **계약 위반 가능성**
   - robots.txt는 웹사이트 운영자가 크롤러에게 제공하는 "계약"으로 해석될 수 있음
   - 위반 시 이용약관 위반으로 간주될 수 있음

2. **저작권 침해 가능성**
   - robots.txt 위반으로 수집한 데이터의 사용이 저작권 침해로 간주될 수 있음
   - 특히 상업적 목적으로 사용하는 경우 리스크 증가

3. **불공정 경쟁 가능성**
   - 경쟁 사이트의 데이터를 무단 수집하여 자사 서비스에 활용하는 것은 불공정 경쟁 행위로 간주될 수 있음

### 3.2 이용약관 위반 가능성

- 대부분의 웹사이트 이용약관에는 다음 조항이 포함될 수 있음:
  - 자동화된 데이터 수집 금지
  - 상업적 목적의 데이터 사용 금지
  - 저작권 보호 조항

**현재 상태**: 7개 사이트 중 정확한 이용약관을 확인한 사이트가 없음 → **추가 확인 필요**

---

## 4. 기술적 리스크 분석

### 4.1 IP 차단 가능성

- robots.txt 위반 사이트에서 IP 차단 가능성 높음
- 특히 서울오빠, 리뷰플레이스는 제한적 설정으로 차단 가능성 높음

### 4.2 법적 대응 가능성

- 사전 경고 없이 법적 조치를 취할 가능성
- 손해배상 청구 가능성

---

## 5. 권고사항

### 5.1 즉시 조치 사항 (긴급)

1. **크롤링 중단 또는 협의**
   - 리뷰노트 (`/campaigns/`)
   - 리뷰플레이스 (`/pr`)
   - 서울오빠 (`/campaign/`)
   - 모두의체험단 (`/campaign.php`)

2. **사이트 운영자 협의**
   - 각 사이트 운영자에게 크롤링 허가 요청
   - 공식 API 제공 여부 확인
   - 크롤링 조건 협의 (User-Agent, 요청 빈도 등)

### 5.2 단기 조치 사항 (1개월 이내)

1. **이용약관 확인**
   - 7개 사이트 모두 이용약관 전문 확인
   - 자동화된 데이터 수집 관련 조항 확인
   - 상업적 사용 관련 조항 확인

2. **법무 검토**
   - 법무팀 또는 법률 자문을 통한 리스크 평가
   - 크롤링 정책 수립

### 5.3 중장기 조치 사항 (3개월 이내)

1. **크롤링 정책 수립**
   - robots.txt 준수 정책
   - 이용약관 준수 정책
   - 크롤링 에티켓 가이드라인

2. **대안 모색**
   - 공식 API 활용
   - 파트너십 체결
   - 데이터 라이선스 계약

---

## 6. 리스크 완화 방안

### 6.1 기술적 완화 방안

1. **User-Agent 명시**
   - 명확한 User-Agent 설정 (예: `CallyBot/1.0 (+https://cally.kr/bot)`)
   - 연락처 정보 포함

2. **요청 빈도 제한**
   - 각 사이트별 적절한 요청 간격 설정
   - 서버 부하 최소화

3. **robots.txt 준수**
   - 크롤링 전 robots.txt 확인
   - 금지된 경로는 절대 크롤링하지 않음

### 6.2 법적 완화 방안

1. **공식 협의**
   - 사전 협의를 통한 크롤링 허가
   - 서면 합의서 작성

2. **데이터 사용 범위 명확화**
   - 수집 목적 명확화
   - 사용 범위 제한

3. **출처 명시**
   - 수집한 데이터에 출처 명시
   - 저작권 표시

---

## 7. 결론

### 7.1 주요 발견 사항

1. **4개 사이트에서 robots.txt 명시적 위반 확인**
   - 리뷰노트, 리뷰플레이스, 서울오빠, 모두의체험단

2. **이용약관 확인 미완료**
   - 7개 사이트 모두 이용약관 전문 확인 필요

3. **법적 리스크 존재**
   - 계약 위반, 저작권 침해, 불공정 경쟁 가능성

### 7.2 최종 권고

1. **즉시 조치**: robots.txt 위반 사이트 크롤링 중단 또는 협의
2. **법무 검토**: 법률 자문을 통한 리스크 평가
3. **정책 수립**: 크롤링 정책 및 가이드라인 수립
4. **협의 진행**: 사이트 운영자와 공식 협의

---

## 부록: robots.txt 원문

### 리뷰노트 (reviewnote.co.kr)
```
User-Agent: *
Allow: /
Allow: /users/customerSupport
Disallow: /campaigns/
Disallow: /users/
```

### 디너의여왕 (dinnerqueen.net)
```
User-agent: *
Allow: /
```

### 강남맛집 (xn--939au0g4vj8sq.net)
```
User-agent: *
Allow: /
Disallow: /adm
Disallow: /biz
Disallow: /MySql
Disallow: /plugin
Disallow: /review
Disallow: /cp/?id=1512660
Sitemap: https://xn--939au0g4vj8sq.net/sitemap.xml
```

### 리뷰플레이스 (reviewplace.co.kr)
```
User-agent: Googlebot
Disallow: /

User-agent: *
Allow: /$
Disallow: /board.php
Disallow: /bbs/board.php
Disallow: /bbs
Disallow: /pr
Disallow: /bd
Disallow: /theme
Disallow: /widget
Disallow: /detail.php
Disallow: /bbs_detail.php
Disallow: /html_file.php
Disallow: /bbs_list.php
Disallow: /happy_map.php
Disallow: /member_list.php
Disallow: /biz
```

### 서울오빠 (seoulouba.co.kr)
```
User-agent: *
Disallow: /
Allow: /$
```

### 모두의체험단 (xn--6j1br0ag3lba435lvsj96p.com)
```
User-agent: *

User-agent: Googlebot
User-agent: NaverBot
User-agent: Yeti
User-agent: Daumoa
Disallow: /admin/
Disallow: /campaign.php
```

### 파블로 (pavlovu.com)
```
User-agent: *

User-agent: Googlebot
User-agent: NaverBot
User-agent: Yeti
User-agent: Daumoa
Disallow: /admin/
```

---

**문서 버전**: 1.0  
**최종 업데이트**: 2025년 1월

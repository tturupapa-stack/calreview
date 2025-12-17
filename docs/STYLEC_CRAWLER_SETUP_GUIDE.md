# 스타일씨 크롤러 설정 가이드

## 📋 개요

스타일씨(`stylec.co.kr`)는 SPA(Single Page Application) 구조로 보이며, JavaScript로 동적으로 데이터를 로드합니다. 따라서 실제 HTML 구조를 확인하여 크롤러의 셀렉터를 조정해야 합니다.

## 🔍 단계별 가이드

### 1단계: 브라우저에서 실제 페이지 확인

1. **브라우저 열기**
   - Chrome 또는 Safari 사용 권장

2. **스타일씨 체험단 페이지 접속**
   ```
   https://www.stylec.co.kr/trials/
   ```

3. **페이지가 완전히 로드될 때까지 대기**
   - 스크롤을 내려서 여러 캠페인 카드가 보이는지 확인
   - 네트워크 탭에서 API 호출이 완료되었는지 확인

### 2단계: 개발자 도구로 HTML 구조 파악

#### 2-1. 개발자 도구 열기
- **Mac**: `Cmd + Option + I` 또는 `F12`
- **Windows**: `F12` 또는 `Ctrl + Shift + I`

#### 2-2. Elements 탭에서 캠페인 카드 찾기

1. **Elements 탭 클릭**

2. **Element 선택 도구 사용**
   - 개발자 도구 왼쪽 상단의 **커서 아이콘** 클릭 (또는 `Cmd/Ctrl + Shift + C`)
   - 페이지에서 **캠페인 카드 하나**에 마우스 오버
   - 해당 카드가 하이라이트되면 클릭

3. **HTML 구조 확인**
   - Elements 탭에서 선택된 요소의 HTML 구조 확인
   - 다음 정보를 메모:
     - **카드 전체를 감싸는 태그와 클래스명**
     - **제목이 있는 태그와 클래스명**
     - **링크가 있는 태그와 href 속성**
     - **이미지가 있는 태그와 src 속성**
     - **마감일이 있는 태그와 클래스명**
     - **카테고리가 있는 태그와 클래스명**

#### 2-3. 예시: HTML 구조 파악

예를 들어, 다음과 같은 구조를 발견했다고 가정:

```html
<div class="trial-card" data-trial-id="12345">
  <a href="/trials/detail/12345" class="trial-link">
    <img src="https://cdn.stylec.co.kr/..." class="trial-image" />
    <div class="trial-content">
      <h3 class="trial-title">[전국][블로그] 제품 체험단 모집</h3>
      <div class="trial-meta">
        <span class="trial-category">뷰티</span>
        <span class="trial-deadline">D-5</span>
      </div>
    </div>
  </a>
</div>
```

이 경우 다음 정보를 기록:
- **카드 전체**: `div.trial-card`
- **링크**: `a.trial-link` 또는 `a[href*='/trials/detail']`
- **제목**: `h3.trial-title`
- **이미지**: `img.trial-image`
- **카테고리**: `span.trial-category`
- **마감일**: `span.trial-deadline`

### 3단계: 크롤러 코드 수정

#### 3-1. 파일 위치
```
/Users/larkkim/calreview/crawler/sites/stylec.py
```

#### 3-2. 수정할 부분

**A. `crawl()` 함수의 셀렉터 수정**

현재 코드 (138-147줄):
```python
possible_selectors = [
    ".trial_item",
    ".campaign_item", 
    ".item",
    "[class*='trial']",
    "[class*='campaign']",
    "[class*='card']",
    "div[data-trial]",
    "div[data-campaign]",
]
```

**실제 발견한 셀렉터로 교체**:
```python
possible_selectors = [
    ".trial-card",  # 실제 발견한 클래스명
    "div[data-trial-id]",  # 실제 발견한 속성
    # ... 기타 패턴
]
```

**B. `_parse_campaign_element()` 함수의 셀렉터 수정**

**링크 찾기** (21줄):
```python
# 현재
link_el = card.select_one("a[href*='trial'], a[href*='campaign'], a[href*='wr_id'], a[href*='board.php'], a[href]")

# 실제 구조에 맞게 수정 예시
link_el = card.select_one("a.trial-link, a[href*='/trials/detail']")
```

**제목 찾기** (34줄):
```python
# 현재
title_el = card.select_one(".bo_subject, .list_subject, a[href*='wr_id']")

# 실제 구조에 맞게 수정 예시
title_el = card.select_one("h3.trial-title, .trial-title")
```

**마감일 찾기** (62줄):
```python
# 현재
deadline_el = card.select_one(".dday, .deadline, .date")

# 실제 구조에 맞게 수정 예시
deadline_el = card.select_one("span.trial-deadline, .trial-deadline")
```

**카테고리 찾기** (71줄):
```python
# 현재
category_el = card.select_one(".category, .bo_cate")

# 실제 구조에 맞게 수정 예시
category_el = card.select_one("span.trial-category, .trial-category")
```

**이미지 찾기** (75줄):
```python
# 현재
img_el = card.select_one("img")

# 실제 구조에 맞게 수정 예시 (필요시)
img_el = card.select_one("img.trial-image, img")
```

### 4단계: 크롤러 테스트

#### 4-1. 크롤러 실행
```bash
cd /Users/larkkim/calreview
source crawler/venv/bin/activate
python3 -m crawler.main --mode full
```

#### 4-2. 로그 확인

**성공적인 경우**:
```
2025-12-13 21:17:32,281 - Crawler - INFO - 스타일씨 크롤링 시작
2025-12-13 21:17:32,424 - Crawler - INFO - 스타일씨 페이지 응답 상태: 200, 길이: 50000
2025-12-13 21:17:32,540 - Crawler - INFO - 스타일씨: 셀렉터 '.trial-card'로 30개 카드 발견
2025-12-13 21:17:32,541 - Crawler - INFO - 스타일씨 총 30개 캠페인 수집
```

**실패한 경우**:
```
2025-12-13 21:17:32,424 - Crawler - WARNING - 스타일씨: 캠페인 카드를 찾을 수 없습니다.
```

#### 4-3. 문제 해결

**문제 1: 캠페인 카드를 찾을 수 없음**
- **원인**: 셀렉터가 실제 HTML 구조와 맞지 않음
- **해결**: 2단계로 돌아가서 실제 HTML 구조를 다시 확인하고 셀렉터 수정

**문제 2: 페이지 응답이 비어있음**
- **원인**: SPA 구조로 JavaScript가 데이터를 로드함
- **해결 옵션**:
  - **옵션 A**: Selenium 사용 (JavaScript 실행 필요)
  - **옵션 B**: API 엔드포인트 직접 호출 (Network 탭에서 확인)

**문제 3: 일부 데이터만 수집됨**
- **원인**: 셀렉터가 일부 요소만 선택함
- **해결**: 더 넓은 범위의 셀렉터 사용 또는 여러 셀렉터 조합

### 5단계: API 엔드포인트 확인 (선택사항)

SPA 구조인 경우, 실제 데이터는 API를 통해 로드될 수 있습니다.

#### 5-1. Network 탭 확인

1. 개발자 도구의 **Network 탭** 열기
2. 페이지 새로고침 (`Cmd/Ctrl + R`)
3. **XHR** 또는 **Fetch** 필터 선택
4. `/trials/` 페이지 로드 시 호출되는 API 요청 확인

#### 5-2. API 응답 확인

1. API 요청 클릭
2. **Response** 탭에서 응답 데이터 확인
3. JSON 형식인 경우, 구조 파악

#### 5-3. API 직접 호출 (고급)

API 엔드포인트를 발견한 경우, `requests`로 직접 호출:

```python
import requests
import json

# 예시 (실제 엔드포인트는 Network 탭에서 확인)
api_url = "https://api2.stylec.co.kr:6439/v1/trials"
headers = {
    "User-Agent": "Mozilla/5.0 ...",
    # 필요한 경우 추가 헤더
}
response = requests.get(api_url, headers=headers, params={"page": 1})
data = response.json()

# JSON 구조 확인 후 파싱 로직 작성
```

### 6단계: Selenium 사용 (최후의 수단)

JavaScript 실행이 필요한 경우, Selenium 사용을 고려:

```python
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from bs4 import BeautifulSoup

options = Options()
options.add_argument('--headless')  # 브라우저 창 숨기기
driver = webdriver.Chrome(options=options)

driver.get("https://www.stylec.co.kr/trials/")
# JavaScript 실행 대기
time.sleep(5)  # 또는 WebDriverWait 사용

soup = BeautifulSoup(driver.page_source, "html.parser")
# 이후 BeautifulSoup으로 파싱
```

## 📝 체크리스트

크롤러 수정 전 확인사항:

- [ ] 브라우저에서 `/trials/` 페이지 접속 성공
- [ ] 캠페인 카드가 화면에 표시됨
- [ ] 개발자 도구로 HTML 구조 확인 완료
- [ ] 카드 전체 셀렉터 확인
- [ ] 제목 셀렉터 확인
- [ ] 링크 셀렉터 확인
- [ ] 이미지 셀렉터 확인
- [ ] 마감일 셀렉터 확인
- [ ] 카테고리 셀렉터 확인
- [ ] 크롤러 코드 수정 완료
- [ ] 테스트 실행 완료
- [ ] 데이터 수집 확인

## 🐛 문제 해결 팁

### 팁 1: 여러 셀렉터 시도
```python
# 여러 가능한 셀렉터를 순서대로 시도
title_el = (
    card.select_one("h3.trial-title") or
    card.select_one(".trial-title") or
    card.select_one("a.trial-link") or
    card.select_one("a[href*='/trials']")
)
```

### 팁 2: 부모 요소에서 찾기
```python
# 카드 전체에서 찾기
title_el = card.select_one(".trial-title")
if not title_el:
    # 부모 요소에서 찾기
    parent = card.parent
    title_el = parent.select_one(".trial-title")
```

### 팁 3: 텍스트로 찾기
```python
# 특정 텍스트를 포함하는 요소 찾기
all_elements = card.find_all(text=True)
for elem in all_elements:
    if "체험단" in elem or "모집" in elem:
        # 해당 요소의 부모 찾기
        title_el = elem.parent
        break
```

## 📚 참고 자료

- [BeautifulSoup 공식 문서](https://www.crummy.com/software/BeautifulSoup/bs4/doc/)
- [CSS Selector 참고](https://www.w3schools.com/cssref/css_selectors.asp)
- 기존 크롤러 참고: `crawler/sites/dinnerqueen.py`

## 💡 다음 단계

스타일씨 크롤러가 정상 작동하면:
1. 수집된 데이터 확인
2. Supabase에 저장 확인
3. 다음 사이트(`modan`) 크롤러 테스트 준비

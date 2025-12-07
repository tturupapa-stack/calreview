"""상세 페이지에서 추가 정보를 추출하는 유틸리티 함수들."""

import re
from typing import Optional, Dict, Any

import requests
from bs4 import BeautifulSoup

from crawler.utils import clean_text, logger


def extract_detail_info(url: str, site_name: str) -> Dict[str, Any]:
    """상세 페이지에서 리뷰 기간 및 카테고리 정보를 추출.
    
    Args:
        url: 캠페인 상세 페이지 URL
        site_name: 사이트 이름 (reviewnote, dinnerqueen, gangnam, reviewplace, seoulouba, modooexperience, pavlovu)
    
    Returns:
        Dict: {"review_deadline_days": int | None, "category": str | None}
    """
    result = {"review_deadline_days": None, "category": None}
    
    try:
        headers = {
            "User-Agent": (
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/120.0.0.0 Safari/537.36"
            )
        }
        
        
        # 타임아웃 30초로 증가 (서울오빠 등 느린 사이트 대비)
        res = requests.get(url, headers=headers, timeout=30)
        res.raise_for_status()
        
        soup = BeautifulSoup(res.text, "html.parser")
        
        if site_name == "reviewnote":
            result["review_deadline_days"] = _extract_reviewnote_review_days(soup)
        elif site_name == "dinnerqueen":
            result["review_deadline_days"] = _extract_dinnerqueen_review_days(soup)
        elif site_name == "gangnam":
            result["review_deadline_days"] = _extract_gangnam_review_days(soup)
        elif site_name == "reviewplace":
            result["review_deadline_days"] = _extract_reviewplace_review_days(soup)
        elif site_name == "seoulouba":
            return _extract_seoulouba_detail(soup)
        elif site_name == "modooexperience":
            result["review_deadline_days"] = _extract_modoo_review_days(soup)
        elif site_name == "pavlovu":
            result["review_deadline_days"] = _extract_pavlovu_review_days(soup)
        
    except Exception as e:
        logger.warning("[%s] 상세 페이지 정보 추출 실패: %s (URL: %s)", site_name, e, url)
    
    return result


def _extract_seoulouba_detail(soup: BeautifulSoup) -> Dict[str, Any]:
    """서울오빠 상세 페이지 정보 추출."""
    result = {"review_deadline_days": None, "category": None}
    
    try:
        # 1. 카테고리 추출
        # 상세페이지 상단 태그들: [방문형] [여행/숙박] [네이버블로그]
        # 보통 class="cate" 혹은 span 태그들
        # 정확한 셀렉터를 모르므로 텍스트 기반으로 탐색
        text = soup.get_text()
        
        # 여행/숙박, 맛집, 뷰티, 생활, 제품, 기자단 등이 포함된 태그 찾기
        categories = ["맛집", "뷰티", "여행", "숙박", "생활", "문화", "제품", "배송", "기자단", "식품", "디지털", "유아동", "패션", "반려동물"]
        
        # soup에서 태그들 순회
        # 서울오빠 상세페이지 구조 추정: .view_tit_tag > span
        # .ca_tag 추가 (Nature Hill 등에서 확인됨)
        tags = soup.select(".view_tit_tag span, .view_info span, .tag_box span, .ca_tag")
        
        # 태그가 안잡히면 body의 모든 span을 검사하는건 너무 많음.
        # 주요 컨테이너: div.view_wrap
        container = soup.select_one(".view_wrap, .sub_view")
        if container:
            tags = container.find_all("span")
            
        found_cat = None
        for tag in tags:
            t = clean_text(tag.get_text())
            # "방문형", "네이버블로그" 등 제외하고 카테고리 매칭
            if t in ["방문형", "배송형", "기자단", "네이버블로그", "인스타그램"]:
                continue
                
            # 여행/숙박 처리
            if "여행" in t or "숙박" in t:
                found_cat = "여행"
                if "숙박" in t: found_cat = "숙박" # 세부 분류가 있으면 그것을 사용
                break
            
            for cat in categories:
                if cat in t:
                    found_cat = t # "식품/맛집" 처럼 섞여있으면 그대로 가져옴 -> 나중에 정규화
                    break
            if found_cat:
                break
        
        result["category"] = found_cat

        # 2. 리뷰 기간 추출
        # "리뷰 등록 기간 2023.12.09 ~ 2023.12.22"
        # dt, dd 구조 혹은 table 구조
        result["review_deadline_days"] = _extract_generic_review_days(soup)

    except Exception as e:
        logger.warning("서울오빠 상세 파싱 실패: %s", e)
        
    return result

def _extract_modoo_review_days(soup: BeautifulSoup) -> Optional[int]:
    # 모두의체험단 리뷰 기간 추출 로직 (Generic 사용)
    return _extract_generic_review_days(soup)

def _extract_pavlovu_review_days(soup: BeautifulSoup) -> Optional[int]:
    # 파블로 리뷰 기간 추출 로직 (Generic 사용)
    return _extract_generic_review_days(soup)

def _extract_generic_review_days(soup: BeautifulSoup) -> Optional[int]:
    """일반적인 리뷰 기간 추출 로직 (텍스트 패턴 매칭)."""
    try:
        text = soup.get_text()
        # 날짜 범위 패턴: YYYY.MM.DD ~ YYYY.MM.DD
        # "리뷰" 키워드 근처의 날짜 탐색
        
        # 간단하게 텍스트 전체에서 "리뷰" & "기간"이 있는 줄의 날짜 파싱
        lines = text.split('\n')
        for line in lines:
            if "리뷰" in line and "기간" in line:
                # 12.09 ~ 12.22 또는 2023.12.09 ~ 2023.12.22
                match = re.search(r"(\d{2,4})\.(\d{1,2})\.(\d{1,2})\s*~\s*(\d{2,4})\.(\d{1,2})\.(\d{1,2})", line)
                if match:
                    from datetime import datetime
                    y1, m1, d1 = map(int, match.group(1, 2, 3))
                    y2, m2, d2 = map(int, match.group(4, 5, 6))
                    
                    curr_year = datetime.now().year
                    if y1 < 100: y1 += 2000
                    if y2 < 100: y2 += 2000
                    
                    start = datetime(y1, m1, d1)
                    end = datetime(y2, m2, d2)
                    diff = (end - start).days
                    if diff > 0:
                        return diff
    except Exception:
        pass
    return None

def _extract_reviewnote_review_days(soup: BeautifulSoup) -> Optional[int]:
    """리뷰노트 상세 페이지에서 리뷰 기간 추출."""
    try:
        # __NEXT_DATA__ 스크립트에서 리뷰 기간 정보 추출 시도
        next_data = soup.find("script", id="__NEXT_DATA__")
        if next_data and next_data.string:
            import json
            data = json.loads(next_data.string)
            # 리뷰 기간 정보가 있는 경로 확인 필요
            # 예: data.get("props", {}).get("pageProps", {}).get("campaign", {}).get("reviewDays")
            campaign_data = data.get("props", {}).get("pageProps", {}).get("campaign", {})
            review_days = campaign_data.get("reviewDays") or campaign_data.get("reviewDeadlineDays")
            if review_days:
                return int(review_days)
        
        # HTML에서 직접 추출 시도
        # "리뷰 기간: 7일", "리뷰 작성 기간: 14일" 등의 패턴 찾기
        text = soup.get_text()
        patterns = [
            r"리뷰\s*기간[:\s]*(\d+)\s*일",
            r"리뷰\s*작성\s*기간[:\s]*(\d+)\s*일",
            r"리뷰\s*마감[:\s]*(\d+)\s*일",
            r"(\d+)\s*일\s*이내\s*리뷰",
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return int(match.group(1))
                
    except Exception as e:
        logger.warning("리뷰노트 리뷰 기간 추출 실패: %s", e)
    
    return None


def _extract_dinnerqueen_review_days(soup: BeautifulSoup) -> Optional[int]:
    """디너의여왕 상세 페이지에서 리뷰 기간 추출.
    
    HTML 구조:
    - div: h6 태그들 (신청 기간, 발표 날짜, 리뷰 기간)
    - 다음 형제 div: p 태그들 (각 날짜)
    """
    try:
        # "리뷰 기간" h6 찾기
        for h6 in soup.find_all('h6'):
            if '리뷰 기간' in h6.get_text():
                # 부모 div의 h6들 중 몇 번째인지 확인
                parent_div = h6.parent
                h6_tags = parent_div.find_all('h6')
                review_index = None
                for i, tag in enumerate(h6_tags):
                    if '리뷰 기간' in tag.get_text():
                        review_index = i
                        break
                
                if review_index is not None:
                    # 다음 형제 div에서 같은 인덱스의 p 태그 찾기
                    next_div = parent_div.find_next_sibling('div')
                    if next_div:
                        p_tags = next_div.find_all('p', class_='qz-body-kr--line')
                        if review_index < len(p_tags):
                            period_text = clean_text(p_tags[review_index].get_text())
                            # "25.12.30 – 26.01.13" 형식을 파싱 (–는 en dash)
                            match = re.match(r"(\d{2})\.(\d{2})\.(\d{2})\s*[–-]\s*(\d{2})\.(\d{2})\.(\d{2})", period_text)
                            if match:
                                from datetime import datetime
                                year1, month1, day1 = int("20" + match.group(1)), int(match.group(2)), int(match.group(3))
                                year2, month2, day2 = int("20" + match.group(4)), int(match.group(5)), int(match.group(6))
                                
                                start_date = datetime(year1, month1, day1)
                                end_date = datetime(year2, month2, day2)
                                
                                diff_days = (end_date - start_date).days
                                if diff_days > 0:
                                    return diff_days
                break
                    
    except Exception as e:
        logger.warning("디너의여왕 리뷰 기간 추출 실패: %s", e)
    
    return None


def _extract_gangnam_review_days(soup: BeautifulSoup) -> Optional[int]:
    """강남맛집 상세 페이지에서 리뷰 기간 추출.
    
    HTML 예시: <dt>리뷰 등록기간</dt><dd>12.13 ~ 01.02</dd>
    """
    try:
        # dt 태그에서 "리뷰 등록기간" 찾기
        dt_elements = soup.select("dt")
        for dt in dt_elements:
            if "리뷰" in dt.get_text() and "기간" in dt.get_text():
                # 다음 dd 태그에서 날짜 범위 추출
                dd = dt.find_next_sibling("dd")
                if dd:
                    period_text = clean_text(dd.get_text())
                    # "12.13 ~ 01.02" 형식을 파싱
                    match = re.match(r"(\d{2})\.(\d{2})\s*~\s*(\d{2})\.(\d{2})", period_text)
                    if match:
                        from datetime import datetime
                        month1, day1 = int(match.group(1)), int(match.group(2))
                        month2, day2 = int(match.group(3)), int(match.group(4))
                        
                        # 현재 연도 기준 (연도가 넘어가면 조정)
                        current_year = datetime.now().year
                        year1 = current_year
                        year2 = current_year if month2 >= month1 else current_year + 1
                        
                        start_date = datetime(year1, month1, day1)
                        end_date = datetime(year2, month2, day2)
                        
                        diff_days = (end_date - start_date).days
                        if diff_days > 0:
                            return diff_days
                    
    except Exception as e:
        logger.warning("강남맛집 리뷰 기간 추출 실패: %s", e)
    
    return None


def _extract_reviewplace_review_days(soup: BeautifulSoup) -> Optional[int]:
    """리뷰플레이스 상세 페이지에서 리뷰 기간 추출.
    
    HTML 예시: <span class="tlabel">리뷰 등록기간</span><span class="fm_num">12.13 ~ 12.28</span>
    """
    try:
        # span.tlabel에서 "리뷰 등록기간" 찾기
        labels = soup.select("span.tlabel")
        for label in labels:
            if "리뷰" in label.get_text() and "기간" in label.get_text():
                # 다음 span.fm_num에서 날짜 범위 추출
                fm_num = label.find_next_sibling("span", class_="fm_num")
                if fm_num:
                    period_text = clean_text(fm_num.get_text())
                    # "12.13 ~ 12.28" 형식을 파싱
                    match = re.match(r"(\d{2})\.(\d{2})\s*~\s*(\d{2})\.(\d{2})", period_text)
                    if match:
                        from datetime import datetime
                        month1, day1 = int(match.group(1)), int(match.group(2))
                        month2, day2 = int(match.group(3)), int(match.group(4))
                        
                        # 현재 연도 기준 (연도가 넘어가면 조정)
                        current_year = datetime.now().year
                        year1 = current_year
                        year2 = current_year if month2 >= month1 else current_year + 1
                        
                        start_date = datetime(year1, month1, day1)
                        end_date = datetime(year2, month2, day2)
                        
                        diff_days = (end_date - start_date).days
                        if diff_days > 0:
                            return diff_days
                    
    except Exception as e:
        logger.warning("리뷰플레이스 리뷰 기간 추출 실패: %s", e)
    
    return None


def _extract_reviewnote_review_days(soup: BeautifulSoup) -> Optional[int]:
    """리뷰노트 상세 페이지에서 리뷰 기간 추출."""
    try:
        # __NEXT_DATA__ 스크립트에서 리뷰 기간 정보 추출 시도
        next_data = soup.find("script", id="__NEXT_DATA__")
        if next_data and next_data.string:
            import json
            data = json.loads(next_data.string)
            # 리뷰 기간 정보가 있는 경로 확인 필요
            # 예: data.get("props", {}).get("pageProps", {}).get("campaign", {}).get("reviewDays")
            campaign_data = data.get("props", {}).get("pageProps", {}).get("campaign", {})
            review_days = campaign_data.get("reviewDays") or campaign_data.get("reviewDeadlineDays")
            if review_days:
                return int(review_days)
        
        # HTML에서 직접 추출 시도
        # "리뷰 기간: 7일", "리뷰 작성 기간: 14일" 등의 패턴 찾기
        text = soup.get_text()
        patterns = [
            r"리뷰\s*기간[:\s]*(\d+)\s*일",
            r"리뷰\s*작성\s*기간[:\s]*(\d+)\s*일",
            r"리뷰\s*마감[:\s]*(\d+)\s*일",
            r"(\d+)\s*일\s*이내\s*리뷰",
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return int(match.group(1))
                
    except Exception as e:
        logger.warning("리뷰노트 리뷰 기간 추출 실패: %s", e)
    
    return None


def _extract_dinnerqueen_review_days(soup: BeautifulSoup) -> Optional[int]:
    """디너의여왕 상세 페이지에서 리뷰 기간 추출.
    
    HTML 구조:
    - div: h6 태그들 (신청 기간, 발표 날짜, 리뷰 기간)
    - 다음 형제 div: p 태그들 (각 날짜)
    """
    try:
        # "리뷰 기간" h6 찾기
        for h6 in soup.find_all('h6'):
            if '리뷰 기간' in h6.get_text():
                # 부모 div의 h6들 중 몇 번째인지 확인
                parent_div = h6.parent
                h6_tags = parent_div.find_all('h6')
                review_index = None
                for i, tag in enumerate(h6_tags):
                    if '리뷰 기간' in tag.get_text():
                        review_index = i
                        break
                
                if review_index is not None:
                    # 다음 형제 div에서 같은 인덱스의 p 태그 찾기
                    next_div = parent_div.find_next_sibling('div')
                    if next_div:
                        p_tags = next_div.find_all('p', class_='qz-body-kr--line')
                        if review_index < len(p_tags):
                            period_text = clean_text(p_tags[review_index].get_text())
                            # "25.12.30 – 26.01.13" 형식을 파싱 (–는 en dash)
                            match = re.match(r"(\d{2})\.(\d{2})\.(\d{2})\s*[–-]\s*(\d{2})\.(\d{2})\.(\d{2})", period_text)
                            if match:
                                from datetime import datetime
                                year1, month1, day1 = int("20" + match.group(1)), int(match.group(2)), int(match.group(3))
                                year2, month2, day2 = int("20" + match.group(4)), int(match.group(5)), int(match.group(6))
                                
                                start_date = datetime(year1, month1, day1)
                                end_date = datetime(year2, month2, day2)
                                
                                diff_days = (end_date - start_date).days
                                if diff_days > 0:
                                    return diff_days
                break
                    
    except Exception as e:
        logger.warning("디너의여왕 리뷰 기간 추출 실패: %s", e)
    
    return None


def _extract_gangnam_review_days(soup: BeautifulSoup) -> Optional[int]:
    """강남맛집 상세 페이지에서 리뷰 기간 추출.
    
    HTML 예시: <dt>리뷰 등록기간</dt><dd>12.13 ~ 01.02</dd>
    """
    try:
        # dt 태그에서 "리뷰 등록기간" 찾기
        dt_elements = soup.select("dt")
        for dt in dt_elements:
            if "리뷰" in dt.get_text() and "기간" in dt.get_text():
                # 다음 dd 태그에서 날짜 범위 추출
                dd = dt.find_next_sibling("dd")
                if dd:
                    period_text = clean_text(dd.get_text())
                    # "12.13 ~ 01.02" 형식을 파싱
                    match = re.match(r"(\d{2})\.(\d{2})\s*~\s*(\d{2})\.(\d{2})", period_text)
                    if match:
                        from datetime import datetime
                        month1, day1 = int(match.group(1)), int(match.group(2))
                        month2, day2 = int(match.group(3)), int(match.group(4))
                        
                        # 현재 연도 기준 (연도가 넘어가면 조정)
                        current_year = datetime.now().year
                        year1 = current_year
                        year2 = current_year if month2 >= month1 else current_year + 1
                        
                        start_date = datetime(year1, month1, day1)
                        end_date = datetime(year2, month2, day2)
                        
                        diff_days = (end_date - start_date).days
                        if diff_days > 0:
                            return diff_days
                    
    except Exception as e:
        logger.warning("강남맛집 리뷰 기간 추출 실패: %s", e)
    
    return None


def _extract_reviewplace_review_days(soup: BeautifulSoup) -> Optional[int]:
    """리뷰플레이스 상세 페이지에서 리뷰 기간 추출.
    
    HTML 예시: <span class="tlabel">리뷰 등록기간</span><span class="fm_num">12.13 ~ 12.28</span>
    """
    try:
        # span.tlabel에서 "리뷰 등록기간" 찾기
        labels = soup.select("span.tlabel")
        for label in labels:
            if "리뷰" in label.get_text() and "기간" in label.get_text():
                # 다음 span.fm_num에서 날짜 범위 추출
                fm_num = label.find_next_sibling("span", class_="fm_num")
                if fm_num:
                    period_text = clean_text(fm_num.get_text())
                    # "12.13 ~ 12.28" 형식을 파싱
                    match = re.match(r"(\d{2})\.(\d{2})\s*~\s*(\d{2})\.(\d{2})", period_text)
                    if match:
                        from datetime import datetime
                        month1, day1 = int(match.group(1)), int(match.group(2))
                        month2, day2 = int(match.group(3)), int(match.group(4))
                        
                        # 현재 연도 기준 (연도가 넘어가면 조정)
                        current_year = datetime.now().year
                        year1 = current_year
                        year2 = current_year if month2 >= month1 else current_year + 1
                        
                        start_date = datetime(year1, month1, day1)
                        end_date = datetime(year2, month2, day2)
                        
                        diff_days = (end_date - start_date).days
                        if diff_days > 0:
                            return diff_days
                    
    except Exception as e:
        logger.warning("리뷰플레이스 리뷰 기간 추출 실패: %s", e)
    
    return None


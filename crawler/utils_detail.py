"""상세 페이지에서 추가 정보를 추출하는 유틸리티 함수들."""

import re
from typing import Optional, Dict, Any

import requests
from bs4 import BeautifulSoup

from crawler.utils import clean_text, logger


def _validate_review_deadline_days(days: int) -> bool:
    """리뷰 기간이 합리적인 범위인지 검증.
    
    Args:
        days: 리뷰 기간 (일수)
    
    Returns:
        합리적인 범위(1일 ~ 90일)이면 True, 아니면 False
    """
    return 1 <= days <= 90


def _parse_date_range(period_text: str, pattern: str, current_year: int = None) -> Optional[int]:
    """날짜 범위 텍스트를 파싱하여 일수 차이를 반환.
    
    Args:
        period_text: 날짜 범위 텍스트 (예: "12.13 ~ 01.02", "25.12.30 – 26.01.13")
        pattern: 정규식 패턴
        current_year: 현재 연도 (None이면 자동 감지)
    
    Returns:
        일수 차이 (검증 통과 시), None (파싱 실패 또는 검증 실패)
    """
    from datetime import datetime
    
    if current_year is None:
        current_year = datetime.now().year
    
    try:
        match = re.match(pattern, period_text)
        if not match:
            return None
        
        groups = match.groups()
        
        # 패턴에 따라 날짜 파싱
        if len(groups) == 4:
            # MM.DD ~ MM.DD 형식
            month1, day1 = int(groups[0]), int(groups[1])
            month2, day2 = int(groups[2]), int(groups[3])
            year1 = current_year
            year2 = current_year if month2 >= month1 else current_year + 1
        elif len(groups) == 6:
            # YY.MM.DD – YY.MM.DD 형식
            year1, month1, day1 = int("20" + groups[0]), int(groups[1]), int(groups[2])
            year2, month2, day2 = int("20" + groups[3]), int(groups[4]), int(groups[5])
        else:
            return None
        
        # 날짜 유효성 검사
        try:
            start_date = datetime(year1, month1, day1)
            end_date = datetime(year2, month2, day2)
        except ValueError:
            logger.warning("유효하지 않은 날짜: %d.%d.%d ~ %d.%d.%d", year1, month1, day1, year2, month2, day2)
            return None
        
        diff_days = (end_date - start_date).days
        
        # 검증: 합리적인 범위인지 확인
        if _validate_review_deadline_days(diff_days):
            return diff_days
        else:
            logger.warning("리뷰 기간이 합리적 범위를 벗어남: %d일 (텍스트: %s)", diff_days, period_text)
            return None
            
    except Exception as e:
        logger.warning("날짜 범위 파싱 실패: %s (텍스트: %s)", e, period_text)
        return None


def extract_detail_info(url: str, site_name: str, max_retries: int = 2) -> Dict[str, Any]:
    """상세 페이지에서 리뷰 기간 및 카테고리 정보를 추출.
    
    Args:
        url: 캠페인 상세 페이지 URL
        site_name: 사이트 이름 (reviewnote, dinnerqueen, gangnam, reviewplace, seoulouba, modooexperience, pavlovu)
        max_retries: 최대 재시도 횟수 (기본값: 2)
    
    Returns:
        Dict: {"review_deadline_days": int | None, "category": str | None}
    """
    result = {"review_deadline_days": None, "category": None}
    
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/120.0.0.0 Safari/537.36"
        )
    }
    
    # 재시도 로직
    for attempt in range(max_retries + 1):
        try:
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
            
            # 성공 시 즉시 반환
            return result
            
        except requests.exceptions.RequestException as e:
            if attempt < max_retries:
                logger.debug("[%s] 상세 페이지 요청 실패 (재시도 %d/%d): %s (URL: %s)", 
                           site_name, attempt + 1, max_retries, e, url)
                continue
            else:
                logger.warning("[%s] 상세 페이지 요청 최종 실패: %s (URL: %s)", site_name, e, url)
        except Exception as e:
            logger.warning("[%s] 상세 페이지 정보 추출 실패: %s (URL: %s)", site_name, e, url)
            # 파싱 오류는 재시도하지 않음
            break
    
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
                days = int(match.group(1))
                if _validate_review_deadline_days(days):
                    return days
                
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
                            days = _parse_date_range(
                                period_text,
                                r"(\d{2})\.(\d{2})\.(\d{2})\s*[–-]\s*(\d{2})\.(\d{2})\.(\d{2})"
                            )
                            if days:
                                return days
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
                    days = _parse_date_range(
                        period_text,
                        r"(\d{2})\.(\d{2})\s*~\s*(\d{2})\.(\d{2})"
                    )
                    if days:
                        return days
                    
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
                    days = _parse_date_range(
                        period_text,
                        r"(\d{2})\.(\d{2})\s*~\s*(\d{2})\.(\d{2})"
                    )
                    if days:
                        return days
                    
    except Exception as e:
        logger.warning("리뷰플레이스 리뷰 기간 추출 실패: %s", e)
    
    return None


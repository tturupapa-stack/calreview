"""상세 페이지에서 리뷰 기간 정보를 추출하는 유틸리티 함수들."""

import re
from typing import Optional

import requests
from bs4 import BeautifulSoup

from crawler.utils import clean_text, logger


def extract_review_deadline_days(url: str, site_name: str) -> Optional[int]:
    """상세 페이지에서 리뷰 기간(일수)을 추출.
    
    Args:
        url: 캠페인 상세 페이지 URL
        site_name: 사이트 이름 (reviewnote, dinnerqueen, gangnam, reviewplace)
    
    Returns:
        리뷰 기간 일수 (예: 7, 14, 30) 또는 None
    """
    try:
        headers = {
            "User-Agent": (
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/120.0.0.0 Safari/537.36"
            )
        }
        
        res = requests.get(url, headers=headers, timeout=10)
        res.raise_for_status()
        
        soup = BeautifulSoup(res.text, "html.parser")
        
        if site_name == "reviewnote":
            return _extract_reviewnote_review_days(soup)
        elif site_name == "dinnerqueen":
            return _extract_dinnerqueen_review_days(soup)
        elif site_name == "gangnam":
            return _extract_gangnam_review_days(soup)
        elif site_name == "reviewplace":
            return _extract_reviewplace_review_days(soup)
        
    except Exception as e:
        logger.warning("[%s] 상세 페이지 리뷰 기간 추출 실패: %s (URL: %s)", site_name, e, url)
        return None
    
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


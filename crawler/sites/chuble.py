"""츄블 크롤러"""

import re
from datetime import datetime, timedelta
from typing import List
import requests
from bs4 import BeautifulSoup

from crawler.models import Campaign
from crawler.utils import clean_text, logger

BASE_URL = "https://chuble.net"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
}

# 카테고리 ID -> 카테고리명 매핑
CATEGORY_MAP = {
    # 방문형
    "850": "맛집",
    "852": "뷰티",
    "853": "여행",    # 숙박 -> 여행으로 통일
    "854": "생활",    # 기타 -> 생활로 변경
    "829": "맛집",    # 방문형 전체 (대부분 맛집)
    # 배송형
    "832": "배송",    # 제품 전체
    "834": "생활",    # 기자단 -> 생활
    "893": "뷰티",    # 제품-뷰티
    "970": "디지털",  # 제품-디지털
    "1003": "패션",   # 제품-패션
    "1004": "도서",   # 제품-도서
    "1005": "식품",   # 제품-식품
}


def _parse_campaign_element(card, category_id: str) -> Campaign | None:
    """츄블 캠페인 카드 한 개를 Campaign으로 변환."""
    try:
        # 링크 찾기 - detail.php 링크
        link_el = card.select_one("a[href*='detail.php']")
        if not link_el:
            return None

        href = link_el.get("href", "")
        if href.startswith("/"):
            url = BASE_URL + href
        elif href.startswith("http"):
            url = href
        else:
            url = BASE_URL + "/" + href

        # 제목 - .common_rows_title 클래스
        title_el = card.select_one(".common_rows_title")
        if not title_el:
            return None
        raw_title = clean_text(title_el.get_text())
        if not raw_title:
            return None

        # 지역 추출 (제목에서 [지역] 패턴)
        location = None
        bracket_matches = re.findall(r"\[([^\]]+)\]", raw_title)
        location_keywords = ["전국", "서울", "강남", "강서", "강북", "강동", "송파", "마포", "종로",
                           "부산", "대구", "인천", "광주", "대전", "울산", "세종",
                           "경기", "수원", "성남", "용인", "고양", "안양", "일산", "분당", "시흥",
                           "전북", "전주", "충북", "청주", "충남", "천안",
                           "경북", "포항", "문경", "경남", "창원", "강원", "춘천", "제주",
                           "달서", "동구", "서구", "남구", "북구", "중구", "계양", "새롬"]

        if bracket_matches:
            for match in bracket_matches:
                if any(keyword in match for keyword in location_keywords):
                    location = match
                    break

        # 제목에서 대괄호 제거
        title = re.sub(r"\[[^\]]+\]\s*", "", raw_title).strip()
        if not title:
            title = raw_title

        # 위치 정보 (.rows_cate에서 추가 추출)
        if not location:
            loc_el = card.select_one(".rows_cate")
            if loc_el:
                loc_text = clean_text(loc_el.get_text())
                if loc_text:
                    location = loc_text

        # D-day 파싱 (.common_rows_dday)
        deadline = None
        dday_el = card.select_one(".common_rows_dday")
        if dday_el:
            dday_text = clean_text(dday_el.get_text())
            # "D-11" 형식 파싱
            dday_match = re.search(r"D-?(\d+)", dday_text)
            if dday_match:
                days = int(dday_match.group(1))
                deadline = (datetime.now() + timedelta(days=days)).strftime("%Y-%m-%d")

        # 카테고리 - URL 또는 매핑에서 추출 (소스 카테고리 직접 사용)
        normalized_category = CATEGORY_MAP.get(category_id, "")

        # URL에서 카테고리 ID 추출 (detail.php?number=xxx&category=yyy)
        cat_match = re.search(r"category=(\d+)", url)
        if cat_match:
            url_cat_id = cat_match.group(1)
            if url_cat_id in CATEGORY_MAP:
                normalized_category = CATEGORY_MAP[url_cat_id]

        # 카테고리가 없으면 기본값
        if not normalized_category:
            normalized_category = "생활"

        # 이미지 - flexslider 내의 첫 번째 이미지
        img_el = card.select_one(".flexslider ul.slides li img, .flexslider img")
        image_url = None
        if img_el:
            src = img_el.get("src") or img_el.get("data-src")
            if src:
                if src.startswith("./"):
                    image_url = BASE_URL + "/" + src[2:]  # ./를 제거하고 BASE_URL 추가
                elif src.startswith("//"):
                    image_url = "https:" + src
                elif src.startswith("/"):
                    image_url = BASE_URL + src
                elif src.startswith("http"):
                    image_url = src
                else:
                    image_url = BASE_URL + "/" + src

        # 신청자수/모집인원 추출 (X/Y 형식)
        recruit_count = None
        applicant_count = None
        count_match = re.search(r'(\d+)\s*/\s*(\d+)', card.get_text())
        if count_match:
            applicant_count = int(count_match.group(1))
            recruit_count = int(count_match.group(2))

        return Campaign(
            title=title,
            url=url,
            site_name="chuble",
            category=normalized_category,
            deadline=deadline,
            location=location,
            image_url=image_url,
            channel="블로그",
            review_deadline_days=7,  # 츄블 정책: 체험 후 7일 이내 리뷰
            recruit_count=recruit_count,
            applicant_count=applicant_count,
        )
    except Exception as e:
        logger.error("츄블 캠페인 파싱 중 오류: %s", e)
        return None


def crawl(max_pages: int = 10) -> List[Campaign]:
    """츄블 크롤링 로직."""
    logger.info("츄블 크롤링 시작")
    campaigns: List[Campaign] = []
    seen_urls = set()
    empty_page_count = 0

    # 카테고리별 크롤링 - 지역(829), 제품(832)
    categories = [
        ("829", "지역"),  # 방문형 전체
        ("832", "제품"),  # 배송형 전체
    ]

    for category_id, category_name in categories:
        empty_page_count = 0
        for page in range(1, max_pages + 1):
            try:
                url = f"{BASE_URL}/category.php"
                params = {"category": category_id, "page": page}
                res = requests.get(url, params=params, headers=HEADERS, timeout=10)
                res.raise_for_status()

                soup = BeautifulSoup(res.text, "html.parser")
                # .list_graph_rows 클래스 내의 캠페인 아이템들
                cards = soup.select(".list_graph_rows")

                if not cards:
                    empty_page_count += 1
                    if empty_page_count >= 2:
                        logger.info("츄블 %s: 연속 빈 페이지로 크롤링 종료 (page %d)", category_name, page)
                        break
                    continue
                else:
                    empty_page_count = 0

                logger.info("츄블 %s 페이지 %d에서 %d개 캠페인 발견", category_name, page, len(cards))

                for card in cards:
                    campaign = _parse_campaign_element(card, category_id)
                    if campaign and campaign.url not in seen_urls:
                        seen_urls.add(campaign.url)
                        campaigns.append(campaign)

            except Exception as e:
                logger.error("츄블 %s 페이지 %d 크롤링 중 오류: %s", category_name, page, e)
                empty_page_count += 1
                if empty_page_count >= 2:
                    break

    logger.info("츄블 총 %d개 캠페인 수집", len(campaigns))
    return campaigns

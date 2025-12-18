"""디노단 크롤러"""

import re
from datetime import datetime, timedelta
from typing import List
import requests
from bs4 import BeautifulSoup

from crawler.models import Campaign
from crawler.utils import clean_text, logger

BASE_URL = "https://dinodan.co.kr"

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
    "1012": "생활",   # 기타 -> 생활
    "829": "맛집",    # 방문형 전체 (대부분 맛집)
    # 배송형
    "832": "배송",    # 배송형 전체
    "893": "뷰티",    # 배송-뷰티
    "1004": "도서",   # 배송-도서
    "1005": "식품",   # 배송-식품
}


def _parse_campaign_element(card, category_id: str) -> Campaign | None:
    """디노단 캠페인 카드 한 개를 Campaign으로 변환."""
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
        location_keywords = ["전국", "서울", "강남", "강서", "강북", "강동", "송파", "마포", "종로", "천호",
                           "부산", "대구", "인천", "광주", "대전", "울산", "세종",
                           "경기", "수원", "성남", "용인", "고양", "안양", "일산", "분당", "김포", "평택",
                           "전북", "전주", "충북", "청주", "충남", "천안",
                           "경북", "포항", "경남", "창원", "강원", "춘천", "제주"]

        if bracket_matches:
            for match in bracket_matches:
                if any(keyword in match for keyword in location_keywords):
                    location = match
                    break

        # 제목에서 대괄호 제거
        title = re.sub(r"\[[^\]]+\]\s*", "", raw_title).strip()
        if not title:
            title = raw_title

        # 채널 추출 (제목에서 클립/인스타 등)
        channel = "블로그"
        if "클립" in raw_title.lower():
            channel = "클립"
        elif "인스타" in raw_title.lower():
            channel = "인스타그램"
        elif "유튜브" in raw_title.lower():
            channel = "유튜브"

        # D-day 파싱 (.common_rows_dday)
        deadline = None
        dday_el = card.select_one(".common_rows_dday")
        if dday_el:
            dday_text = clean_text(dday_el.get_text())
            # "D-137" 형식 파싱
            dday_match = re.search(r"D-?(\d+)", dday_text)
            if dday_match:
                days = int(dday_match.group(1))
                deadline = (datetime.now() + timedelta(days=days)).strftime("%Y-%m-%d")

        # 카테고리 - URL에서 추출 (소스 카테고리 직접 사용)
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

        # 이미지 - flexslider 내 첫 번째 img 태그 (슬라이더 구조)
        img_el = card.select_one(".flexslider img")
        if not img_el:
            img_el = card.select_one("img")
        image_url = None
        if img_el:
            src = img_el.get("src") or img_el.get("data-src")
            if src:
                if src.startswith("//"):
                    image_url = "https:" + src
                elif src.startswith("./"):
                    # ./skin/... -> https://dinodan.co.kr/skin/...
                    image_url = BASE_URL + src[1:]  # ./ 에서 . 제거
                elif src.startswith("/"):
                    image_url = BASE_URL + src
                elif src.startswith("http"):
                    image_url = src
                else:
                    # 상대 경로 (skin/...)
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
            site_name="dinodan",
            category=normalized_category,
            deadline=deadline,
            location=location,
            image_url=image_url,
            channel=channel,
            review_deadline_days=7,  # 디노단 정책: 체험 후 7일 이내 리뷰
            recruit_count=recruit_count,
            applicant_count=applicant_count,
        )
    except Exception as e:
        logger.error("디노단 캠페인 파싱 중 오류: %s", e)
        return None


def crawl(max_pages: int = 10) -> List[Campaign]:
    """디노단 크롤링 로직."""
    logger.info("디노단 크롤링 시작")
    campaigns: List[Campaign] = []
    seen_urls = set()
    empty_page_count = 0

    # 카테고리별 크롤링 - 방문(829), 배송(832)
    categories = [
        ("829", "방문"),  # 방문형 전체
        ("832", "배송"),  # 배송형 전체
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
                # .common_graph_rows 클래스 내의 캠페인 아이템들
                cards = soup.select(".common_graph_rows")

                if not cards:
                    empty_page_count += 1
                    if empty_page_count >= 2:
                        logger.info("디노단 %s: 연속 빈 페이지로 크롤링 종료 (page %d)", category_name, page)
                        break
                    continue
                else:
                    empty_page_count = 0

                logger.info("디노단 %s 페이지 %d에서 %d개 캠페인 발견", category_name, page, len(cards))

                for card in cards:
                    campaign = _parse_campaign_element(card, category_id)
                    if campaign and campaign.url not in seen_urls:
                        seen_urls.add(campaign.url)
                        campaigns.append(campaign)

            except Exception as e:
                logger.error("디노단 %s 페이지 %d 크롤링 중 오류: %s", category_name, page, e)
                empty_page_count += 1
                if empty_page_count >= 2:
                    break

    logger.info("디노단 총 %d개 캠페인 수집", len(campaigns))
    return campaigns

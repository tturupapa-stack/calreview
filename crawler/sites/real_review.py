"""리얼리뷰 크롤러"""

import re
from datetime import datetime, timedelta
from typing import List
import requests
from bs4 import BeautifulSoup

from crawler.models import Campaign
from crawler.utils import clean_text, logger
from crawler.category import normalize_category

BASE_URL = "https://www.real-review.kr"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
}


def _parse_campaign_element(card) -> Campaign | None:
    """리얼리뷰 캠페인 카드 한 개를 Campaign으로 변환."""
    try:
        # 제목과 링크 찾기 - _o-title 클래스
        title_el = card.select_one("a._o-title")
        if not title_el:
            return None

        raw_title = clean_text(title_el.get_text())
        if not raw_title:
            return None

        href = title_el.get("href", "")
        if href.startswith("/"):
            url = BASE_URL + href
        elif href.startswith("http"):
            url = href
        else:
            url = BASE_URL + "/" + href

        # 모집 상태 확인 - close면 건너뛰기
        status_el = card.select_one("._o-recruitment-status")
        if status_el:
            status = status_el.get("data-status", "")
            if status == "close":
                return None

        # 지역 추출 (제목에서 [지역] 패턴)
        location = None
        bracket_matches = re.findall(r"\[([^\]]+)\]", raw_title)
        location_keywords = ["전국", "서울", "강남", "강서", "강북", "강동", "송파", "마포", "종로",
                           "부산", "대구", "인천", "광주", "대전", "울산", "세종",
                           "경기", "수원", "성남", "용인", "고양", "안양", "일산", "분당", "김포", "평택",
                           "병점", "부천", "역곡", "발산",
                           "전북", "전주", "충북", "청주", "충남", "천안",
                           "경북", "포항", "경남", "창원", "강원", "춘천", "제주"]

        # 채널 키워드 (제목에서 제거할 대괄호)
        channel_bracket_keywords = ["릴스", "리워드", "클립", "인스타", "유튜브", "쇼츠", "틱톡", "블로그"]

        # 제거할 대괄호 패턴 찾기 (지역 또는 채널 키워드가 포함된 경우만)
        # 단, 점포명 패턴("XX점", "XX호점" 등)이 있으면 제거하지 않음
        brackets_to_remove = []
        if bracket_matches:
            for match in bracket_matches:
                # 점포명 패턴 체크 - 점포명이 있으면 제거 대상에서 제외
                is_store_name = bool(re.search(r"점\]?$|호점\]?$|지점\]?$|본점\]?$|매장\]?$", match))

                if is_store_name:
                    # 점포명이 포함된 경우, 지역 정보만 추출하고 대괄호는 유지
                    for keyword in location_keywords:
                        if keyword in match:
                            location = keyword
                            break
                    continue  # 대괄호 제거 대상에 추가하지 않음

                # 지역 키워드 확인 (점포명이 아닌 경우에만 제거)
                if any(keyword in match for keyword in location_keywords):
                    location = match
                    brackets_to_remove.append(match)
                # 채널 키워드 확인
                elif any(keyword in match.lower() for keyword in channel_bracket_keywords):
                    brackets_to_remove.append(match)

        # 제목에서 지역/채널 대괄호만 제거 (식당 이름 등은 유지)
        title = raw_title
        for bracket in brackets_to_remove:
            title = title.replace(f"[{bracket}]", "").strip()
        title = re.sub(r"\s+", " ", title).strip()  # 중복 공백 제거
        if not title:
            title = raw_title

        # 채널 추출
        channel = "블로그"
        channel_keywords = {
            "릴스": "릴스",
            "리워드": "리워드",
            "클립": "클립",
            "인스타": "인스타그램",
            "유튜브": "유튜브",
            "쇼츠": "쇼츠",
            "틱톡": "틱톡",
        }
        for keyword, ch in channel_keywords.items():
            if keyword in raw_title.lower():
                channel = ch
                break

        # 유형 추출 (방문/배송)
        campaign_type = "visit"  # 기본값
        type_el = card.select_one("._o-label--shipping")
        if type_el:
            campaign_type = "delivery"

        # 카테고리 추출
        raw_category = ""
        # 제목에서 카테고리 힌트 찾기
        category_hints = {
            "피부": "뷰티",
            "에스테틱": "뷰티",
            "뷰티": "뷰티",
            "눈썹": "뷰티",
            "화장품": "뷰티",
            "세럼": "뷰티",
            "바디": "뷰티",
            "상담": "기타",
            "심리": "기타",
            "도서": "도서",
            "맛집": "맛집",
            "카페": "카페",
            "음식": "맛집",
            "숙박": "숙박",
            "호텔": "숙박",
            "펜션": "숙박",
        }
        for hint, cat in category_hints.items():
            if hint in raw_title:
                raw_category = cat
                break

        # 카테고리 정규화
        normalized_category = normalize_category("real_review", raw_category, title)

        # 이미지 찾기
        img_el = card.select_one("._o-featured-image img")
        if not img_el:
            img_el = card.select_one("img")

        image_url = None
        if img_el:
            src = img_el.get("src") or img_el.get("data-src")
            if src:
                if src.startswith("//"):
                    image_url = "https:" + src
                elif src.startswith("/"):
                    image_url = BASE_URL + src
                elif src.startswith("http"):
                    image_url = src

        # 마감일 - 상태에서 추정 (today면 오늘, last면 며칠 남음)
        deadline = None
        if status_el:
            status = status_el.get("data-status", "")
            if status == "today":
                deadline = datetime.now().strftime("%Y-%m-%d")
            elif status == "last":
                # 마감 임박 = 약 2-3일 남음으로 추정
                deadline = (datetime.now() + timedelta(days=2)).strftime("%Y-%m-%d")
            elif status == "open":
                # 진행중 = 약 7일 남음으로 추정
                deadline = (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d")

        return Campaign(
            title=title,
            url=url,
            site_name="real_review",
            category=normalized_category,
            deadline=deadline,
            location=location,
            image_url=image_url,
            channel=channel,
            type=campaign_type,
            review_deadline_days=7,  # 리얼리뷰 기본 리뷰 기간
        )
    except Exception as e:
        logger.error("리얼리뷰 캠페인 파싱 중 오류: %s", e)
        return None


def crawl(max_pages: int = 10) -> List[Campaign]:
    """리얼리뷰 크롤링 로직."""
    logger.info("리얼리뷰 크롤링 시작")
    campaigns: List[Campaign] = []
    seen_urls = set()
    empty_page_count = 0

    for page in range(1, max_pages + 1):
        try:
            url = f"{BASE_URL}/explore/"
            params = {"page": page}
            res = requests.get(url, params=params, headers=HEADERS, timeout=15)
            res.raise_for_status()

            soup = BeautifulSoup(res.text, "html.parser")

            # c1fdo41gas3no 클래스가 project card의 CSS 클래스
            # 실제 카드는 해당 클래스를 포함하는 요소 또는 _l-card-body를 포함하는 부모 찾기
            cards = soup.select("[class*='c1fdo41gas3no']")

            if not cards:
                # 대안: _o-title을 포함하는 부모 요소 찾기
                title_elements = soup.select("a._o-title")
                cards = []
                for title_el in title_elements:
                    # 부모를 거슬러 올라가며 카드 찾기
                    parent = title_el.parent
                    for _ in range(5):  # 최대 5단계까지 올라감
                        if parent and parent.name == 'div':
                            cards.append(parent)
                            break
                        parent = parent.parent if parent else None

            if not cards:
                empty_page_count += 1
                if empty_page_count >= 2:
                    logger.info("리얼리뷰: 연속 빈 페이지로 크롤링 종료 (page %d)", page)
                    break
                continue
            else:
                empty_page_count = 0

            logger.info("리얼리뷰 페이지 %d에서 %d개 카드 발견", page, len(cards))

            for card in cards:
                campaign = _parse_campaign_element(card)
                if campaign and campaign.url not in seen_urls:
                    seen_urls.add(campaign.url)
                    campaigns.append(campaign)

        except Exception as e:
            logger.error("리얼리뷰 페이지 %d 크롤링 중 오류: %s", page, e)
            empty_page_count += 1
            if empty_page_count >= 2:
                break

    logger.info("리얼리뷰 총 %d개 캠페인 수집", len(campaigns))
    return campaigns

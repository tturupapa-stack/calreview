"""모두의체험단 크롤러"""

import re
from datetime import datetime, timedelta
from typing import List
import requests
from bs4 import BeautifulSoup

from crawler.models import Campaign
from crawler.utils import clean_text, logger

BASE_URL = "https://www.modan.kr"

# modan 카테고리 경로 → 표준 카테고리 매핑
MODAN_CATEGORY_MAP = {
    "맛집": "맛집",
    "뷰티": "뷰티",
    "제품": None,  # 제품은 제목 키워드로 세부 분류 필요
}

def _classify_product_category(title: str) -> str:
    """modan 제품 카테고리 세부 분류 (키워드 기반)."""
    title_lower = title.lower()

    # 식품 키워드
    food_keywords = ["밀키트", "음료", "간식", "식품", "영양제", "비타민", "홍삼", "건강식품",
                    "젤리", "과자", "초콜릿", "커피", "차", "음식", "떡", "김치", "반찬"]
    if any(k in title_lower for k in food_keywords):
        return "식품"

    # 뷰티/화장품 키워드
    beauty_keywords = ["화장품", "스킨", "로션", "세럼", "마스크팩", "클렌저", "샴푸",
                      "바디", "헤어", "립스틱", "파운데이션", "썬크림", "향수"]
    if any(k in title_lower for k in beauty_keywords):
        return "뷰티"

    # 디지털/가전 키워드
    digital_keywords = ["전자", "디지털", "가전", "이어폰", "충전기", "케이블", "usb",
                       "배터리", "보조배터리", "정수기", "청소기", "공기청정", "가습기"]
    if any(k in title_lower for k in digital_keywords):
        return "디지털"

    # 유아동 키워드
    baby_keywords = ["아기", "유아", "육아", "기저귀", "젖병", "장난감", "어린이"]
    if any(k in title_lower for k in baby_keywords):
        return "유아동"

    # 반려동물 키워드
    pet_keywords = ["강아지", "고양이", "펫", "사료", "간식", "반려"]
    if any(k in title_lower for k in pet_keywords):
        return "반려동물"

    # 패션 키워드
    fashion_keywords = ["의류", "옷", "신발", "가방", "악세사리", "양말", "모자"]
    if any(k in title_lower for k in fashion_keywords):
        return "패션"

    # 생활 키워드
    life_keywords = ["주방", "욕실", "청소", "수납", "인테리어", "가구", "침구", "이불"]
    if any(k in title_lower for k in life_keywords):
        return "생활"

    # 기본값: 배송 (일반 제품)
    return "배송"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
}


def _parse_campaign_element(card, category_name: str) -> Campaign | None:
    """모두의체험단 캠페인 카드 한 개를 Campaign으로 변환."""
    try:
        # data-product-properties에서 JSON 데이터 추출
        import json
        props_str = card.get("data-product-properties", "{}")
        try:
            props = json.loads(props_str)
        except:
            props = {}

        # 링크 찾기
        link_el = card.select_one("a.shop-item-thumb, a[href]")
        if not link_el:
            return None

        href = link_el.get("href", "")
        if href.startswith("/"):
            url = BASE_URL + href
        elif href.startswith("http"):
            url = href
        else:
            url = BASE_URL + "/" + href

        # 제목: JSON에서 또는 HTML에서 추출
        raw_title = props.get("name", "")
        if not raw_title:
            title_el = card.select_one("h2, .shop-title, .item-summary")
            if title_el:
                raw_title = clean_text(title_el.get_text())
        if not raw_title:
            return None

        # 지역 및 채널 추출
        location = None
        channel = "블로그"
        bracket_matches = re.findall(r"\[([^\]]+)\]", raw_title)
        location_keywords = ["전국", "서울", "강남", "부산", "대구", "인천", "광주", "대전", "울산",
                           "경기", "수원", "성남", "용인", "고양", "전북", "전주", "충북", "청주",
                           "경북", "포항", "경남", "창원", "강원", "춘천", "제주"]
        channel_keywords = ["릴스", "리워드", "클립", "블로그", "인스타", "유튜브", "쇼츠", "틱톡"]

        if bracket_matches:
            for match in bracket_matches:
                match_lower = match.lower()
                if any(keyword in match for keyword in location_keywords):
                    location = match
                elif any(keyword in match_lower for keyword in channel_keywords):
                    channel = match

        # 제목에서 플랫폼 태그만 제거 (지역은 유지)
        title = raw_title
        for kw in channel_keywords:
            title = re.sub(rf"\[{kw}[^\]]*\]", "", title, flags=re.IGNORECASE)
        title = re.sub(r"\s+", " ", title).strip()

        # 이미지: JSON에서 또는 HTML에서 추출
        image_url = props.get("image_url", "")
        if not image_url:
            img_el = card.select_one("img._org_img, img")
            if img_el:
                image_url = img_el.get("src") or img_el.get("data-src") or img_el.get("data-original")

        if image_url:
            if image_url.startswith("//"):
                image_url = "https:" + image_url
            elif image_url.startswith("/"):
                image_url = BASE_URL + image_url

        # 카테고리 결정: modan 카테고리 경로 기반
        if category_name in MODAN_CATEGORY_MAP:
            normalized_category = MODAN_CATEGORY_MAP[category_name]
            # "제품" 카테고리는 제목 키워드로 세부 분류
            if normalized_category is None:
                normalized_category = _classify_product_category(title)
        else:
            # 알 수 없는 카테고리는 제목 키워드로 분류
            normalized_category = _classify_product_category(title)

        # modan은 마감일 정보를 제공하지 않으므로 기본값으로 30일 후 설정
        default_deadline = (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d")

        return Campaign(
            title=title,
            url=url,
            site_name="modan",
            category=normalized_category,
            deadline=default_deadline,  # 기본 30일 후
            location=location,
            image_url=image_url,
            channel=channel,
            review_deadline_days=7,  # modan 정책: 체험 후 7일 이내 리뷰 등록
        )
    except Exception as e:
        logger.error("모두의체험단 캠페인 파싱 중 오류: %s", e)
        return None


def crawl(max_pages: int = 20, max_total: int = 200) -> List[Campaign]:
    """모두의체험단 크롤링 로직.

    Args:
        max_pages: 카테고리별 최대 페이지 수
        max_total: 전체 최대 수집 캠페인 수 (기본 200개)
    """
    logger.info("모두의체험단 크롤링 시작 (최대 %d개)", max_total)
    campaigns: List[Campaign] = []
    empty_page_count = 0

    # 카테고리별 크롤링
    categories = [
        ("/matzip/", "맛집"),
        ("/beauty/", "뷰티"),
        ("/product/", "제품"),
    ]

    for category_path, category_name in categories:
        if len(campaigns) >= max_total:
            break

        for page in range(1, max_pages + 1):
            if len(campaigns) >= max_total:
                break

            try:
                url = f"{BASE_URL}{category_path}?page={page}"
                res = requests.get(url, headers=HEADERS, timeout=10)
                res.raise_for_status()

                soup = BeautifulSoup(res.text, "html.parser")
                cards = soup.select(".shop-item")

                if not cards:
                    empty_page_count += 1
                    if empty_page_count >= 2:
                        break
                    continue
                else:
                    empty_page_count = 0

                logger.info("모두의체험단 %s 페이지 %d에서 %d개 카드 발견", category_name, page, len(cards))

                for card in cards:
                    if len(campaigns) >= max_total:
                        break
                    campaign = _parse_campaign_element(card, category_name)
                    if campaign:
                        campaigns.append(campaign)

            except Exception as e:
                logger.error("모두의체험단 %s 페이지 %d 크롤링 중 오류: %s", category_name, page, e)
                empty_page_count += 1
                if empty_page_count >= 2:
                    break

    logger.info("모두의체험단 총 %d개 캠페인 수집", len(campaigns))
    return campaigns

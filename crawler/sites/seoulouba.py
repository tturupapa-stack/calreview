"""서울오빠 크롤러"""

import re
from typing import List
import requests
from bs4 import BeautifulSoup

from crawler.models import Campaign
from crawler.utils import clean_text, logger
from crawler.utils_detail import extract_review_deadline_days

BASE_URL = "https://www.seoulouba.co.kr"
LIST_PATH = "/campaign/?qq=popular"

def _parse_card(card) -> Campaign | None:
    """카드 하나를 파싱하여 Campaign 객체 반환."""
    try:
        # 링크 - a.tum_img 또는 a href
        link_el = card.select_one("a")
        if not link_el:
            return None
        
        href = link_el.get("href", "")
        url = href if href.startswith("http") else BASE_URL + href
        
        # 제목 - .s_campaign_title
        title_el = card.select_one(".s_campaign_title, strong.s_campaign_title")
        if not title_el:
            return None
        title = clean_text(title_el.get_text())
        
        # 이미지 - .tum_img img
        img_el = card.select_one(".tum_img img, img")
        image_url = None
        if img_el:
            src = img_el.get("src", "")
            if src.startswith("//"):
                image_url = "https:" + src
            elif src.startswith("/"):
                image_url = BASE_URL + src
            elif src.startswith("http"):
                image_url = src
        
        # 마감일 - .d_day span
        deadline_el = card.select_one(".d_day span, .d_day")
        deadline = clean_text(deadline_el.get_text()) if deadline_el else None
        
        # 마감된 체험단 제외
        if deadline:
            deadline_lower = deadline.lower()
            if any(keyword in deadline_lower for keyword in ["마감", "종료", "closed"]):
                logger.debug("서울오빠 캠페인: 마감됨 (%s), 스킵", deadline)
                return None
            if re.search(r"D\s*\+\s*\d+", deadline, re.IGNORECASE):
                logger.debug("서울오빠 캠페인: 마감 지남 (%s), 스킵", deadline)
                return None
        
        # 타입/카테고리 - .icon_tag span
        type_el = card.select_one(".icon_tag span")
        category = clean_text(type_el.get_text()) if type_el else None
        
        # 지역 - 제목에서 추출
        location = None
        if title:
            # [가평], [서울 강남] 같은 패턴
            location_match = re.search(r"\[([^\]]+)\]", title)
            if location_match:
                location = location_match.group(1)
                # 제목에서 지역 부분 제거
                title = re.sub(r"\[[^\]]+\]\s*", "", title).strip()
        
        # 채널 - .ltop_icon img alt
        channel_el = card.select_one(".ltop_icon .icon_box img")
        channel = None
        if channel_el:
            alt = channel_el.get("alt", "")
            # "네이버블로그" -> "블로그"로 변환
            if "블로그" in alt:
                channel = "블로그"
            elif "인스타" in alt:
                channel = "인스타"
            elif "유튜브" in alt:
                channel = "유튜브"
            else:
                channel = alt
        
        # 리뷰 기간 추출 (상세 페이지 크롤링)
        review_deadline_days = extract_review_deadline_days(url, "seoulouba")
        
        return Campaign(
            title=title,
            url=url,
            site_name="seoulouba",
            category=category,
            deadline=deadline,
            location=location,
            image_url=image_url,
            channel=channel,
            review_deadline_days=review_deadline_days,
        )
    
    except Exception as e:
        logger.error("서울오빠 카드 파싱 오류: %s", e)
        return None


def crawl() -> List[Campaign]:
    """서울오빠 크롤링."""
    logger.info("서울오빠 크롤링 시작")
    
    campaigns: List[Campaign] = []
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/120.0.0.0 Safari/537.36"
        )
    }
    
    try:
        url = BASE_URL + LIST_PATH
        res = requests.get(url, headers=headers, timeout=10)
        res.raise_for_status()
        
        soup = BeautifulSoup(res.text, "html.parser")
        
        # 카드 선택자 - .campaign_content
        cards = soup.select(".campaign_content")
        
        logger.info("서울오빠 %s 에서 %d개 카드 발견", url, len(cards))
        
        for card in cards:
            campaign = _parse_card(card)
            if campaign:
                campaigns.append(campaign)
        
        logger.info("서울오빠 총 %d개 캠페인 수집", len(campaigns))
    
    except Exception as e:
        logger.error("서울오빠 크롤링 중 오류: %s", e)
    
    logger.info("서울오빠 크롤링 완료")
    return campaigns


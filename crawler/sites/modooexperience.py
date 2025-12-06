"""모두의체험단 크롤러"""

import re
from typing import List
import requests
from bs4 import BeautifulSoup

from crawler.models import Campaign
from crawler.utils import clean_text, logger
from crawler.utils_detail import extract_review_deadline_days

BASE_URL = "https://xn--6j1br0ag3lba435lvsj96p.com"
LIST_PATH = "/"

def _parse_card(card) -> Campaign | None:
    """카드 하나를 파싱하여 Campaign 객체 반환."""
    try:
        # 링크 - a[href*="campaign.php"]
        link_el = card.select_one('a[href*="campaign.php"]')
        if not link_el:
            return None
        
        href = link_el.get("href", "")
        url = BASE_URL + "/" + href if not href.startswith("http") else href
        
        # 제목 - .it_name
        title_el = card.select_one(".it_name")
        if not title_el:
            return None
        title = clean_text(title_el.get_text())
        
        # 이미지 - .it_img
        img_el = card.select_one(".it_img, img")
        image_url = None
        if img_el:
            src = img_el.get("src", "")
            if src.startswith("//"):
                image_url = "https:" + src
            elif src.startswith("./"):
                image_url = BASE_URL + "/" + src[2:]
            elif src.startswith("/"):
                image_url = BASE_URL + src
            elif src.startswith("http"):
                image_url = src
        
        # 마감일 - .dday
        deadline_el = card.select_one(".dday")
        deadline = None
        if deadline_el:
            dday_text = clean_text(deadline_el.get_text())
            # "D-Day 18" -> "D-18"로 변환
            match = re.search(r"D-Day\s*(\d+)", dday_text, re.IGNORECASE)
            if match:
                deadline = f"D-{match.group(1)}"
            else:
                deadline = dday_text
        
        # 마감된 체험단 제외
        if deadline:
            deadline_lower = deadline.lower()
            if any(keyword in deadline_lower for keyword in ["마감", "종료", "closed"]):
                logger.debug("모두의체험단 캠페인: 마감됨 (%s), 스킵", deadline)
                return None
            if re.search(r"D\s*\+\s*\d+", deadline, re.IGNORECASE):
                logger.debug("모두의체험단 캠페인: 마감 지남 (%s), 스킵", deadline)
                return None
        
        # 카테고리 - .shop 또는 .top_info span
        category_el = card.select_one(".shop, .top_info span")
        category = clean_text(category_el.get_text()) if category_el else None
        
        # 타입 - .option2에서 "배송형", "방문형" 찾기
        type_text = None
        option2_spans = card.select(".option2 span")
        for span in option2_spans:
            text = clean_text(span.get_text())
            if text in ["배송형", "방문형", "기자단"]:
                type_text = text
                break
        
        # 지역 - 제목에서 추출
        location = None
        if title:
            location_match = re.search(r"\[([^\]]+)\]", title)
            if location_match:
                location = location_match.group(1)
        
        # 채널 - 기본값 "블로그"
        channel = "블로그"
        
        # 리뷰 기간 추출 (상세 페이지 크롤링)
        review_deadline_days = extract_review_deadline_days(url, "modooexperience")
        
        return Campaign(
            title=title,
            url=url,
            site_name="modooexperience",
            category=category,
            deadline=deadline,
            location=location,
            image_url=image_url,
            channel=channel,
            review_deadline_days=review_deadline_days,
        )
    
    except Exception as e:
        logger.error("모두의체험단 카드 파싱 오류: %s", e)
        return None


def crawl() -> List[Campaign]:
    """모두의체험단 크롤링."""
    logger.info("모두의체험단 크롤링 시작")
    
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
        
        # 카드 선택자 - .box
        cards = soup.select(".box")
        
        logger.info("모두의체험단 %s 에서 %d개 카드 발견", url, len(cards))
        
        for card in cards:
            campaign = _parse_card(card)
            if campaign:
                campaigns.append(campaign)
        
        logger.info("모두의체험단 총 %d개 캠페인 수집", len(campaigns))
    
    except Exception as e:
        logger.error("모두의체험단 크롤링 중 오류: %s", e)
    
    logger.info("모두의체험단 크롤링 완료")
    return campaigns


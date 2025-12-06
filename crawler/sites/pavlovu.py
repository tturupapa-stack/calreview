"""파블로 크롤러"""

import re
from typing import List
import requests
from bs4 import BeautifulSoup

from crawler.models import Campaign
from crawler.utils import clean_text, logger
from crawler.utils_detail import extract_review_deadline_days

BASE_URL = "https://pavlovu.com"
LIST_PATH = "/review_campaign_list.php"

def _parse_card(card) -> Campaign | None:
    """카드 하나를 파싱하여 Campaign 객체 반환."""
    try:
        # 링크 - a[href*="review_campaign.php"]
        link_el = card.select_one('a[href*="review_campaign.php"]')
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
            # "3일 남음" -> "D-3"로 변환
            match = re.search(r"(\d+)일\s*남음", dday_text)
            if match:
                deadline = f"D-{match.group(1)}"
            else:
                deadline = dday_text
        
        # 마감된 체험단 제외
        if deadline:
            deadline_lower = deadline.lower()
            if any(keyword in deadline_lower for keyword in ["마감", "종료", "closed"]):
                logger.debug("파블로 캠페인: 마감됨 (%s), 스킵", deadline)
                return None
            if re.search(r"D\s*\+\s*\d+", deadline, re.IGNORECASE):
                logger.debug("파블로 캠페인: 마감 지남 (%s), 스킵", deadline)
                return None
        
        # 채널 - .sns
        channel_el = card.select_one(".sns")
        channel = clean_text(channel_el.get_text()) if channel_el else "블로그"
        
        # 타입 - .option2 span
        type_el = card.select_one(".option2 span")
        type_text = clean_text(type_el.get_text()) if type_el else None
        
        # 지역 - 제목에서 추출
        location = None
        if title:
            # [울산/사주] 형태
            location_match = re.search(r"\[([^\]]+)\]", title)
            if location_match:
                location_parts = location_match.group(1).split("/")
                location = location_parts[0].strip()  # 첫 번째 부분만 (울산)
                # 제목에서 지역 부분 제거
                title = re.sub(r"\[[^\]]+\]\s*", "", title).strip()
        
        # 카테고리는 타입으로 사용
        category = type_text
        
        # 리뷰 기간 추출 (상세 페이지 크롤링)
        review_deadline_days = extract_review_deadline_days(url, "pavlovu")
        
        return Campaign(
            title=title,
            url=url,
            site_name="pavlovu",
            category=category,
            deadline=deadline,
            location=location,
            image_url=image_url,
            channel=channel,
            review_deadline_days=review_deadline_days,
        )
    
    except Exception as e:
        logger.error("파블로 카드 파싱 오류: %s", e)
        return None


def crawl() -> List[Campaign]:
    """파블로 크롤링."""
    logger.info("파블로 크롤링 시작")
    
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
        
        logger.info("파블로 %s 에서 %d개 카드 발견", url, len(cards))
        
        for card in cards:
            campaign = _parse_card(card)
            if campaign:
                campaigns.append(campaign)
        
        logger.info("파블로 총 %d개 캠페인 수집", len(campaigns))
    
    except Exception as e:
        logger.error("파블로 크롤링 중 오류: %s", e)
    
    logger.info("파블로 크롤링 완료")
    return campaigns


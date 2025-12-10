"""서울오빠 크롤러"""

import re
import concurrent.futures
from typing import List, Tuple
import requests
from bs4 import BeautifulSoup

from crawler.models import Campaign
from crawler.utils import clean_text, logger
from crawler.category import normalize_category

BASE_URL = "https://www.seoulouba.co.kr"

# 카테고리 ID 매핑 (ID -> (Type, Raw Category))
CATEGORY_MAP = {
    # 방문형 (Visit)
    378: ("visit", "맛집"),
    379: ("visit", "여행"),
    380: ("visit", "뷰티"),  # 뷰티/패션
    381: ("visit", "생활"),  # 문화/생활
    # 배송형 (Delivery)
    384: ("delivery", "식품"),
    385: ("delivery", "뷰티"),
    386: ("delivery", "디지털"),
    387: ("delivery", "패션"),
    388: ("delivery", "생활"),
    389: ("delivery", "유아동"),
    390: ("delivery", "도서"),
    391: ("delivery", "반려동물"),
}


def _parse_card(card, fixed_type: str, fixed_category: str) -> Campaign | None:
    """카드 하나를 파싱하여 Campaign 객체 반환."""
    try:
        # 링크
        link_el = card.select_one("a")
        if not link_el:
            return None
        
        href = link_el.get("href", "")
        url = href if href.startswith("http") else BASE_URL + href
        
        # 제목
        title_el = card.select_one(".s_campaign_title, strong.s_campaign_title")
        if not title_el:
            return None
        title = clean_text(title_el.get_text())
        
        # 이미지
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
        
        # 마감일
        deadline_el = card.select_one(".d_day span, .d_day")
        deadline = clean_text(deadline_el.get_text()) if deadline_el else None
        
        # 마감된 체험단 제외
        if deadline:
            deadline_lower = deadline.lower()
            if any(keyword in deadline_lower for keyword in ["마감", "종료", "closed"]):
                return None
            if re.search(r"D\s*\+\s*\d+", deadline, re.IGNORECASE):
                return None
        
        # 지역 추출 (방문형인 경우)
        location = None
        if fixed_type == "visit":
            location_match = re.search(r"^\s*\[([^\]]+)\]", title)
            if location_match:
                location = location_match.group(1)
                title = re.sub(r"^\s*\[[^\]]+\]\s*", "", title).strip()
        elif fixed_type == "delivery":
            location = "배송"

        # 채널
        channel_el = card.select_one(".ltop_icon .icon_box img")
        channel = None
        if channel_el:
            alt = channel_el.get("alt", "")
            if "블로그" in alt: channel = "블로그"
            elif "인스타" in alt: channel = "인스타"
            elif "유튜브" in alt: channel = "유튜브"
            else: channel = alt
        
        # 카테고리 정규화
        # URL에서 가져온 고정 카테고리를 바탕으로, 제목 키워드 등을 고려해 최종 정규화
        final_category = normalize_category("seoulouba", fixed_category, title)

        return Campaign(
            title=title,
            url=url,
            site_name="seoulouba",
            category=final_category,
            deadline=deadline,
            location=location,
            image_url=image_url,
            channel=channel,
            type=fixed_type,
            review_deadline_days=None,  # 목록에서는 알 수 없음 (속도 위해 포기)
        )
    
    except Exception as e:
        logger.error("서울오빠 카드 파싱 오류: %s", e)
        return None


def _crawl_category(cat_id: int, c_type: str, c_cat: str, max_pages: int = 3) -> List[Campaign]:
    """특정 카테고리 페이지 크롤링"""
    campaigns = []
    
    for page in range(1, max_pages + 1):
        url = f"{BASE_URL}/campaign/?cat={cat_id}&page={page}"
        
        try:
            res = requests.get(url, headers={
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            }, timeout=10)
            res.raise_for_status()
            
            soup = BeautifulSoup(res.text, "html.parser")
            cards = soup.select(".campaign_content")
            
            if not cards:
                logger.debug(f"[서울오빠] {c_cat} Page:{page} - 게시물 없음")
                break
                
            logger.info(f"[서울오빠] {c_cat} ({c_type}) Page:{page} - {len(cards)}개 발견")
            
            # 순차 파싱 (이미지/텍스트 파싱만 하므로 매우 빠름)
            for card in cards:
                c = _parse_card(card, c_type, c_cat)
                if c:
                    campaigns.append(c)
        
        except Exception as e:
            logger.error(f"[서울오빠] 카테고리 {cat_id} Page {page} 크롤링 실패: {e}")
            break
            
    return campaigns


def crawl() -> List[Campaign]:
    """서울오빠 크롤링 (카테고리별 수집)"""
    logger.info("서울오빠 크롤링 시작 (카테고리 기반)")
    
    all_campaigns: List[Campaign] = []
    
    # 카테고리별 병렬 요청
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
        future_to_cat = {
            executor.submit(_crawl_category, cid, ctype, ccat): (cid, ctype, ccat)
            for cid, (ctype, ccat) in CATEGORY_MAP.items()
        }
        
        for future in concurrent.futures.as_completed(future_to_cat):
            try:
                campaigns = future.result()
                all_campaigns.extend(campaigns)
            except Exception as e:
                logger.error(f"카테고리 작업 실패: {e}")

    logger.info("서울오빠 크롤링 완료 - 총 %d개 수집", len(all_campaigns))
    return all_campaigns

"""강남맛집 크롤러 (카테고리 기반)"""

import re
import concurrent.futures
from typing import List, Tuple
import requests
from bs4 import BeautifulSoup

from crawler.models import Campaign
from crawler.utils import clean_text, logger
from crawler.category import normalize_category

BASE_URL = "https://xn--939au0g4vj8sq.net"

# 카테고리 ID 매핑 (ID -> (Type, Raw Category))
CATEGORY_MAP = {
    # 방문형 (Visit)
    2005: ("visit", "맛집"),
    2010: ("visit", "뷰티"),
    2015: ("visit", "여행"), # 숙박
    2020: ("visit", "문화"),
    2025: ("delivery", "식품"), # 배달 -> 배송형 식품으로 간주
    2030: ("visit", "맛집"),   # 포장 -> 방문형 맛집
    2035: ("visit", "기타"),   # 기타 방문

    # 배송/제품형 (Delivery)
    3005: ("delivery", "뷰티"),
    3010: ("delivery", "패션"),
    3015: ("delivery", "식품"),
    3020: ("delivery", "생활"),
    3030: ("delivery", "기타"), # 기타 제품 (디지털 등 포함될 수 있음)

    # 기자단
    40: ("reporter", "기자단"),
}


def _parse_card(card, fixed_type: str, fixed_category: str) -> Campaign | None:
    """강남맛집 캠페인 카드 한 개를 Campaign으로 변환."""
    try:
        # 상세 페이지 링크 & 이미지
        # 구조: div.imgArea > a > img
        link_el = card.select_one("div.imgArea a[href]")
        if not link_el:
            return None

        href = link_el.get("href") or ""
        if href.startswith("/"):
            url = BASE_URL + href
        else:
            url = href or BASE_URL

        img_el = card.select_one("div.imgArea img.thumb_img")
        image_url = None
        if img_el:
            src = img_el.get("src")
            if src:
                if src.startswith("//"):
                    image_url = "https:" + src
                elif src.startswith("/"):
                    image_url = BASE_URL + src
                else:
                    image_url = src

        # 제목
        title_el = card.select_one("dt.tit a")
        if not title_el:
            return None
        raw_title = clean_text(title_el.get_text())
        title = raw_title

        # 지역 및 채널 추출 (제목 파싱)
        location = None
        channel = None
        channel_mapping = {
            "블로그": "블로그",
            "인스타": "인스타", 
            "릴스": "릴스", 
            "유튜브": "유튜브", 
            "쇼츠": "쇼츠",
            "틱톡": "틱톡",
            "클립": "클립",
            "clip": "클립"
        }
        
        # [지역], [채널] 등의 대괄호 파싱
        bracket_matches = re.findall(r"\[([^\]]+)\]", raw_title)
        
        found_channels = []
        possible_location = None
        
        for b_text in bracket_matches:
            b_lower = b_text.lower()
            is_channel = False
            for k, v in channel_mapping.items():
                if k in b_lower:
                    if v not in found_channels:
                        found_channels.append(v)
                    is_channel = True
            
            if not is_channel and not possible_location:
                possible_location = b_text
        
        if found_channels:
            channel = "/".join(found_channels)
        else:
            # HTML 태그 백업 확인 (em.blog 등)
            blog_el = card.select_one("em.blog")
            if blog_el and "blog" in blog_el.get_text().lower():
                channel = "블로그"
        
        if fixed_type == "visit":
            location = possible_location
            # 제목에서 대괄호 제거하여 깔끔하게
            title = re.sub(r"\[[^\]]+\]\s*", "", raw_title).strip()
        elif fixed_type == "delivery":
            location = "배송"
            title = re.sub(r"\[[^\]]+\]\s*", "", raw_title).strip()
        
        # 마감일
        deadline_el = card.select_one("span.dday em.day_c")
        deadline_raw = clean_text(deadline_el.get_text()) if deadline_el else None
        deadline = None
        
        if deadline_raw:
            deadline_lower = deadline_raw.lower()
            if any(k in deadline_lower for k in ["마감완료", "종료", "closed"]):
                return None
            
            # "6일 남음" -> "D-6"
            match = re.search(r"(\d+)일\s*남음", deadline_raw)
            if match:
                deadline = f"D-{match.group(1)}"
            else:
                deadline = deadline_raw

        # 카테고리 정규화
        final_category = normalize_category("gangnam", fixed_category, title)

        return Campaign(
            title=title,
            url=url,
            site_name="gangnam",
            category=final_category,
            deadline=deadline,
            location=location,
            image_url=image_url,
            channel=channel,
            type=fixed_type,
            review_deadline_days=None, # 리스트에서는 알 수 없음
        )

    except Exception as e:
        logger.error("강남맛집 파싱 오류: %s", e)
        return None


def _crawl_category(cat_id: int, c_type: str, c_cat: str) -> List[Campaign]:
    """특정 카테고리 ID 크롤링"""
    # 강남맛집은 ?ca=ID 파라미터 사용
    url = f"{BASE_URL}/cp/?ca={cat_id}"
    campaigns = []
    
    try:
        res = requests.get(url, headers={
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }, timeout=10)
        res.raise_for_status()
        
        soup = BeautifulSoup(res.text, "html.parser")
        # 리스트 아이템 선택자
        cards = soup.select("li.list_item")
        
        logger.info("[강남맛집] %s (%s) - %d개 발견", c_cat, c_type, len(cards))
        
        for card in cards:
            c = _parse_card(card, c_type, c_cat)
            if c:
                campaigns.append(c)
                
    except Exception as e:
        logger.error(f"[강남맛집] 카테고리 {cat_id} 크롤링 실패: {e}")
        
    return campaigns


def crawl() -> List[Campaign]:
    """강남맛집 크롤링 (카테고리 기반)"""
    logger.info("강남맛집 크롤링 시작 (카테고리 기반)")
    
    all_campaigns: List[Campaign] = []
    
    # 병렬 처리
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
        futures = []
        for cid, (ctype, ccat) in CATEGORY_MAP.items():
            futures.append(executor.submit(_crawl_category, cid, ctype, ccat))
            
        for future in concurrent.futures.as_completed(futures):
            try:
                campaigns = future.result()
                all_campaigns.extend(campaigns)
            except Exception as e:
                logger.error(f"카테고리 작업 실패: {e}")

    logger.info("강남맛집 크롤링 완료 - 총 %d개 수집", len(all_campaigns))
    return all_campaigns


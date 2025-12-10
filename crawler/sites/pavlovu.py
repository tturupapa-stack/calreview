"""파블로 크롤러 (카테고리 기반)"""

import re
import concurrent.futures
from typing import List, Tuple
import requests
from bs4 import BeautifulSoup

from crawler.models import Campaign
from crawler.utils import clean_text, logger
from crawler.category import normalize_category

BASE_URL = "https://pavlovu.com"

# 카테고리 매핑: category_id -> (Type, Raw Category)
CATEGORY_MAP = {
    # 방문 (Visit) - 002A
    "002A010A": ("visit", "맛집"),
    "002A012A": ("visit", "생활"), # 여가 -> 생활
    "002A020A": ("visit", "뷰티"),
    "002A021A": ("visit", "여행"), # 숙박 -> 여행
    "002A023A": ("visit", "생활"), # 서비스 -> 생활
    "002A022A": ("visit", "생활"), # 운동 -> 생활

    # 배송 (Delivery) - 001A
    "001A004A": ("delivery", "식품"),
    "001A005A": ("delivery", "뷰티"),
    "001A006A": ("delivery", "패션"),
    "001A008A": ("delivery", "생활"),
    "001A027A": ("delivery", "디지털"),
    "001A025A": ("delivery", "생활"), # 서비스 -> 생활
    "001A009A": ("delivery", "반려동물"),
    "001A007A": ("delivery", "유아동"),
    "001A026A": ("delivery", "기타"),
    
    # 기자단
    "003A": ("reporter", "기자단"),
    
    # 출장/방문자 (생략 or 기타로)
    "028A": ("visit", "기타"), 
    "029A": ("visit", "기타"),
}

def _parse_card(card, fixed_type: str, fixed_category: str) -> Campaign | None:
    """파블로 카드 파싱"""
    try:
        # 링크
        link_el = card.select_one('a[href*="review_campaign.php"]')
        if not link_el:
            return None
        href = link_el.get("href", "")
        # href example: review_campaign.php?p_id=...
        url = BASE_URL + "/" + href if not href.startswith("http") else href
        
        # 제목
        title_el = card.select_one(".it_name")
        if not title_el:
            return None
        raw_title = clean_text(title_el.get_text())
        title = raw_title
        
        # 지역 (방문형일 때만)
        location = None
        if fixed_type == "visit":
             match = re.search(r"\[([^\]]+)\]", title)
             if match:
                 # [울산/사주] -> 울산
                 parts = match.group(1).split("/")
                 location = parts[0].strip()
                 # 제목에서 지역 제거
                 title = re.sub(r"\[[^\]]+\]\s*", "", title).strip()
        elif fixed_type == "delivery":
            location = "배송"

        # 채널
        channel_el = card.select_one(".sns")
        channel = clean_text(channel_el.get_text()) if channel_el else "블로그"
        
        # 마감일
        deadline_el = card.select_one(".dday")
        deadline = None
        if deadline_el:
            dt = clean_text(deadline_el.get_text())
            if "마감" in dt or "종료" in dt: return None
            
            # 상시모집 처리
            if "상시" in dt or "상시모집" in dt:
                deadline = "D-365"
            else:
                # "3일 남음" -> "D-3"
                m = re.search(r"(\d+)일\s*남음", dt)
                if m: deadline = f"D-{m.group(1)}"
                else: deadline = dt
            
            if re.search(r"D\s*\+\s*\d+", deadline): return None

        # 이미지 (상세 구현 생략 - 기존 로직 참고)
        img_el = card.select_one(".it_img, img")
        image_url = None
        if img_el:
            src = img_el.get("src", "")
            if src.startswith("//"): image_url = "https:" + src
            elif src.startswith("./"): image_url = BASE_URL + "/" + src[2:]
            elif src.startswith("/"): image_url = BASE_URL + src
            elif src.startswith("http"): image_url = src

        # 정규화
        final_category = normalize_category("pavlovu", fixed_category, title)

        return Campaign(
            title=title,
            url=url,
            site_name="pavlovu",
            category=final_category,
            deadline=deadline,
            location=location,
            image_url=image_url,
            channel=channel,
            type=fixed_type,
            review_deadline_days=None,
        )

    except Exception as e:
        logger.error(f"파블로 파싱 에러: {e}")
        return None

def _crawl_category(cat_id: str, c_type: str, c_cat: str, max_pages: int = 3) -> List[Campaign]:
    campaigns = []
    # url pattern: review_campaign_list.php?category_id=...&page=...
    url = f"{BASE_URL}/review_campaign_list.php"
    
    for page in range(1, max_pages + 1):
        params = {"category_id": cat_id, "page": page}
        
        try:
            res = requests.get(url, params=params, headers={
                 "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            }, timeout=10)
            res.raise_for_status()
            
            soup = BeautifulSoup(res.text, "html.parser")
            cards = soup.select(".box")
            
            if not cards:
                logger.debug(f"[파블로] {c_cat} Page:{page} - 게시물 없음")
                break
            
            logger.info(f"[파블로] {c_cat} ({cat_id}) Page:{page} - {len(cards)}개 발견")
            
            for card in cards:
                c = _parse_card(card, c_type, c_cat)
                if c:
                    campaigns.append(c)
                    
        except Exception as e:
            logger.error(f"[파블로] 요청 실패 ({cat_id}) Page {page}: {e}")
            break
            
    return campaigns

def crawl() -> List[Campaign]:
    logger.info("파블로 크롤링 시작")
    all_campaigns = []
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
        futures = []
        for cat_id, (ctype, ccat) in CATEGORY_MAP.items():
            futures.append(executor.submit(_crawl_category, cat_id, ctype, ccat))
            
        for future in concurrent.futures.as_completed(futures):
            try:
                res = future.result()
                all_campaigns.extend(res)
            except Exception as e:
                logger.error(f"작업 실패: {e}")
                
    logger.info(f"파블로 총 {len(all_campaigns)}개 수집 완료")
    return all_campaigns



"""모두의체험단 크롤러 (카테고리 기반)"""

import re
import concurrent.futures
from typing import List, Tuple
import requests
from bs4 import BeautifulSoup

from crawler.models import Campaign
from crawler.utils import clean_text, logger
from crawler.category import normalize_category

BASE_URL = "https://xn--6j1br0ag3lba435lvsj96p.com"

# 카테고리 매핑: category_id -> (Type, Raw Category)
CATEGORY_MAP = {
    # 맛집 (Visit)
    "047A": ("visit", "맛집"),
    
    # 뷰티 (Visit)
    "051A": ("visit", "뷰티"), # 전체 뷰티
    # (세부: 051A052A 헤어, 051A054A 네일 등 - 상위만 긁어도 될듯)

    # 제품 (Delivery)
    "002A031A": ("delivery", "생활"),   # 생활
    "002A032A": ("delivery", "디지털"), # 디지털
    "002A033A": ("delivery", "패션"),   # 패션
    "002A034A": ("delivery", "뷰티"),   # 미용(제품)
    "002A035A": ("delivery", "식품"),   # 식품
    "002A036A": ("delivery", "기타"),   # 기타
    "002A048A": ("delivery", "기타"),   # 새분류?

    # 서비스 (Visit)
    # 003A039A 숙박 -> 여행
    "003A039A": ("visit", "여행"),
    # 003A037A 이벤트, 003A038A 앱서비스 -> 생활/기타
    "003A": ("visit", "생활"), # 상위 서비스 전체 (숙박 중복 가능성 있으나 허용)

    # 기자단
    "004A": ("reporter", "기자단"),
}

def _parse_card(card, fixed_type: str, fixed_category: str) -> Campaign | None:
    """모두의체험단 카드 파싱"""
    try:
        # 링크
        link_el = card.select_one('a[href*="campaign.php"]')
        if not link_el:
            return None
        href = link_el.get("href", "")
        # href example: campaign.php?cp_id=...
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
                 location = match.group(1)
                 # 제목에서 지역 제거
                 title = re.sub(r"\[[^\]]+\]\s*", "", title).strip()
        elif fixed_type == "delivery":
            location = "배송"
            # 배송형도 [브랜드] 같은게 있을 수 있으나 보통 지역은 아님. 제거할지 선택.
            # 일단 둡니다.

        # 채널
        channel_el = card.select_one(".top_info span")
        channel = "블로그"
        if channel_el:
            ch_text = clean_text(channel_el.get_text())
            if "인스타" in ch_text: channel = "인스타"
            elif "유튜브" in ch_text: channel = "유튜브"
            elif "블로그" in ch_text: channel = "블로그"
            else: channel = ch_text

        # 마감일
        deadline_el = card.select_one(".dday")
        deadline = None
        if deadline_el:
            dt = clean_text(deadline_el.get_text())
            if "마감" in dt or "종료" in dt:
                 logger.debug(f"Skip: Deadline finished '{dt}' - {title}")
                 return None
            # D-Day N -> D-N
            m = re.search(r"D-Day\s*(\d+)", dt, re.IGNORECASE)
            if m: deadline = f"D-{m.group(1)}"
            else: deadline = dt
            
            if re.search(r"D\s*\+\s*\d+", deadline):
                 logger.debug(f"Skip: Deadline passed '{deadline}' - {title}") 
                 return None
        else:
             logger.debug(f"Skip: No deadline element - {title}")
             # return None # Or decide to keep? Original code didn't return None here explicitly but deadline was used later?
             # Actually original code: if deadline: checks... but deadline defaults to None.
             # If deadline is None, is it skipped? No.
             pass

        # 이미지
        img_el = card.select_one(".it_img, img")
        image_url = None
        if img_el:
            src = img_el.get("src", "")
            if src.startswith("//"): image_url = "https:" + src
            elif src.startswith("./"): image_url = BASE_URL + "/" + src[2:]
            elif src.startswith("/"): image_url = BASE_URL + src
            elif src.startswith("http"): image_url = src

        # 정규화
        final_category = normalize_category("modooexperience", fixed_category, title)

        return Campaign(
            title=title,
            url=url,
            site_name="modooexperience",
            category=final_category,
            deadline=deadline,
            location=location,
            image_url=image_url,
            channel=channel,
            type=fixed_type,
            review_deadline_days=None,
        )

    except Exception as e:
        logger.error(f"모두의체험단 파싱 에러: {e}")
        return None

def _crawl_category(cat_id: str, c_type: str, c_cat: str) -> List[Campaign]:
    campaigns = []
    # url pattern: campaign_list.php?category_id=...
    url = f"{BASE_URL}/campaign_list.php"
    params = {"category_id": cat_id}
    
    try:
        res = requests.get(url, params=params, headers={
             "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }, timeout=10)
        res.raise_for_status()
        
        soup = BeautifulSoup(res.text, "html.parser")
        cards = soup.select(".box")
        
        logger.info(f"[모두의체험단] {c_cat} ({cat_id}) - {len(cards)}개 발견")
        
        for card in cards:
            c = _parse_card(card, c_type, c_cat)
            if c:
                campaigns.append(c)
                
    except Exception as e:
        logger.error(f"[모두의체험단] 요청 실패 ({cat_id}): {e}")
        
    return campaigns

def crawl() -> List[Campaign]:
    logger.info("모두의체험단 크롤링 시작")
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
                
    logger.info(f"모두의체험단 총 {len(all_campaigns)}개 수집 완료")
    return all_campaigns


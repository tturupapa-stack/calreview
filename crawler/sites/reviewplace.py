"""리뷰플레이스 크롤러 (카테고리 기반)"""

import re
import concurrent.futures
from typing import List, Tuple
import requests
from bs4 import BeautifulSoup

from crawler.models import Campaign
from crawler.utils import clean_text, logger
from crawler.category import normalize_category

BASE_URL = "https://www.reviewplace.co.kr"

# 카테고리 매핑 (Query String -> (Type, Raw Category))
# 한글 파라미터는 requests가 자동으로 인코딩해주지 않으므로, URL에 직접 넣을 때는 주의 필요.
# 여기서는 requests.get(params=...) 방식을 사용하여 처리를 위임하는 것이 좋음.
# 키를 튜플로 정의: (ct1, ct2)
CATEGORY_MAP = {
    # 제품 (Delivery)
    ("제품", "식품"): ("delivery", "식품"),
    ("제품", "생활"): ("delivery", "생활"),
    ("제품", "뷰티"): ("delivery", "뷰티"),
    ("제품", "유아동"): ("delivery", "유아동"),
    ("제품", "운동/건강"): ("delivery", "생활"), 
    ("제품", "디지털"): ("delivery", "디지털"),
    ("제품", "패션/잡화"): ("delivery", "패션"),
    ("제품", "반려동물"): ("delivery", "반려동물"),
    ("제품", "도서/교육"): ("delivery", "도서"),
    ("제품", "서비스"): ("delivery", "생활"),
    ("제품", "기타"): ("delivery", "기타"),

    # 지역 (Visit)
    ("지역", "맛집"): ("visit", "맛집"),
    ("지역", "카페/베이커리"): ("visit", "맛집"),
    ("지역", "뷰티/건강"): ("visit", "뷰티"),
    ("지역", "운동/스포츠"): ("visit", "생활"),
    ("지역", "숙박"): ("visit", "여행"),
    ("지역", "문화/체험"): ("visit", "문화"),
    ("지역", "생활/편의"): ("visit", "생활"),
    ("지역", "기타"): ("visit", "기타"),
    
    # 기자단 (Reporter) - ct2 없이 ct1만 사용
    ("기자단", None): ("reporter", "기자단"),
}

def _parse_card(card, fixed_type: str, fixed_category: str) -> Campaign | None:
    """리뷰플레이스 캠페인 파싱"""
    try:
        link_el = card.select_one("a[href*='/pr/?id=']")
        if not link_el:
            return None

        href = link_el.get("href") or ""
        if href.startswith("/"):
            url = BASE_URL + href
        else:
            url = href or BASE_URL

        # 제목
        title_el = card.select_one("div.txt_wrap p.tit")
        if not title_el:
            return None
        raw_title = clean_text(title_el.get_text())
        title = raw_title

        # 채널 정보 추출
        channel_list = []
        
        # 1. 아이콘 기반
        sns_icon_el = card.select_one("div.sns_icon")
        if sns_icon_el:
            icon_divs = sns_icon_el.select("div[class*='_icon'], div[class*='icon']")
            for icon_div in icon_divs:
                icon_class = " ".join(icon_div.get("class", []))
                if "blog" in icon_class.lower():
                    if "블로그" not in channel_list: channel_list.append("블로그")
                elif "insta" in icon_class.lower():
                    if "인스타" not in channel_list: channel_list.append("인스타")
                elif "youtube" in icon_class.lower() or "yt" in icon_class.lower():
                    if "유튜브" not in channel_list: channel_list.append("유튜브")
                elif "tiktok" in icon_class.lower():
                    if "틱톡" not in channel_list: channel_list.append("틱톡")
                elif "clip" in icon_class.lower():
                    if "클립" not in channel_list: channel_list.append("클립")
        
        # 2. 텍스트(대괄호) 기반
        channel_keywords = ["블로그", "인스타", "릴스", "유튜브", "쇼츠", "틱톡", "클립"]
        bracket_matches = re.findall(r"\[([^\]]+)\]", raw_title)
        
        clean_brackets = [] # 지역 정보 후보
        
        for b_text in bracket_matches:
            # 채널 찾기
            found_chan = False
            parts = re.split(r"[\/,\s]+", b_text)
            for part in parts:
                p_clean = part.strip()
                if p_clean in channel_keywords:
                    if p_clean not in channel_list:
                        channel_list.append(p_clean)
                    found_chan = True
            
            if not found_chan:
                clean_brackets.append(b_text)
        
        channel = "/".join(channel_list) if channel_list else None

        # 지역 정보
        location = None
        if fixed_type == "delivery":
            location = "배송"
        elif fixed_type == "visit":
            # 남은 대괄호 내용을 지역으로 간주 (첫번째 것만)
            if clean_brackets:
                location = clean_brackets[0]
        
        # 제목 정제 (대괄호 제거)
        title = re.sub(r"\[[^\]]+\]\s*", "", raw_title).strip()

        # 마감일
        deadline_el = card.select_one("div.date_wrap p.date")
        deadline = None
        if deadline_el:
            date_text = clean_text(deadline_el.get_text())
            # "마감", "종료" 체크
            if any(k in date_text.lower() for k in ["마감", "종료", "closed"]):
                return None
            if re.search(r"D\s*\+\s*\d+", date_text, re.IGNORECASE):
                # 이미 지난 마감일
                return None
            deadline = date_text

        # 이미지
        img_el = card.select_one("div.img img, img.thumbimg")
        image_url = None
        if img_el:
            src = img_el.get("src")
            if src:
                if src.startswith("//"): image_url = "https:" + src
                elif src.startswith("/"): image_url = BASE_URL + src
                else: image_url = src

        # 카테고리 정규화
        final_category = normalize_category("reviewplace", fixed_category, title)

        return Campaign(
            title=title,
            url=url,
            site_name="reviewplace",
            category=final_category,
            deadline=deadline,
            location=location,
            image_url=image_url,
            channel=channel,
            type=fixed_type,
            review_deadline_days=None,
        )

    except Exception as e:
        logger.error(f"리뷰플레이스 파싱 오류: {e}")
        return None


def _crawl_category(ct1: str, ct2: str | None, c_type: str, c_cat: str) -> List[Campaign]:
    """특정 카테고리 페이지 크롤링"""
    url = f"{BASE_URL}/pr/"
    params = {"ct1": ct1}
    if ct2:
        params["ct2"] = ct2
        
    campaigns = []
    try:
        res = requests.get(url, params=params, headers={
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }, timeout=10)
        res.raise_for_status()
        
        soup = BeautifulSoup(res.text, "html.parser")
        cards = soup.select("#cmp_list div.item")
        
        logger.info(f"[리뷰플레이스] {c_cat} ({ct1}/{ct2}) - {len(cards)}개 발견")
        
        for card in cards:
            c = _parse_card(card, c_type, c_cat)
            if c:
                campaigns.append(c)
                
    except Exception as e:
        logger.error(f"[리뷰플레이스] 요청 실패 ({ct1}, {ct2}): {e}")
        
    return campaigns


def crawl() -> List[Campaign]:
    """리뷰플레이스 크롤링 (카테고리 기반, 병렬)"""
    logger.info("리뷰플레이스 크롤링 시작")
    all_campaigns = []
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
        futures = []
        for (ct1, ct2), (ctype, ccat) in CATEGORY_MAP.items():
            futures.append(executor.submit(_crawl_category, ct1, ct2, ctype, ccat))
            
        for future in concurrent.futures.as_completed(futures):
            try:
                result = future.result()
                all_campaigns.extend(result)
            except Exception as e:
                logger.error(f"작업 실패: {e}")
                
    logger.info(f"리뷰플레이스 총 {len(all_campaigns)}개 수집 완료")
    return all_campaigns


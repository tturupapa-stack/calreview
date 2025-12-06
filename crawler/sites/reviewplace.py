from __future__ import annotations

from typing import List

import re

import requests
from bs4 import BeautifulSoup

from crawler.models import Campaign
from crawler.utils import clean_text, logger
from crawler.utils_detail import extract_review_deadline_days


BASE_URL = "https://www.reviewplace.co.kr"
LIST_PATH = "/pr/?ct1=%EC%A0%9C%ED%92%88"


def _parse_campaign_element(card, category: str | None = None) -> Campaign | None:
    """리뷰플레이스 캠페인 카드 한 개를 Campaign으로 변환.

    HTML 구조 예시:
    - div#cmp_list.campaign_list_c_list 안의 div.item
      - a[href="/pr/?id=..."]                  -> 상세 링크
        - img.thumbimg                         -> 메인 이미지
      - div.txt_wrap > p.tit                  -> 제목 (예: "[서울/강남] 더하노이...")
      - div.date_wrap > p.date                -> 마감 정보 (예: "D - 4")

    Args:
        card: BeautifulSoup 요소 (div.item)
        category: URL 파라미터에서 추출한 카테고리 (예: "제품", "맛집" 등)
    """

    try:
        link_el = card.select_one("a[href*='/pr/?id=']")
        if not link_el:
            return None

        href = link_el.get("href") or ""
        if href.startswith("/"):
            url = BASE_URL + href
        else:
            url = href or BASE_URL

        # 제목 + [지역/채널] 정보
        title_el = card.select_one("div.txt_wrap p.tit")
        if not title_el:
            return None
        raw_title = clean_text(title_el.get_text())

        # 채널 정보 추출 (여러 개 가능)
        channel_list: list[str] = []
        channel_keywords = [
            "블로그",
            "인스타",
            "릴스",
            "유튜브",
            "쇼츠",
            "틱톡",
            "클립",
        ]

        # HTML에서 sns_icon 아이콘 순서로 채널 정보 추출
        # 첫 번째: blog_icon -> 블로그
        # 두 번째: instagram_icon 또는 insta_icon -> 인스타
        # 등등
        sns_icon_el = card.select_one("div.sns_icon")
        if sns_icon_el:
            # sns_icon 안의 모든 아이콘 div 찾기
            icon_divs = sns_icon_el.select("div[class*='_icon'], div[class*='icon']")
            for icon_div in icon_divs:
                icon_class = " ".join(icon_div.get("class", []))
                # 클래스명에서 채널 타입 추출
                if "blog" in icon_class.lower():
                    if "블로그" not in channel_list:
                        channel_list.append("블로그")
                elif "insta" in icon_class.lower() or "instagram" in icon_class.lower():
                    if "인스타" not in channel_list:
                        channel_list.append("인스타")
                elif "youtube" in icon_class.lower() or "yt" in icon_class.lower():
                    if "유튜브" not in channel_list:
                        channel_list.append("유튜브")
                elif "tiktok" in icon_class.lower():
                    if "틱톡" not in channel_list:
                        channel_list.append("틱톡")
                elif "clip" in icon_class.lower():
                    if "클립" not in channel_list:
                        channel_list.append("클립")
                elif "reels" in icon_class.lower():
                    if "릴스" not in channel_list:
                        channel_list.append("릴스")

        # 모든 대괄호 패턴 찾기: "[인스타][릴스] 제목" 또는 "[인스타/릴스] 제목"
        bracket_pattern = r"\[([^\]]+)\]"
        all_brackets = re.findall(bracket_pattern, raw_title)

        # 카테고리가 "제품"인 경우: location을 "배송"으로 고정
        if category == "제품":
            location = "배송"
            # 제목에서 대괄호 부분 제거
            title = re.sub(r"\[[^\]]+\]\s*", "", raw_title).strip()
            
            # 모든 대괄호에서 채널 정보 추출
            for bracket_text in all_brackets:
                # 예: "[인스타/릴스]" 또는 "[인스타]" 형태
                raw_parts = re.split(r"[\/,\s]+", bracket_text)
                parts = [p.strip() for p in raw_parts if p.strip()]
                
                for part in parts:
                    if part in channel_keywords and part not in channel_list:
                        channel_list.append(part)
        else:
            # 그 외의 경우: 기존 로직대로 지명 파싱
            location: str | None = None
            title = raw_title
            
            # 모든 대괄호에서 채널 정보 추출
            for bracket_text in all_brackets:
                # 예: "[인스타/서울/강남]" 또는 "[인스타/릴스]" 형태
                raw_parts = re.split(r"[\/,\s]+", bracket_text)
                parts = [p.strip() for p in raw_parts if p.strip()]
                
                # 채널 정보 추출 (여러 개 가능)
                has_channel = False
                for part in parts:
                    if part in channel_keywords:
                        if part not in channel_list:
                            channel_list.append(part)
                        has_channel = True
                
                # 채널 정보가 없으면 지역 정보로 판단
                if not has_channel and not location:
                    location = bracket_text
            
            # 제목에서 모든 대괄호 제거
            title = re.sub(r"\[[^\]]+\]\s*", "", raw_title).strip()
        
        # 채널이 여러 개면 "/"로 구분하여 저장
        channel = "/".join(channel_list) if channel_list else None

        # 남은 기간(마감 정보) - "D - 4" 형태를 그대로 deadline 필드에 저장
        # p.date 안에 em.d_ico와 텍스트가 있음
        date_el = card.select_one("div.date_wrap p.date")
        if date_el:
            # em.d_ico 제거하고 텍스트만 추출
            date_text = date_el.get_text()
            # "D - 4" 형태로 정리
            deadline = clean_text(date_text)
            
            # 마감된 체험단 제외
            if deadline:
                deadline_lower = deadline.lower()
                # "마감", "종료" 키워드가 있으면 스킵
                if any(keyword in deadline_lower for keyword in ["마감", "종료", "closed"]):
                    logger.debug("리뷰플레이스 캠페인: 마감됨 (%s), 스킵", deadline)
                    return None  # 함수이므로 return 사용
                # D+N 또는 D + N 형태 (이미 지남)
                if re.search(r"D\s*\+\s*\d+", deadline, re.IGNORECASE):
                    logger.debug("리뷰플레이스 캠페인: 마감 지남 (%s), 스킵", deadline)
                    return None  # 함수이므로 return 사용
        else:
            deadline = None

        # 메인 이미지
        img_el = card.select_one("div.img img, img.thumbimg")
        src = img_el.get("src") if img_el else None
        if src:
            if src.startswith("//"):
                image_url = "https:" + src
            elif src.startswith("/"):
                image_url = BASE_URL + src
            else:
                image_url = src
        else:
            image_url = None

        # 상세 페이지에서 리뷰 기간 추출
        review_deadline_days = extract_review_deadline_days(url, "reviewplace")

        return Campaign(
            title=title,
            url=url,
            site_name="reviewplace",
            category=category,
            deadline=deadline or None,
            location=location,
            image_url=image_url,
            channel=channel,
            review_deadline_days=review_deadline_days,
        )
    except Exception as e:  # pragma: no cover
        logger.error("리뷰플레이스 캠페인 파싱 중 오류: %s", e)
        return None


def crawl(max_pages: int = 1) -> List[Campaign]:
    """리뷰플레이스 크롤링 로직."""

    logger.info("리뷰플레이스 크롤링 시작")
    campaigns: list[Campaign] = []

    for page in range(1, max_pages + 1):
        try:
            # 제품 카테고리 목록 페이지 (페이지네이션 구조 확인 전까지 page는 미사용)
            url = f"{BASE_URL}{LIST_PATH}"
            res = requests.get(url, timeout=10)
            res.raise_for_status()

            # URL 파라미터에서 카테고리 추출: ct1=%EC%A0%9C%ED%92%88 (제품) 등
            category = None
            try:
                from urllib.parse import unquote, parse_qs, urlparse
                parsed_url = urlparse(url)
                params = parse_qs(parsed_url.query)
                if "ct1" in params:
                    # URL 디코딩: %EC%A0%9C%ED%92%88 -> 제품
                    category = unquote(params["ct1"][0])
            except Exception:
                pass

            soup = BeautifulSoup(res.text, "html.parser")
            # 메인 리스트: div#cmp_list.campaign_list_c_list 안의 div.item
            cards = soup.select("#cmp_list div.item")
            logger.info("리뷰플레이스 %s 에서 %d개 카드 발견 (카테고리: %s)", url, len(cards), category or "없음")

            for card in cards:
                campaign = _parse_campaign_element(card, category=category)
                if campaign:
                    campaigns.append(campaign)
        except Exception as e:  # pragma: no cover
            logger.error("리뷰플레이스 페이지 %d 크롤링 중 오류: %s", page, e)
            break

    logger.info("리뷰플레이스 총 %d개 캠페인 수집", len(campaigns))
    logger.info("리뷰플레이스 크롤링 완료")
    return campaigns


from __future__ import annotations

import re
from typing import List

import requests
from bs4 import BeautifulSoup

from crawler.models import Campaign
from crawler.utils import clean_text, logger
from crawler.utils_detail import extract_review_deadline_days


# 강남맛집 실제 도메인/목록 URL
BASE_URL = "https://xn--939au0g4vj8sq.net"
LIST_PATH = "/cp/"  # 전체 목록 (다양한 카테고리 포함)


def _parse_campaign_element(card) -> Campaign | None:
    """강남맛집 캠페인 카드 한 개를 Campaign으로 변환.

    HTML 구조:
    - li.list_item (data-product=...)
      - div.imgArea > a[href="/cp/?id=..."] > img.thumb_img(src=...)
      - div.textArea
        - dt.tit > a[href="/cp/?id=..."]  -> 제목 "[서울 영등포] 써티올테니스..."
        - span.dday > em.day_c            -> '5일 남음' 형태의 남은 기간
        - em.type                         -> '방문형' 등 카테고리
    """

    try:
        # 상세 페이지 링크
        link_el = card.select_one("div.imgArea a[href], dt.tit a[href]")
        if not link_el:
            return None

        href = link_el.get("href") or ""
        if href.startswith("/"):
            url = BASE_URL + href
        else:
            url = href or BASE_URL

        # 제목
        title_el = card.select_one("dt.tit a")
        if not title_el:
            return None
        raw_title = clean_text(title_el.get_text())

        # 제목에서 지역 정보 추출: "[서울 영등포] 써티올테니스 영등포역점" 형태
        location: str | None = None
        title = raw_title
        channel: str | None = None

        # 채널 키워드 목록
        channel_keywords = [
            "블로그",
            "인스타",
            "릴스",
            "유튜브",
            "쇼츠",
            "틱톡",
            "클립",
        ]

        # 대괄호 패턴으로 분리 (여러 개 가능: "[서울 종로][클립] 제목")
        bracket_matches = re.findall(r"\[([^\]]+)\]", raw_title)
        channel_list: list[str] = []
        
        for bracket_text in bracket_matches:
            # 채널 키워드 확인
            bracket_lower = bracket_text.lower()
            for keyword in channel_keywords:
                if keyword in bracket_lower:
                    if keyword not in channel_list:
                        channel_list.append(keyword)
                elif keyword == "클립" and "clip" in bracket_lower:
                    if "클립" not in channel_list:
                        channel_list.append("클립")
            
            # 채널 키워드가 없으면 지역 정보로 판단
            if not any(keyword in bracket_text for keyword in channel_keywords) and not any(keyword in bracket_lower for keyword in ["clip"]):
                if not location:  # 첫 번째 비-채널 대괄호를 지역으로
                    location = bracket_text
        
        # 제목에서 대괄호 제거
        title = re.sub(r"\[[^\]]+\]\s*", "", raw_title).strip()

        # HTML에서 채널 정보 확인: em.blog 등
        blog_el = card.select_one("em.blog")
        if blog_el:
            blog_text = clean_text(blog_el.get_text())
            if blog_text.lower() == "blog" and "블로그" not in channel_list:
                channel_list.append("블로그")
        
        # 채널이 여러 개면 "/"로 구분하여 저장
        channel = "/".join(channel_list) if channel_list else None

        # 남은 기간(마감 정보) - '5일 남음' 같은 형태를 'D-5' 형식으로 변환
        deadline_el = card.select_one("span.dday em.day_c")
        deadline_raw = clean_text(deadline_el.get_text()) if deadline_el else None
        deadline = None
        if deadline_raw:
            # "마감", "종료" 키워드가 있으면 스킵
            deadline_lower = deadline_raw.lower()
            if any(keyword in deadline_lower for keyword in ["마감완료", "종료", "closed"]):
                logger.debug("강남맛집 캠페인: 마감됨 (%s), 스킵", deadline_raw)
                return None  # 함수이므로 return 사용
                
            # "6일 남음" -> "D-6" 형식으로 변환
            match = re.search(r"(\d+)일\s*남음", deadline_raw)
            if match:
                days = match.group(1)
                deadline = f"D-{days}"
            else:
                # 다른 형식도 처리 (예: "마감임박", "오늘 마감" 등)
                deadline = deadline_raw

        # 카테고리: em.type (예: "방문형", "배송형" 등)
        category_el = card.select_one("em.type")
        category = clean_text(category_el.get_text()) if category_el else None

        # 메인 이미지
        img_el = card.select_one("div.imgArea img.thumb_img")
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
        review_deadline_days = extract_review_deadline_days(url, "gangnam")

        return Campaign(
            title=title,
            url=url,
            site_name="gangnam",
            category=category or None,
            deadline=deadline or None,
            location=location,
            image_url=image_url,
            channel=channel,
            review_deadline_days=review_deadline_days,
        )
    except Exception as e:  # pragma: no cover
        logger.error("강남맛집 캠페인 파싱 중 오류: %s", e)
        return None


def crawl(max_pages: int = 1) -> List[Campaign]:
    """강남맛집 크롤링 로직."""

    logger.info("강남맛집 크롤링 시작")
    campaigns: list[Campaign] = []

    for page in range(1, max_pages + 1):
        try:
            # 카테고리 20 목록 페이지 (페이지네이션 구조 확인 전까지 page는 미사용)
            url = f"{BASE_URL}{LIST_PATH}"
            res = requests.get(url, timeout=10)
            res.raise_for_status()

            soup = BeautifulSoup(res.text, "html.parser")
            # 메인 리스트: ul#gal1_ul 또는 ul#gall_ul 안의 li.list_item
            # 여러 가능한 id를 시도
            cards = soup.select("#gal1_ul li.list_item, #gall_ul li.list_item, li.list_item")
            logger.info("강남맛집 %s 에서 %d개 카드 발견", url, len(cards))

            for card in cards:
                campaign = _parse_campaign_element(card)
                if campaign:
                    campaigns.append(campaign)
        except Exception as e:  # pragma: no cover
            logger.error("강남맛집 페이지 %d 크롤링 중 오류: %s", page, e)
            break

    logger.info("강남맛집 총 %d개 캠페인 수집", len(campaigns))
    logger.info("강남맛집 크롤링 완료")
    return campaigns


from __future__ import annotations

import re
from typing import List

import requests
from bs4 import BeautifulSoup

from crawler.models import Campaign
from crawler.utils import clean_text, logger
from crawler.utils_detail import extract_review_deadline_days


# 실제 서비스 도메인/목록 URL
BASE_URL = "https://dinnerqueen.net"
LIST_PATH = "/taste?ct=%EC%A0%84%EC%B2%B4"


def _parse_campaign_element(card) -> Campaign | None:
    """디너의여왕 캠페인 카드 한 개를 공통 Campaign으로 변환.

    HTML 구조:
    - 카드 전체: div.qz-dq-card
    - 링크:      a.qz-dq-card__link (언더스코어 2개 주의)
    - 이미지:    .qz-dq-card__link__img img
    - 마감일:    div.layer-primary > p.qz-caption-kr--line > strong (예: "D-3")
    - 카테고리:  div.layer-tertiary-o > p > strong (예: "맛집", "릴스")
    - 제목:      p.qz-body2-kr---line.color-title (내부 span으로 [전국][피자알볼로] 제목 형태)
    """

    try:
        # 링크 태그 찾기
        link_el = card.select_one("a.qz-dq-card__link")
        if not link_el:
            return None

        href = link_el.get("href") or ""
        if href.startswith("/"):
            url = BASE_URL + href
        else:
            url = href

        # 제목: 제목 p 안의 텍스트 전체
        # 클래스명이 정확하지 않을 수 있으니 여러 패턴 시도
        title_el = card.select_one("p.qz-body2-kr---line.color-title, p.qz-body2-kr--line.color-title, p.qz-body2-kr---line")
        if not title_el:
            # 제목이 없으면 링크의 title 속성에서 추출 시도
            title_attr = link_el.get("title", "")
            if title_attr:
                # title 속성에서 "[지역][채널] 제목 신청하기" 형태에서 제목만 추출
                raw_title = re.sub(r"\s*신청하기\s*$", "", title_attr).strip()
            else:
                return None
        else:
            raw_title = clean_text(title_el.get_text())

        # 제목에서 지역 정보 추출: "[전국][피자알볼로] sUPer 포테이토 피자" 형태
        # 첫 번째 대괄호 안이 지역일 가능성이 높음
        location: str | None = None
        title = raw_title

        # 대괄호 패턴으로 분리: "[전국][피자알볼로] 제목"
        bracket_pattern = r"\[([^\]]+)\]"
        matches = re.findall(bracket_pattern, raw_title)

        # 채널/플랫폼/브랜드 키워드 목록
        channel_keywords = [
            "릴스",
            "리워드",
            "클립",
            "블로그",
            "인스타",
            "유튜브",
            "쇼츠",
            "틱톡",
        ]

        if matches:
            # 첫 번째 대괄호 안 텍스트가 지역인지 판단
            first_bracket = matches[0]
            # "전국", "서울", "강남" 같은 지역 키워드가 있거나, 채널 키워드가 없으면 지역으로 판단
            if not any(keyword in first_bracket for keyword in channel_keywords):
                # 지역 정보로 판단
                location = first_bracket
            # 첫 번째가 채널이면 지역 정보 없음 (location은 None 유지)
            
            # 제목에서 모든 대괄호 부분 제거
            title = re.sub(r"\[[^\]]+\]\s*", "", raw_title).strip()

        # 마감일: div.layer-primary > p.qz-caption-kr--line > strong
        deadline_el = card.select_one("div.layer-primary p.qz-caption-kr--line strong")
        deadline = clean_text(deadline_el.get_text()) if deadline_el else None
        
        # 마감된 체험단 제외
        if deadline:
            deadline_lower = deadline.lower()
            # "마감", "종료", "D+숫자" (이미 지남) 형태면 스킵
            if any(keyword in deadline_lower for keyword in ["마감", "종료", "closed"]):
                logger.debug("디너의여왕 캠페인: 마감됨 (%s), 스킵", deadline)
                return None  # 함수이므로 return 사용
            # D+N 형태 (이미 지남)
            if re.search(r"D\s*\+\s*\d+", deadline, re.IGNORECASE):
                logger.debug("디너의여왕 캠페인: 마감 지남 (%s), 스킵", deadline)
                return None  # 함수이므로 return 사용

        # 카테고리: div.layer-tertiary-o > p > strong (첫 번째 것, 예: "맛집")
        # "릴스", "클립" 등은 채널 정보이므로 제외하고 메인 카테고리만 사용
        category_els = card.select("div.layer-tertiary-o p strong")
        category = None
        channel_list: list[str] = []
        channel_keywords_list = ["릴스", "클립", "리워드", "블로그", "인스타", "유튜브", "쇼츠", "틱톡"]
        
        if category_els:
            # 첫 번째 카테고리 사용 (일반적으로 "맛집", "뷰티" 등)
            first_category = clean_text(category_els[0].get_text())
            # "릴스", "클립" 같은 채널은 카테고리로 사용하지 않음
            if first_category and not any(keyword in first_category for keyword in channel_keywords_list):
                category = first_category
            
            # 채널 정보 추출: 모든 배지에서 채널 키워드 찾기 (여러 개 가능)
            for cat_el in category_els:
                cat_text = clean_text(cat_el.get_text())
                if cat_text in channel_keywords_list and cat_text not in channel_list:
                    channel_list.append(cat_text)
        
        # 제목에서도 채널 정보 확인 (예: "[서울 관악][릴스] 제목" 또는 "[인스타/릴스] 제목")
        if matches:
            for match in matches:
                # 대괄호 안에 "/"로 구분된 여러 채널이 있을 수 있음
                match_parts = re.split(r"[\/,\s]+", match)
                for part in match_parts:
                    part = part.strip()
                    if part in channel_keywords_list and part not in channel_list:
                        channel_list.append(part)
        
        # 채널이 여러 개면 "/"로 구분하여 저장
        # 채널 정보가 없으면 기본값으로 "블로그" 설정
        channel = "/".join(channel_list) if channel_list else "블로그"

        # 메인 이미지: 카드 상단 이미지 태그
        img_el = card.select_one(".qz-dq-card__link__img img")
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
        review_deadline_days = extract_review_deadline_days(url, "dinnerqueen")

        return Campaign(
            title=title,
            url=url,
            site_name="dinnerqueen",
            category=category or None,
            deadline=deadline,
            location=location,
            image_url=image_url,
            channel=channel,
            review_deadline_days=review_deadline_days,
        )
    except Exception as e:  # pragma: no cover
        logger.error("디너의여왕 캠페인 파싱 중 오류: %s", e)
        return None


def crawl(max_pages: int = 1) -> List[Campaign]:
    """디너의여왕 크롤링 로직."""

    logger.info("디너의여왕 크롤링 시작")
    campaigns: list[Campaign] = []

    for page in range(1, max_pages + 1):
        try:
            # 맛집 전체 목록 페이지 (페이지네이션 구조 확인 전까지 page는 미사용)
            url = f"{BASE_URL}{LIST_PATH}"
            res = requests.get(url, timeout=10)
            res.raise_for_status()

            soup = BeautifulSoup(res.text, "html.parser")

            # 맛집 리스트 카드: div#taste_list 안의 div.qz-dq-card
            # 실제 HTML 구조: div.qz-col > div.qz-dq-card > a.qz-dq-card__link
            cards = soup.select("#taste_list div.qz-dq-card, div.qz-dq-card")
            logger.info("디너의여왕 %s 에서 %d개 카드 발견", url, len(cards))

            for card in cards:
                campaign = _parse_campaign_element(card)
                if campaign:
                    campaigns.append(campaign)
                else:
                    # 디버깅: 왜 파싱이 실패하는지 확인
                    link_el = card.select_one("a.qz-dq-card__link")
                    if link_el:
                        logger.debug("디너의여왕 카드 파싱 실패: href=%s", link_el.get("href"))
        except Exception as e:  # pragma: no cover
            logger.error("디너의여왕 페이지 %d 크롤링 중 오류: %s", page, e)
            break

    logger.info("디너의여왕 총 %d개 캠페인 수집", len(campaigns))
    logger.info("디너의여왕 크롤링 완료")
    return campaigns


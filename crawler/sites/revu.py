from __future__ import annotations

from typing import List

import requests
from bs4 import BeautifulSoup

from crawler.models import Campaign
from crawler.utils import clean_text, logger


BASE_URL = "https://www.revu.net"


def _parse_campaign_element(element) -> Campaign | None:
    """레뷰 리스트의 단일 캠페인 요소를 Campaign으로 변환.

    실제 CSS 셀렉터/구조는 운영 환경에서 확인 후 보완해야 한다.
    """

    try:
        title_el = element.select_one(".tit, .title, a")
        if not title_el:
            return None

        title = clean_text(title_el.get_text())
        href = title_el.get("href") or ""
        if href.startswith("/"):
            url = BASE_URL + href
        else:
            url = href or BASE_URL

        # 카테고리/마감일/지역은 사이트 HTML 구조에 맞게 이후 보완
        category_el = element.select_one(".category")
        category = clean_text(category_el.get_text()) if category_el else None

        deadline_el = element.select_one(".dday, .deadline")
        deadline = clean_text(deadline_el.get_text()) if deadline_el else None

        location_el = element.select_one(".area, .location")
        location = clean_text(location_el.get_text()) if location_el else None

        # 메인 이미지 (카드 내 img 태그 사용, 추후 셀렉터 보완 가능)
        img_el = element.select_one("img")
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

        return Campaign(
            title=title,
            url=url,
            site_name="revu",
            category=category or None,
            deadline=deadline or None,
            location=location or None,
            image_url=image_url,
        )
    except Exception as e:  # pragma: no cover - 방어적 로깅
        logger.error("레뷰 캠페인 파싱 중 오류: %s", e)
        return None


def crawl(max_pages: int = 1) -> List[Campaign]:
    """레뷰 크롤링 로직.

    기본적으로 첫 페이지(또는 max_pages까지)에서 공통 Campaign 리스트를 수집한다.
    """

    logger.info("레뷰 크롤링 시작")
    campaigns: list[Campaign] = []

    for page in range(1, max_pages + 1):
        try:
            # 실제 리스트 URL은 운영 환경에서 확인 후 수정 필요
            url = f"{BASE_URL}/campaign/list?page={page}"
            res = requests.get(url, timeout=10)
            res.raise_for_status()

            soup = BeautifulSoup(res.text, "html.parser")
            # 실제 캠페인 카드 셀렉터는 이후 보완
            items = soup.select(".campaign-item, .list li")
            logger.info("레뷰 %s 에서 %d개 항목 발견", url, len(items))

            for el in items:
                campaign = _parse_campaign_element(el)
                if campaign:
                    campaigns.append(campaign)
        except Exception as e:  # pragma: no cover - 네트워크/파싱 의존
            logger.error("레뷰 페이지 %d 크롤링 중 오류: %s", page, e)
            break

    logger.info("레뷰 총 %d개 캠페인 수집", len(campaigns))
    logger.info("레뷰 크롤링 완료")
    return campaigns


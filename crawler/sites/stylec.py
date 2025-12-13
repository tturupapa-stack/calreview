"""스타일씨 크롤러

API 직접 호출 방식으로 캠페인 데이터를 수집합니다.
API Host: https://api2.stylec.co.kr:6439/v1
"""

import re
from typing import List, Set

import requests

from crawler.models import Campaign
from crawler.utils import clean_text, logger

BASE_URL = "https://www.stylec.co.kr"
API_HOST = "https://api2.stylec.co.kr:6439/v1"

# SNS 타입 → 채널명 매핑
SNS_TYPE_MAP = {
    "naverblog": "블로그",
    "instagram": "인스타",
    "instagramreels": "릴스",
    "naverclip": "클립",
    "youtube": "유튜브",
    "youtubeshorts": "쇼츠",
    "tiktok": "틱톡",
}

# 지역 키워드 (대괄호 안에서 추출)
LOCATION_KEYWORDS = [
    # 전국/배송
    "전국",
    # 서울 세부
    "서울", "강남", "홍대", "이태원", "신촌", "명동", "종로", "압구정", "청담",
    "잠실", "건대", "신림", "영등포", "마포", "용산", "송파", "강서", "강동",
    "노원", "도봉", "중랑", "성북", "동대문", "성동", "광진", "서초", "관악",
    # 경기 세부
    "경기", "수원", "성남", "용인", "고양", "화성", "부천", "안산", "안양",
    "평택", "시흥", "파주", "김포", "광명", "군포", "오산", "이천", "양주",
    "의왕", "하남", "위례", "판교", "분당", "일산", "동탄",
    # 광역시
    "부산", "대구", "인천", "광주", "대전", "울산", "세종",
    # 도
    "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주",
    # 주요 도시
    "천안", "청주", "전주", "포항", "창원", "진주", "춘천", "원주", "강릉",
]


def _parse_channel(sns_type: str, wr_type: str) -> str:
    """SNS 타입과 캠페인 타입으로 채널 결정."""
    if sns_type and sns_type in SNS_TYPE_MAP:
        return SNS_TYPE_MAP[sns_type]

    # sns_type이 없으면 wr_type으로 판단
    if wr_type == "구매평":
        return "구매평"

    return "블로그"  # 기본값


def _extract_location(title: str) -> str | None:
    """제목에서 지역 정보 추출.

    예: "[레드버튼 성남모란] ..." → "성남"
    """
    # 대괄호 안의 내용 추출
    bracket_matches = re.findall(r"\[([^\]]+)\]", title)

    for match in bracket_matches:
        for keyword in LOCATION_KEYWORDS:
            if keyword in match:
                return keyword

    return None


def _clean_title(title: str) -> str:
    """제목에서 대괄호 태그 제거."""
    # [네이버 블로그], [쿠팡], [전국] 등 제거
    cleaned = re.sub(r"\[[^\]]+\]\s*", "", title).strip()
    return cleaned if cleaned else title


def _parse_campaign(item: dict) -> Campaign | None:
    """API 응답 아이템을 Campaign 객체로 변환."""
    try:
        # 필수 필드 확인
        link = item.get("link", "")
        raw_title = item.get("wr_subject", "")

        if not link or not raw_title:
            return None

        # URL 생성
        if link.startswith("/"):
            url = BASE_URL + link
        elif link.startswith("http"):
            url = link
        else:
            url = BASE_URL + "/" + link

        # 제목 정리
        title = _clean_title(clean_text(raw_title))
        if not title:
            return None

        # 카테고리
        category = item.get("ca_name") or None  # 제품, 서비스, 방문

        # 마감일 확인 (dday < 0 이면 이미 마감)
        dday = item.get("dday")
        if dday is not None and dday < 0:
            return None

        # 마감일: finday 또는 tr_recruit_finish 사용 (ISO 형식)
        # 예: "2025-12-15 23:59:59" → "2025-12-15"
        finday = item.get("finday") or item.get("tr_recruit_finish")
        if finday:
            # "2025-12-15 23:59:59" → "2025-12-15" (날짜만 추출)
            deadline = finday.split(" ")[0] if " " in finday else finday
        else:
            deadline = None

        # 이미지
        image_url = item.get("img") or None
        if image_url and not image_url.startswith("http"):
            if image_url.startswith("//"):
                image_url = "https:" + image_url
            elif image_url.startswith("/"):
                image_url = BASE_URL + image_url

        # 채널
        sns_type = item.get("sns_type", "")
        wr_type = item.get("wr_type", "")
        channel = _parse_channel(sns_type, wr_type)

        # 지역 (제목에서 추출)
        location = _extract_location(raw_title)

        # 타입 결정: API의 ca_name 기반
        # 제품 → delivery, 방문/서비스 → visit
        if category == "제품":
            campaign_type = "delivery"
            location = "배송"
        elif category in ["방문", "서비스"]:
            campaign_type = "visit"
        else:
            campaign_type = None  # utils.py에서 추론

        # 리뷰 등록 기간 (enroll_dday: 리뷰 마감까지 남은 일수)
        enroll_dday = item.get("enroll_dday")
        review_deadline_days = int(enroll_dday) if enroll_dday is not None else None

        return Campaign(
            title=title,
            url=url,
            site_name="stylec",
            category=category,
            deadline=deadline,
            location=location,
            image_url=image_url,
            channel=channel,
            type=campaign_type,
            review_deadline_days=review_deadline_days,
        )

    except Exception as e:
        logger.error("스타일씨 캠페인 파싱 오류: %s", e)
        return None


def _fetch_api(endpoint: str, params: dict = None) -> list:
    """API 호출 및 데이터 추출."""
    try:
        url = f"{API_HOST}{endpoint}"
        headers = {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
            "Accept": "application/json",
            "Referer": "https://www.stylec.co.kr/",
        }

        response = requests.get(url, headers=headers, params=params, timeout=30)
        response.raise_for_status()

        data = response.json()

        if not data.get("success"):
            logger.warning("스타일씨 API 실패: %s", data.get("message"))
            return []

        # 응답 구조에 따라 데이터 추출
        # /trial → data.data (배열)
        # /trial/popular → data (배열)
        result = data.get("data", [])

        if isinstance(result, dict):
            # /trial 엔드포인트의 경우
            return result.get("data", [])
        elif isinstance(result, list):
            # /trial/popular 엔드포인트의 경우
            return result

        return []

    except requests.RequestException as e:
        logger.error("스타일씨 API 요청 오류 (%s): %s", endpoint, e)
        return []
    except Exception as e:
        logger.error("스타일씨 API 처리 오류 (%s): %s", endpoint, e)
        return []


def crawl(max_pages: int = 50, include_closing: bool = False) -> List[Campaign]:
    """스타일씨 크롤링 - API 직접 호출 방식.

    여러 API 엔드포인트에서 데이터를 수집하여 통합합니다.

    Args:
        max_pages: 최대 페이지 수 (기본 50페이지)
        include_closing: 마감임박 캠페인 포함 여부 (기본 False)
    """
    logger.info("스타일씨 크롤링 시작 (API 방식, max_pages=%d)", max_pages)

    campaigns: List[Campaign] = []
    seen_urls: Set[str] = set()

    # 1. 인기 캠페인 조회
    popular_items = _fetch_api("/trial/popular")
    logger.info("스타일씨 인기 캠페인: %d개", len(popular_items))

    for item in popular_items:
        campaign = _parse_campaign(item)
        if campaign and campaign.url not in seen_urls:
            campaigns.append(campaign)
            seen_urls.add(campaign.url)

    # 2. 일반 캠페인 페이지별 조회 (마감되지 않은 것만)
    total_general = 0
    for page in range(1, max_pages + 1):
        general_items = _fetch_api("/trial", {"include_finish": "false", "page": page})

        if not general_items:
            logger.info("스타일씨 페이지 %d: 결과 없음, 중단", page)
            break

        new_count = 0
        for item in general_items:
            campaign = _parse_campaign(item)
            if campaign and campaign.url not in seen_urls:
                campaigns.append(campaign)
                seen_urls.add(campaign.url)
                new_count += 1

        total_general += len(general_items)

        # 새로운 캠페인이 없으면 중단 (중복 페이지)
        if new_count == 0:
            logger.info("스타일씨 페이지 %d: 새 캠페인 없음, 중단", page)
            break

        logger.info("스타일씨 페이지 %d: %d개 중 %d개 신규", page, len(general_items), new_count)

    logger.info("스타일씨 일반 캠페인 총: %d개 조회", total_general)

    # 3. 마감 임박 캠페인 조회 (선택적)
    if include_closing:
        closing_items = _fetch_api("/trial/closing-trials")
        logger.info("스타일씨 마감임박 캠페인: %d개", len(closing_items))

        for item in closing_items:
            campaign = _parse_campaign(item)
            if campaign and campaign.url not in seen_urls:
                campaigns.append(campaign)
                seen_urls.add(campaign.url)

    logger.info("스타일씨 총 %d개 캠페인 수집 완료", len(campaigns))

    return campaigns

import json
from datetime import datetime, timezone
from typing import List, Set

import requests
from bs4 import BeautifulSoup

from crawler.models import Campaign
from crawler.utils import clean_text, logger


def _calculate_dday(iso_date_str: str | None) -> str | None:
    """ISO 날짜 문자열을 조회 시점 기준 D-day 형식으로 변환.

    예: "2025-12-31T14:59:59.999Z" -> "D-5" (5일 남음)
    마감일이 지났으면 "D+1" 같은 형식으로 표시 (음수일 경우)
    """
    if not iso_date_str:
        return None

    try:
        # ISO 문자열을 datetime으로 파싱 (UTC 기준)
        deadline_dt = datetime.fromisoformat(iso_date_str.replace("Z", "+00:00"))
        # 현재 시점 (UTC 기준)
        now_dt = datetime.now(timezone.utc)

        # 날짜 차이 계산 (날짜만 비교, 시간은 무시)
        deadline_date = deadline_dt.date()
        now_date = now_dt.date()
        diff_days = (deadline_date - now_date).days

        if diff_days < 0:
            # 이미 마감된 경우
            return f"D+{abs(diff_days)}"
        elif diff_days == 0:
            # 오늘 마감
            return "D-0"
        else:
            # 남은 일수
            return f"D-{diff_days}"
    except (ValueError, AttributeError) as e:
        logger.warning("리뷰노트 날짜 파싱 실패: %s (원본: %s)", e, iso_date_str)
        return None


def _extract_campaigns_from_page_props(page_props: dict) -> list[Campaign]:
    """__NEXT_DATA__의 pageProps에서 캠페인 리스트 추출."""

    target_lists = ["premiums", "populars", "nearEnds", "recents"]
    campaigns: list[Campaign] = []
    seen_ids: Set[str] = set()

    for list_name in target_lists:
        items = page_props.get(list_name, [])
        logger.info("리뷰노트 '%s' 리스트에서 %d개 항목 발견", list_name, len(items))

        for item in items:
            source_id = str(item.get("id"))
            if not source_id or source_id in seen_ids:
                continue
            seen_ids.add(source_id)

            try:
                title = clean_text(item.get("title"))
                url = f"https://www.reviewnote.co.kr/campaigns/{source_id}"
                category = item.get("category", {}).get("title") or None
                location = (
                    f"{item.get('city', '')} {item.get('sido', {}).get('name', '')}".strip()
                    or None
                )
                
                # "제품" 카테고리거나 지역에 "배송"이 포함되면 "배송"으로 통일
                if category == "제품" or (location and "배송" in location):
                     location = "배송"
                # 리뷰노트 데이터에는 신청 마감일이 ISO 문자열로 포함되어 있음
                # 조회 시점 기준으로 D-day 형식으로 변환
                apply_end_at = item.get("applyEndAt")
                
                # 신청 마감일이 지났는지 확인
                if apply_end_at:
                    try:
                        from datetime import datetime as dt
                        deadline_dt = dt.fromisoformat(apply_end_at.replace("Z", "+00:00"))
                        now_dt = dt.now(timezone.utc)
                        if deadline_dt.date() < now_dt.date():
                            # 신청 마감됨 - 스킵
                            logger.debug("리뷰노트 캠페인 %s: 신청 마감됨 (%s), 스킵", source_id, apply_end_at)
                            continue
                    except (ValueError, AttributeError):
                        pass  # 날짜 파싱 실패 시 일단 포함
                
                deadline = _calculate_dday(apply_end_at)

                # 이미지 키가 있으면 Firebase Storage 경로로 메인 썸네일 URL 구성
                image_key = item.get("imageKey")
                if image_key:
                    # Firebase Storage URL 형식: imageKey의 "/"를 "%2F"로 인코딩
                    encoded_key = image_key.replace("/", "%2F")
                    image_url = (
                        f"https://firebasestorage.googleapis.com/v0/b/reviewnote-e92d9.appspot.com/o/{encoded_key}?alt=media"
                    )
                else:
                    image_url = None

                # 채널 정보 추출: 리뷰노트는 channel 필드에 직접 채널 정보가 있음
                # 예: "BLOG", "YOUTUBE", "REELS", "INSTAGRAM" 등
                channel_raw = item.get("channel")
                channel = None
                
                if channel_raw:
                    # 영어 채널명을 한국어로 변환
                    channel_map = {
                        "BLOG": "블로그",
                        "INSTAGRAM": "인스타",
                        "REELS": "릴스",
                        "YOUTUBE": "유튜브",
                        "SHORTS": "쇼츠",
                        "TIKTOK": "틱톡",
                        "CLIP": "클립",
                    }
                    channel_upper = str(channel_raw).upper()
                    channel = channel_map.get(channel_upper, channel_raw)
                
                # channel 필드가 없으면 기본값 "블로그"
                if not channel:
                    channel = "블로그"

                # 리뷰 기간 계산: reviewEndAt과 applyEndAt의 차이
                review_deadline_days = None
                try:
                    review_end_at = item.get("reviewEndAt")
                    if review_end_at and apply_end_at:
                        from datetime import datetime
                        review_end = datetime.fromisoformat(review_end_at.replace("Z", "+00:00"))
                        apply_end = datetime.fromisoformat(apply_end_at.replace("Z", "+00:00"))
                        # 리뷰 종료일 - 신청 마감일 = 대략적인 리뷰 기간
                        diff = (review_end - apply_end).days
                        if diff > 0:
                            review_deadline_days = diff
                except Exception as e:
                    logger.warning("리뷰노트 리뷰 기간 계산 실패: %s", e)

                # 카테고리 기반 캠페인 타입(Type) 추론
                campaign_type = None
                if category:
                    if category in ["맛집", "뷰티", "여행", "숙박", "문화"]:
                        campaign_type = "visit"
                    elif category in ["제품", "디지털", "생활", "식품", "도서", "유아동", "패션", "반려동물", "재택"]:
                        campaign_type = "delivery"
                    elif "기자단" in category or "기자단" in title:
                        campaign_type = "reporter"

                # location에 "배송"이 있으면 delivery로 강제 (단, 기자단 제외)
                if location == "배송" and campaign_type != "reporter":
                    campaign_type = "delivery"

                # 모집인원 및 신청자수 추출
                recruit_count = item.get("infNum")  # 모집인원
                applicant_count = item.get("applicantCount")  # 신청자수

                # 숫자 변환
                if recruit_count is not None:
                    try:
                        recruit_count = int(recruit_count)
                    except (ValueError, TypeError):
                        recruit_count = None

                if applicant_count is not None:
                    try:
                        applicant_count = int(applicant_count)
                    except (ValueError, TypeError):
                        applicant_count = None

                campaigns.append(
                    Campaign(
                        title=title,
                        url=url,
                        site_name="reviewnote",
                        category=category,
                        deadline=deadline,
                        location=location,
                        image_url=image_url,
                        channel=channel,
                        type=campaign_type,
                        review_deadline_days=review_deadline_days,
                        recruit_count=recruit_count,
                        applicant_count=applicant_count,
                    )
                )
            except Exception as e:  # pragma: no cover - 방어적 로깅
                logger.error("리뷰노트 항목 파싱 중 오류: %s", e)
                continue

    return campaigns


def crawl() -> List[Campaign]:
    """리뷰노트 크롤링 로직.

    공통 Campaign 스키마 리스트를 반환한다.
    """

    logger.info("리뷰노트 크롤링 시작")
    url = "https://www.reviewnote.co.kr/"
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/120.0.0.0 Safari/537.36"
        )
    }

    campaigns: list[Campaign] = []

    try:
        res = requests.get(url, headers=headers, timeout=10)
        res.raise_for_status()
        
        soup = BeautifulSoup(res.text, "html.parser")
        next_data = soup.find("script", id="__NEXT_DATA__")
        
        if not next_data or not next_data.string:
            logger.error("리뷰노트 __NEXT_DATA__ 스크립트를 찾을 수 없습니다.")
            return []

        data = json.loads(next_data.string)
        page_props = data.get("props", {}).get("pageProps", {})

        campaigns = _extract_campaigns_from_page_props(page_props)
        logger.info("리뷰노트 총 %d개의 고유 캠페인 수집", len(campaigns))

    except Exception as e:  # pragma: no cover - 네트워크 의존
        logger.error("리뷰노트 크롤링 중 치명적 오류: %s", e)
        return []
    
    logger.info("리뷰노트 크롤링 완료")
    return campaigns


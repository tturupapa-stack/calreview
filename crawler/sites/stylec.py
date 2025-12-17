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

# 카테고리 ID → 표준 카테고리 매핑
# tr_it_cate_id의 앞 3자리 또는 전체를 기준으로 매핑
CATEGORY_MAP = {
    # 제품 카테고리 (10xxxx)
    "101": "패션",       # 패션의류/잡화, 가방, 안경
    "102": "뷰티",       # 뷰티, 화장품, 클렌저
    "103": "반려동물",   # 반려동물용품
    "104": "디지털",     # 가전디지털, 프린터, 전자기기
    "105": "유아동",     # 출산/유아동
    "106": "식품",       # 식품
    "107": "도서",       # 도서/음반/DVD
    "109": "생활",       # 홈인테리어, 가구
    "110": "생활",       # 교육, 학습
    "112": "생활",       # 생활용품
    "111": "식품",       # 건강기능식품, 영양제
    "113": "생활",       # 기타 생활용품
    "114": "생활",       # 스포츠/레저 용품
    "116": "생활",       # 문구, 캐릭터
    "117": "생활",       # 사무용품
    "199": "생활",       # 기타 제품

    # 방문형 카테고리 (20xxxxxxx)
    "108": "생활",       # 차량용품
    "201": "맛집",       # 배달/편의점/맛집
    "202010": "뷰티",    # 뷰티 방문 (에스테틱 등)
    "202020": "맛집",    # 카페/식당 방문
    "202030": "맛집",    # 지역 맛집 방문 (의정부 등)
    "202040": "맛집",    # 지역 맛집 방문 (안양 등)
    "202070": "문화",    # 스튜디오/촬영
    "202080": "여행",    # 레저/테마파크
    "202100": "생활",    # 체험/놀이
    "202200": "맛집",    # 지역 맛집 (파주 등)
    "202240": "맛집",    # 지역 맛집 (동탄 등)
    "203": "맛집",       # 지역 방문 - 인천
    "204": "맛집",       # 지역 방문 - 광주
    "205": "뷰티",       # 지역 방문 - 대전 (살롱)
    "208": "여행",       # 지역 방문 - 강원 (캠핑/펜션)
    "209": "생활",       # 지역 방문 - 청주
    "213": "맛집",       # 지역 방문 - 전남
    "215": "생활",       # 지역 방문 - 경상
    "216": "맛집",       # 지역 방문 - 대구
    "217": "맛집",       # 지역 방문 - 부산
}

def _get_category_from_id(cate_id: str | int | None) -> str | None:
    """카테고리 ID로 표준 카테고리 결정."""
    if not cate_id:
        return None

    cate_str = str(cate_id)

    # 긴 prefix부터 먼저 매칭 시도 (더 구체적인 매핑 우선)
    for prefix_len in [6, 3]:
        prefix = cate_str[:prefix_len]
        if prefix in CATEGORY_MAP:
            return CATEGORY_MAP[prefix]

    return None

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
    "선릉", "역삼", "삼성", "논현", "신사", "가로수길", "합정", "상수", "망원",
    "마곡", "가산", "구로", "금천", "목동", "양천", "강북", "은평", "서대문",
    # 경기 세부
    "경기", "수원", "성남", "용인", "고양", "화성", "부천", "안산", "안양",
    "평택", "시흥", "파주", "김포", "광명", "군포", "오산", "이천", "양주",
    "의왕", "하남", "위례", "판교", "분당", "일산", "동탄", "동두천", "의정부",
    "남양주", "구리", "광주",
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
         "대구 도원센트럴 지점" → "대구"
    """
    # 1. 대괄호 안의 내용에서 먼저 추출 (우선순위 높음)
    bracket_matches = re.findall(r"\[([^\]]+)\]", title)

    for match in bracket_matches:
        for keyword in LOCATION_KEYWORDS:
            if keyword in match:
                return keyword

    # 2. 제목 전체에서 지역 키워드 검색 (대괄호 없는 경우)
    for keyword in LOCATION_KEYWORDS:
        if keyword in title:
            return keyword

    return None


def _clean_title(title: str) -> str:
    """제목에서 플랫폼/채널 태그만 제거 (상호명은 유지)."""
    # 제거할 태그 패턴 (플랫폼, 채널, 지역 등)
    remove_patterns = [
        r"\[네이버\s*블로그[^\]]*\]",  # [네이버 블로그], [네이버블로그/12월3주] 등
        r"\[네이버\s*클립[^\]]*\]",
        r"\[인스타그램[^\]]*\]",
        r"\[인스타\s*릴스[^\]]*\]",
        r"\[유튜브[^\]]*\]",
        r"\[유튜브\s*쇼츠[^\]]*\]",
        r"\[틱톡[^\]]*\]",
        r"\[쿠팡[^\]]*\]",  # [쿠팡], [쿠팡 리뷰], [쿠팡 구매평] 등
        r"\[스마트스토어[^\]]*\]",
        r"\[스스[^\]]*\]",
        r"\[blog[^\]]*\]",
        r"\[미션형\s*체험단[^\]]*\]",
        r"\[현금캐시백[^\]]*\]",
        r"\[현금페이백[^\]]*\]",
        r"\[푸드앳홈[^\]]*\]",
        r"\[방문\s*포장[^\]]*\]",
        r"\[1만캐시\s*지급[^\]]*\]",
    ]

    cleaned = title
    for pattern in remove_patterns:
        cleaned = re.sub(pattern, "", cleaned, flags=re.IGNORECASE)

    # 연속 공백 정리
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
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

        # 카테고리: tr_it_cate_id 기반으로 표준 카테고리 결정
        cate_id = item.get("tr_it_cate_id")
        category = _get_category_from_id(cate_id)

        # ca_name: 제품, 서비스, 방문, 기타 (타입 결정에 사용)
        ca_name = item.get("ca_name") or None

        # fallback: category ID 매핑 실패 시 ca_name을 raw category로 사용
        # utils.py의 normalize_category에서 키워드 기반으로 처리됨
        if category is None:
            category = ca_name

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
        if ca_name == "제품":
            campaign_type = "delivery"
            location = "배송"
        elif ca_name in ["방문", "서비스"]:
            campaign_type = "visit"
        else:
            campaign_type = None  # utils.py에서 추론

        # 리뷰 등록 기간 (enroll_dday: 리뷰 마감까지 남은 일수)
        enroll_dday = item.get("enroll_dday")
        review_deadline_days = int(enroll_dday) if enroll_dday is not None else None

        # 모집인원/신청자수 (당첨확률 계산용)
        recruit_max = item.get("tr_recruit_max")
        enroll_cnt = item.get("tr_enroll_cnt")
        recruit_count = int(recruit_max) if recruit_max is not None else None
        applicant_count = int(enroll_cnt) if enroll_cnt is not None else None

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
            recruit_count=recruit_count,
            applicant_count=applicant_count,
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

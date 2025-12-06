import os
import logging
from datetime import datetime
from typing import Optional, Sequence

from dotenv import load_dotenv
from supabase import Client, create_client

from crawler.models import Campaign

# 로컬 실행 시 사용할 .env.local 로드 (없어도 에러는 발생시키지 않음)
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env.local"))

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("Crawler")


def get_supabase_client() -> Optional[Client]:
    """Supabase 클라이언트 생성.

    Phase 2에서는 필수는 아니지만, 나중을 위해 헬퍼를 유지한다.
    환경 변수가 없으면 None을 반환하고 호출 측에서 처리하도록 한다.
    """

    url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    
    if not url or not key:
        logger.warning("Supabase 환경 변수가 설정되지 않았습니다. (로컬 크롤링만 수행)")
        return None
        
    try:
        return create_client(url, key)
    except Exception as e:  # pragma: no cover - 외부 의존성 예외
        logger.error(f"Supabase 연결 실패: {e}")
        return None


def clean_text(text: Optional[str]) -> str:
    """텍스트 공백 제거 및 정리."""
    if not text:
        return ""
    return " ".join(text.split())


def parse_date(date_str: Optional[str]) -> Optional[str]:
    """날짜 문자열 파싱 (YYYY-MM-DD).

    지금은 단순 패스스루 형태로 두고, 사이트별 정규화는 각 모듈에서 담당한다.
    공통 포맷으로 변환이 필요해지면 이 함수에 로직을 확장한다.
    """

    if not date_str:
        return None
    try:
        # 다양한 날짜 형식 처리 로직을 이후에 확장
        return date_str
    except Exception:
        return None


def iso_date(date: datetime) -> str:
    """datetime 객체를 ISO 날짜 문자열(YYYY-MM-DD)로 변환."""
    return date.strftime("%Y-%m-%d")


def _campaign_to_supabase_dict(campaign: Campaign) -> dict:
    """Campaign 모델을 Supabase campaigns 테이블 스키마에 맞게 변환."""
    # source_id는 URL에서 ID 추출 시도, 없으면 해시 사용
    import hashlib
    import re
    
    source_id = None
    # 사이트별 URL 패턴으로 ID 추출
    if campaign.site_name == "reviewnote":
        # https://www.reviewnote.co.kr/campaign/985180
        match = re.search(r'/campaign/(\d+)', campaign.url)
        if match:
            source_id = match.group(1)
    elif campaign.site_name == "dinnerqueen":
        # https://dinnerqueen.net/taste/1108661
        match = re.search(r'/taste/(\d+)', campaign.url)
        if match:
            source_id = match.group(1)
    elif campaign.site_name == "gangnam":
        # https://xn--939au0g4vj8sq.net/cp/?id=1985492
        match = re.search(r'[?&]id=(\d+)', campaign.url)
        if match:
            source_id = match.group(1)
    elif campaign.site_name == "reviewplace":
        # https://www.reviewplace.co.kr/pr/?id=256150
        match = re.search(r'[?&]id=(\d+)', campaign.url)
        if match:
            source_id = match.group(1)
    
    # ID를 찾을 수 없으면 URL 해시 사용
    if not source_id:
        source_id = hashlib.md5(campaign.url.encode()).hexdigest()[:16]
    
    # deadline 문자열을 application_deadline으로 파싱 시도
    application_deadline = None
    if campaign.deadline:
        # "D-5" 형식을 날짜로 변환 (현재 날짜 기준)
        import re
        match = re.match(r"D[-\s]*(\d+)", campaign.deadline)
        if match:
            from datetime import datetime, timedelta
            days = int(match.group(1))
            deadline_dt = datetime.now() + timedelta(days=days)
            application_deadline = deadline_dt.strftime("%Y-%m-%dT%H:%M:%S")
        # ISO 형식이면 그대로 사용
        elif re.match(r"\d{4}-\d{2}-\d{2}", campaign.deadline):
            application_deadline = campaign.deadline
    
    # type 필드 매핑 (category나 다른 정보에서 추론)
    campaign_type = None
    if campaign.location == "배송":
        campaign_type = "delivery"
    elif campaign.category == "맛집" and campaign.location and "배송" not in campaign.location:
        campaign_type = "visit"
    
    return {
        "source": campaign.site_name,
        "source_id": source_id,
        "source_url": campaign.url,
        "title": campaign.title,
        "description": None,  # 크롤러에서는 아직 추출하지 않음
        "thumbnail_url": campaign.image_url,
        "category": campaign.category,
        "region": campaign.location,  # location을 region에 저장
        "type": campaign_type,
        "channel": campaign.channel,  # 채널 정보 저장
        "reward": None,
        "reward_value": None,
        "capacity": None,
        "application_deadline": application_deadline,
        "review_deadline_days": campaign.review_deadline_days,  # 리뷰 기간 저장
        "is_active": True,
    }


def save_campaigns_to_supabase(campaigns: Sequence[Campaign]) -> None:
    """캠페인 리스트를 Supabase에 저장하는 헬퍼.

    Phase 4에서 구현: campaigns 테이블에 upsert 수행.
    """

    if not campaigns:
        logger.info("Supabase 저장 건너뜀: 저장할 캠페인 없음")
        return

    client = get_supabase_client()
    if client is None:
        logger.info("Supabase 클라이언트 없음: 로컬 크롤링만 수행 (저장 생략)")
        return

    try:
        # Campaign을 Supabase 스키마로 변환
        supabase_campaigns = [_campaign_to_supabase_dict(c) for c in campaigns]
        
        # 중복 제거: (source, source_id) 조합이 같은 것은 하나만 유지
        seen = set()
        unique_campaigns = []
        for camp in supabase_campaigns:
            key = (camp["source"], camp["source_id"])
            if key not in seen:
                seen.add(key)
                unique_campaigns.append(camp)
            else:
                logger.debug("중복 캠페인 제거: %s - %s", camp["source"], camp["title"])
        
        logger.info("중복 제거: %d개 -> %d개", len(supabase_campaigns), len(unique_campaigns))
        
        # upsert 수행 (source + source_id가 unique이므로 중복 자동 처리)
        result = client.table("campaigns").upsert(
            unique_campaigns,
            on_conflict="source,source_id"
        ).execute()
        
        logger.info(
            "Supabase 저장 완료: %d개 캠페인 upsert됨",
            len(unique_campaigns)
        )
    except Exception as e:
        logger.error("Supabase 저장 중 오류 발생: %s", e)
        raise



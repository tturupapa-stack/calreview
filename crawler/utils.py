import os
import logging
from datetime import datetime
from typing import Optional, Sequence

from dotenv import load_dotenv
from supabase import Client, create_client

from crawler.models import Campaign
from crawler.category import normalize_category
from crawler.region import normalize_region

# 로컬 실행 시 사용할 .env 파일 로드 (여러 경로 시도)
# 1. 프로젝트 루트의 .env.local
# 2. 프로젝트 루트의 .env
# 3. 현재 디렉토리의 .env
project_root = os.path.join(os.path.dirname(__file__), "..")
env_paths = [
    os.path.join(project_root, ".env.local"),
    os.path.join(project_root, ".env"),
    os.path.join(os.getcwd(), ".env.local"),
    os.path.join(os.getcwd(), ".env"),
]

for env_path in env_paths:
    if os.path.exists(env_path):
        load_dotenv(env_path, override=False)  # override=False: 이미 설정된 변수는 덮어쓰지 않음
        break

# 로깅 설정
import sys
log_dir = os.path.join(os.path.dirname(__file__), "..", "crawler", "logs")
os.makedirs(log_dir, exist_ok=True)
log_file = os.path.join(log_dir, f"crawler_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log")

# 기존 핸들러가 있으면 제거 (중복 방지)
root_logger = logging.getLogger()
if root_logger.handlers:
    root_logger.handlers.clear()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler(log_file, encoding='utf-8'),
        logging.StreamHandler(sys.stdout)  # 콘솔에도 출력
    ],
    force=True  # 기존 설정 덮어쓰기
)
logger = logging.getLogger("Crawler")
logger.info("크롤러 로그 파일: %s", log_file)


def get_supabase_client() -> Optional[Client]:
    """Supabase 클라이언트 생성.

    Phase 2에서는 필수는 아니지만, 나중을 위해 헬퍼를 유지한다.
    환경 변수가 없으면 None을 반환하고 호출 측에서 처리하도록 한다.
    """

    url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    
    if not url or not key:
        logger.warning("Supabase 환경 변수가 설정되지 않았습니다. (로컬 크롤링만 수행)")
        if not url:
            logger.warning("  - NEXT_PUBLIC_SUPABASE_URL가 설정되지 않았습니다.")
        if not key:
            logger.warning("  - SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다.")
            logger.warning("    Supabase Dashboard > Settings > API에서 service_role key를 복사하여")
            logger.warning("    .env.local 파일에 설정하세요. (자세한 가이드: docs/SUPABASE_API_KEY_SETUP.md)")
        return None
    
    # placeholder 값 체크
    placeholder_patterns = [
        "your_supabase_service_role_key",
        "your_supabase_project_url",
        "your-",
        "placeholder",
    ]
    
    if any(pattern in key for pattern in placeholder_patterns):
        logger.error("SUPABASE_SERVICE_ROLE_KEY가 placeholder 값입니다!")
        logger.error("Supabase Dashboard > Settings > API에서 실제 service_role key를 복사하여")
        logger.error(".env.local 파일에 설정하세요. (자세한 가이드: docs/SUPABASE_API_KEY_SETUP.md)")
        return None
    
    if len(key) < 100:
        logger.warning("SUPABASE_SERVICE_ROLE_KEY가 너무 짧습니다 (길이: %d자).", len(key))
        logger.warning("실제 service_role key는 200자 이상의 JWT 토큰입니다.")
        logger.warning("Supabase Dashboard에서 올바른 키를 확인하세요.")
        return None
        
    try:
        client = create_client(url, key)
        # 연결 테스트 (간단한 쿼리)
        try:
            client.table("campaigns").select("id").limit(1).execute()
            logger.debug("Supabase 연결 성공")
        except Exception as test_e:
            logger.warning("Supabase 연결 테스트 실패: %s", test_e)
            logger.warning("API 키가 올바른지 확인하세요.")
        return client
    except Exception as e:  # pragma: no cover - 외부 의존성 예외
        logger.error(f"Supabase 연결 실패: {e}")
        logger.error("URL과 API 키를 확인하세요.")
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
        # https://www.reviewnote.co.kr/campaigns/985180
        match = re.search(r'/campaigns?/(\d+)', campaign.url)
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
    elif campaign.site_name == "chuble":
        # https://chuble.net/detail.php?number=4839
        match = re.search(r'[?&]number=(\d+)', campaign.url)
        if match:
            source_id = match.group(1)
    elif campaign.site_name == "dinodan":
        # https://dinodan.co.kr/detail.php?number=xxx&category=xxx
        match = re.search(r'[?&]number=(\d+)', campaign.url)
        if match:
            source_id = match.group(1)
    elif campaign.site_name == "stylec":
        # https://www.stylec.co.kr/campaign/12345 또는 ?seq=12345
        match = re.search(r'/campaign/(\d+)', campaign.url) or re.search(r'[?&]seq=(\d+)', campaign.url)
        if match:
            source_id = match.group(1)
    elif campaign.site_name == "modan":
        # https://www.modan.kr/lodging/?idx=2167
        match = re.search(r'[?&]idx=(\d+)', campaign.url)
        if match:
            source_id = match.group(1)
    elif campaign.site_name == "real_review":
        # https://www.real-review.kr/campaign/12345
        match = re.search(r'/campaign/(\d+)', campaign.url) or re.search(r'[?&]id=(\d+)', campaign.url)
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
    
    # 표준 카테고리 정규화 적용
    std_category = normalize_category(campaign.site_name, campaign.category, campaign.title)
    
    # 지역명 정규화 적용
    std_region = normalize_region(campaign.location)

    # type 필드 매핑
    campaign_type = None
    # 0. 기자단 키워드 (최우선 - 크롤러가 방문형으로 잘못 분류한 경우 수정)
    if "기자단" in campaign.title:
        campaign_type = "reporter"
    # 1. 크롤러가 명시적으로 타입을 지정한 경우 우선 사용 (stylec 등 API 기반 사이트)
    elif campaign.type:
        campaign_type = campaign.type
    # 2. 강력한 카테고리 기반 강제 (크롤러가 타입을 지정하지 않은 경우)
    elif std_category in ["디지털", "식품", "도서", "유아동", "패션", "반려동물", "배송", "재택"]:
        campaign_type = "delivery"
    # 2.5 지역 기반 강력 강제 (전국/배송/재택 등은 무조건 배송형)
    elif std_region in ["배송", "재택", "전국"] or campaign.location in ["배송", "재택", "전국"]:
        campaign_type = "delivery"
    # 3. 타입이 없는 경우 추론
    else:
        # 지역명 기반 추론 ('전국'도 배송형으로 간주)
        if std_region in ["배송", "재택", "전국"] or campaign.location in ["배송", "재택", "전국"]:
            campaign_type = "delivery"
        # 생활 카테고리는 지역 유무로 판단
        elif std_category == "생활":
            if not std_region or std_region in ["배송", "재택", "전국"]:
                campaign_type = "delivery"
            else:
                campaign_type = "visit"
        # 나머지 방문형 카테고리
        elif std_category in ["맛집", "뷰티", "여행", "문화"]:
            campaign_type = "visit"
        else:
            campaign_type = None
    
    # 선택률 계산 (신청자수가 있을 때만)
    # 선택률은 최대 100%로 제한 (모집인원 > 신청자수인 경우)
    selection_rate = None
    if campaign.recruit_count and campaign.applicant_count and campaign.applicant_count > 0:
        rate = (campaign.recruit_count / campaign.applicant_count) * 100
        selection_rate = round(min(rate, 100), 2)  # 최대 100%로 제한

    return {
        "source": campaign.site_name,
        "source_id": source_id,
        "title": campaign.title,
        "description": "",  # 상세 설명은 별도 크롤링 필요
        "source_url": campaign.url,
        "thumbnail_url": campaign.image_url,
        "category": std_category,  # 정규화된 카테고리 저장
        "region": std_region,  # 정규화된 지역명 저장
        "type": campaign_type,
        "channel": campaign.channel,  # 채널 정보 저장
        "reward": None,
        "reward_value": None,
        "capacity": None,
        "application_deadline": application_deadline,
        "review_deadline_days": campaign.review_deadline_days,  # 리뷰 기간 저장
        "recruit_count": campaign.recruit_count,  # 모집인원
        "applicant_count": campaign.applicant_count,  # 신청자수
        "selection_rate": selection_rate,  # 선택률 (%)
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



def get_existing_source_ids() -> set:
    """Return a set of (source, source_id) tuples already stored in Supabase.
    Used for incremental crawling to skip duplicates.
    """
    client = get_supabase_client()
    if client is None:
        return set()
    try:
        res = client.table("campaigns").select("source,source_id").execute()
        data = res.data or []
        return {(item["source"], item["source_id"]) for item in data}
    except Exception as e:
        logger.error(f"Failed to fetch existing source IDs: {e}")
        return set()

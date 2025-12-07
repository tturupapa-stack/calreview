import importlib
import json
import os
from datetime import datetime, timezone
from typing import Dict, List

from crawler.models import Campaign
from crawler.utils import logger, save_campaigns_to_supabase

# 크롤링할 사이트 모듈 목록
# 레뷰(revu)는 목록 열람 시 로그인이 필요하므로 현재는 제외
SITES = [
    "reviewnote",
    "dinnerqueen",
    "gangnam",
    "reviewplace",
    "seoulouba",
    "modooexperience",
    "pavlovu",
]


def run_crawler(site_name: str) -> List[Campaign]:
    """특정 사이트 크롤러 실행 후 Campaign 리스트 반환."""

    try:
        logger.info("[%s] 크롤링 시작...", site_name)
        module = importlib.import_module(f"crawler.sites.{site_name}")
        if hasattr(module, "crawl"):
            campaigns = module.crawl()
            logger.info("[%s] 크롤링 완료 - %d개 수집", site_name, len(campaigns))
            return campaigns
        else:
            logger.error("[%s] crawl 함수를 찾을 수 없습니다.", site_name)
    except ImportError:
        logger.error("[%s] 모듈을 찾을 수 없습니다.", site_name)
    except Exception as e:
        logger.error("[%s] 크롤링 중 오류 발생: %s", site_name, e)

    return []


def _campaign_to_dict(c: Campaign) -> Dict:
    """Campaign dataclass를 JSON 직렬화 가능한 dict로 변환."""

    return {
        "title": c.title,
        "url": c.url,
        "site_name": c.site_name,
        "category": c.category,
        "deadline": c.deadline,
        "location": c.location,
        "image_url": c.image_url,
        "channel": c.channel,
        "type": c.type,
        "review_deadline_days": c.review_deadline_days,
    }


def cleanup_expired_campaigns() -> None:
    """마감된 캠페인을 is_active=false로 업데이트."""
    try:
        from dotenv import load_dotenv
        from supabase import create_client
        
        load_dotenv()
        supabase_url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        
        if not supabase_url or not supabase_key:
            logger.warning("Supabase 환경 변수가 없어 마감 캠페인 정리를 건너뜁니다.")
            return
        
        supabase = create_client(supabase_url, supabase_key)
        today = datetime.now(timezone.utc).date().isoformat()
        
        # 리뷰노트 캠페인 중 마감된 것 조회
        response = supabase.table("campaigns")\
            .select("id")\
            .eq("source", "reviewnote")\
            .eq("is_active", True)\
            .lt("application_deadline", today)\
            .execute()
        
        expired_count = len(response.data) if response.data else 0
        
        if expired_count > 0:
            # 일괄 업데이트
            for campaign in response.data:
                supabase.table("campaigns")\
                    .update({"is_active": False})\
                    .eq("id", campaign["id"])\
                    .execute()
            
            logger.info("마감된 캠페인 %d개 비활성화 완료", expired_count)
        else:
            logger.info("마감된 캠페인 없음")
            
    except Exception as e:
        logger.warning("마감 캠페인 정리 중 오류 (무시하고 계속): %s", e)


def main(save_json: bool = True) -> None:
    """전체 크롤러 실행.

    각 사이트 크롤링 결과를 모아 필요 시 JSON 파일로 저장한다.
    """

    logger.info("=== 전체 크롤링 시작 ===")
    
    # 마감된 캠페인 정리
    cleanup_expired_campaigns()
    
    all_campaigns: List[Campaign] = []

    for site in SITES:
        campaigns = run_crawler(site)
        all_campaigns.extend(campaigns)

    logger.info("전체 사이트 합계: %d개 캠페인 수집", len(all_campaigns))

    # Supabase에 저장
    if all_campaigns:
        try:
            save_campaigns_to_supabase(all_campaigns)
        except Exception as e:
            logger.error("Supabase 저장 실패: %s", e)
            logger.info("JSON 저장은 계속 진행합니다...")

    if save_json and all_campaigns:
        # output 디렉터리 생성
        output_dir = os.path.join(os.path.dirname(__file__), "output")
        os.makedirs(output_dir, exist_ok=True)

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_path = os.path.join(output_dir, f"campaigns_{timestamp}.json")

        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(
                [_campaign_to_dict(c) for c in all_campaigns],
                f,
                ensure_ascii=False,
                indent=2,
            )

        logger.info("크롤링 결과 JSON 저장 완료: %s", output_path)

    logger.info("=== 전체 크롤링 종료 ===")


if __name__ == "__main__":
    main()


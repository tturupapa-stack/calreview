import importlib
import json
import os
import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from typing import Dict, List

from crawler.models import Campaign
from crawler.utils import logger, save_campaigns_to_supabase, get_existing_source_ids, _campaign_to_supabase_dict

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


def main(save_json: bool = True, mode: str = "auto") -> None:
    """
    전체 크롤러 실행.

    `mode` 옵션:
    - "auto": campaigns 테이블이 비어있으면 "full", 아니면 "incremental"
    - "full": 모든 페이지를 크롤링
    - "incremental": 이미 Supabase에 존재하는 캠페인은 건너뜀
    """

    # auto 모드: campaigns 테이블 상태에 따라 자동 결정
    if mode == "auto":
        existing_ids = get_existing_source_ids()
        if len(existing_ids) == 0:
            mode = "full"
            logger.info("campaigns 테이블이 비어있음 -> full 모드로 실행")
        else:
            mode = "incremental"
            logger.info("campaigns 테이블에 %d개 캠페인 존재 -> incremental 모드로 실행", len(existing_ids))

    logger.info("=== 전체 크롤링 시작 (mode=%s) ===", mode)
    
    # 마감된 캠페인 정리
    cleanup_expired_campaigns()
    
    all_campaigns: List[Campaign] = []

    for site in SITES:
        campaigns = run_crawler(site)
        all_campaigns.extend(campaigns)

    logger.info("전체 사이트 합계: %d개 캠페인 수집", len(all_campaigns))

    # 차등 크롤링: 기존 ID와 겹치는 캠페인 제거
    if mode == "incremental":
        existing_ids = get_existing_source_ids()
        before = len(all_campaigns)
        all_campaigns = [c for c in all_campaigns if (c.site_name, _campaign_to_supabase_dict(c)["source_id"]) not in existing_ids]
        logger.info("차등 필터링: %d -> %d (새로운 캠페인 %d개)", before, len(all_campaigns), len(all_campaigns))

    # 배치 처리: 리뷰 기간이 없는 캠페인들의 상세 페이지 크롤링
    # 병렬 처리 워커 수 증가 (더 빠른 처리)
    all_campaigns = enrich_review_deadlines_batch(all_campaigns, max_workers=10)

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


def enrich_review_deadlines_batch(campaigns: List[Campaign], max_workers: int = 5) -> List[Campaign]:
    """리뷰 기간이 없는 캠페인들의 상세 페이지를 배치로 크롤링하여 리뷰 기간 정보를 추가.
    
    Args:
        campaigns: 리뷰 기간 정보를 추가할 캠페인 리스트
        max_workers: 병렬 처리할 최대 워커 수
    
    Returns:
        리뷰 기간 정보가 추가된 캠페인 리스트
    """
    from crawler.utils_detail import extract_detail_info
    
    # 리뷰 기간이 없는 캠페인만 필터링
    campaigns_to_enrich = [c for c in campaigns if c.review_deadline_days is None]
    
    if not campaigns_to_enrich:
        logger.info("리뷰 기간 정보가 필요한 캠페인이 없습니다.")
        return campaigns
    
    logger.info("리뷰 기간 정보 추가를 위해 %d개 캠페인의 상세 페이지 크롤링 시작...", len(campaigns_to_enrich))
    
    def enrich_single_campaign(campaign: Campaign) -> tuple[Campaign, bool]:
        """단일 캠페인의 리뷰 기간 정보를 추가."""
        try:
            info = extract_detail_info(campaign.url, campaign.site_name)
            review_deadline_days = info.get("review_deadline_days")
            
            if review_deadline_days:
                # Campaign 객체는 불변(immutable)이므로 새 객체 생성
                return Campaign(
                    title=campaign.title,
                    url=campaign.url,
                    site_name=campaign.site_name,
                    category=campaign.category,
                    deadline=campaign.deadline,
                    location=campaign.location,
                    image_url=campaign.image_url,
                    channel=campaign.channel,
                    type=campaign.type,
                    review_deadline_days=review_deadline_days,
                ), True
            else:
                return campaign, False
        except Exception as e:
            logger.warning("[%s] 리뷰 기간 정보 추가 실패: %s (URL: %s)", campaign.site_name, e, campaign.url)
            return campaign, False
    
    # 캠페인을 URL로 인덱싱하여 빠른 조회 가능하도록
    campaign_dict = {c.url: c for c in campaigns}
    enriched_count = 0
    
    # 병렬 처리로 상세 페이지 크롤링
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        future_to_campaign = {
            executor.submit(enrich_single_campaign, c): c 
            for c in campaigns_to_enrich
        }
        
        for future in as_completed(future_to_campaign):
            campaign = future_to_campaign[future]
            try:
                enriched_campaign, success = future.result()
                campaign_dict[enriched_campaign.url] = enriched_campaign
                if success:
                    enriched_count += 1
            except Exception as e:
                logger.warning("[%s] 리뷰 기간 정보 추가 중 예외 발생: %s", campaign.site_name, e)
    
    logger.info("리뷰 기간 정보 추가 완료: %d/%d개 성공", enriched_count, len(campaigns_to_enrich))
    
    # 원래 순서 유지하면서 업데이트된 캠페인 반환
    return [campaign_dict.get(c.url, c) for c in campaigns]


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run crawler")
    parser.add_argument("--mode", choices=["auto", "full", "incremental"], default="auto",
                        help="auto: auto-detect (full if empty, incremental if not); full: crawl all pages; incremental: skip already stored campaigns")
    args = parser.parse_args()
    main(save_json=True, mode=args.mode)

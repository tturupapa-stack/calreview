"""테스트 중이 아닌 새 사이트들의 캠페인을 숨김 처리하는 스크립트.

실행 방법:
    python3 -m crawler.scripts.hide_test_sites
"""

import os
import sys
from dotenv import load_dotenv
from supabase import create_client

# 상위 디렉토리를 경로에 추가
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from crawler.utils import logger

# 테스트 중인 사이트 (활성화 유지)
TESTING_SITES = [
    # 새 사이트 테스트 시 여기에 추가
]

# 비활성화할 새 사이트 목록
NEW_SITES_TO_HIDE = [
    "stylec",          # 스타일씨 - ✅ 점검 완료
    "modan",           # 모두의체험단 - ✅ 점검 완료
    "chuble",          # 츄블 - ✅ 점검 완료
    "dinodan",         # 디노단 - ✅ 점검 완료
    "real_review",     # 리얼리뷰 - ✅ 점검 완료
    "myinfluencer",    # 운영 중단
]

# 리스크가 높아 크롤링을 중단한 사이트 목록
RISKY_SITES = [
    "reviewnote",      # robots.txt: /campaigns/ 금지
    "reviewplace",     # robots.txt: /pr 금지
    "seoulouba",       # robots.txt: 전체 금지 (루트만 허용)
    "modooexperience", # robots.txt: /campaign.php 금지
]

# 대체된 사이트 목록
REPLACED_SITES = [
    "gangnam",         # 대체됨
    "pavlovu",         # 대체됨
]

# 모든 비활성화 대상 사이트
ALL_SITES_TO_HIDE = NEW_SITES_TO_HIDE + RISKY_SITES + REPLACED_SITES


def hide_campaigns():
    """테스트 중이 아닌 사이트들의 캠페인을 is_active=false로 업데이트."""
    
    # 환경 변수 로드
    env_path = os.path.join(os.path.dirname(__file__), "..", "..", ".env.local")
    if not os.path.exists(env_path):
        env_path = os.path.join(os.path.dirname(__file__), "..", "..", ".env")
    
    load_dotenv(env_path)
    
    supabase_url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    if not supabase_url or not supabase_key:
        logger.error("Supabase 환경 변수가 설정되지 않았습니다.")
        logger.error("NEXT_PUBLIC_SUPABASE_URL와 SUPABASE_SERVICE_ROLE_KEY를 확인해주세요.")
        return
    
    try:
        supabase = create_client(supabase_url, supabase_key)
        
        total_hidden = 0
        
        for site in ALL_SITES_TO_HIDE:
            # 해당 사이트의 활성화된 캠페인 조회
            response = supabase.table("campaigns")\
                .select("id, title")\
                .eq("source", site)\
                .eq("is_active", True)\
                .execute()
            
            campaigns = response.data or []
            count = len(campaigns)
            
            if count > 0:
                # 일괄 업데이트
                update_response = supabase.table("campaigns")\
                    .update({"is_active": False})\
                    .eq("source", site)\
                    .eq("is_active", True)\
                    .execute()
                
                logger.info("[%s] %d개 캠페인 숨김 처리 완료", site, count)
                total_hidden += count
                
                # 샘플로 몇 개 제목 출력
                for i, campaign in enumerate(campaigns[:3]):
                    logger.info("  - %s", campaign.get("title", "제목 없음"))
                if count > 3:
                    logger.info("  ... 외 %d개", count - 3)
            else:
                logger.info("[%s] 숨김 처리할 활성 캠페인 없음", site)
        
        logger.info("=" * 50)
        logger.info("총 %d개 캠페인 숨김 처리 완료", total_hidden)
        logger.info("테스트 중인 사이트: %s", ", ".join(TESTING_SITES))
        logger.info("=" * 50)
        
    except Exception as e:
        logger.error("숨김 처리 중 오류 발생: %s", e)
        raise


if __name__ == "__main__":
    hide_campaigns()

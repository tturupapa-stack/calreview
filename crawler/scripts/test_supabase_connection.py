#!/usr/bin/env python3
"""Supabase 연결 테스트 스크립트"""

import os
import sys
from pathlib import Path

# 프로젝트 루트로 경로 추가
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from dotenv import load_dotenv
from supabase import create_client

# .env.local 파일 로드
env_file = project_root / ".env.local"
load_dotenv(env_file)

print("=" * 60)
print("Supabase 연결 테스트")
print("=" * 60)

url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not url or not key:
    print("❌ 환경 변수가 설정되지 않았습니다.")
    sys.exit(1)

try:
    print(f"\n1. 클라이언트 생성 중...")
    client = create_client(url, key)
    print("   ✅ 클라이언트 생성 성공")
    
    print(f"\n2. campaigns 테이블 쿼리 테스트...")
    result = client.table("campaigns").select("id").limit(1).execute()
    print(f"   ✅ 쿼리 성공! ({len(result.data)}개 행 반환)")
    
    print(f"\n3. 전체 campaigns 개수 확인...")
    count_result = client.table("campaigns").select("id", count="exact").limit(1).execute()
    print(f"   ✅ 총 {count_result.count}개 캠페인 존재")
    
    print("\n" + "=" * 60)
    print("✅ Supabase 연결이 정상적으로 작동합니다!")
    print("=" * 60)
    
except Exception as e:
    print(f"\n❌ Supabase 연결 실패: {e}")
    print("=" * 60)
    sys.exit(1)

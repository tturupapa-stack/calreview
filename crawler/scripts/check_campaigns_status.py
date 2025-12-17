#!/usr/bin/env python3
"""캠페인 저장 현황 확인 스크립트"""

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

url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not url or not key:
    print("❌ 환경 변수가 설정되지 않았습니다.")
    sys.exit(1)

client = create_client(url, key)

print("=" * 60)
print("전체 캠페인 현황")
print("=" * 60)

sources = [
    'dinnerqueen', 
    'stylec', 
    'reviewnote', 
    'revu', 
    'gangnam', 
    'reviewplace', 
    'seoulouba', 
    'modooexperience', 
    'pavlovu'
]

total = 0
for source in sources:
    result = client.table('campaigns').select('id', count='exact').eq('source', source).execute()
    active = client.table('campaigns').select('id', count='exact').eq('source', source).eq('is_active', True).execute()
    count = result.count
    active_count = active.count
    total += count
    status = "✅" if active_count > 0 else "⏸️"
    print(f"{status} {source:20s}: {count:4d}개 (활성: {active_count:4d}개)")

print("-" * 60)
print(f"총합: {total}개 캠페인")
print("=" * 60)

# 스타일씨 상세 확인
print("\n" + "=" * 60)
print("스타일씨 캠페인 상세")
print("=" * 60)
stylec_result = client.table('campaigns').select('id', count='exact').eq('source', 'stylec').execute()
stylec_active = client.table('campaigns').select('id', count='exact').eq('source', 'stylec').eq('is_active', True).execute()
print(f"✅ 스타일씨 총 캠페인: {stylec_result.count}개")
print(f"✅ 활성화된 캠페인: {stylec_active.count}개")
print("=" * 60)

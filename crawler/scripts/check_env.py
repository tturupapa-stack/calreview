#!/usr/bin/env python3
"""Supabase 환경 변수 확인 스크립트"""

import os
import sys
from pathlib import Path

# 프로젝트 루트로 경로 추가
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from dotenv import load_dotenv

# .env.local 파일 로드
env_file = project_root / ".env.local"
load_dotenv(env_file)

print("=" * 60)
print("Supabase 환경 변수 확인")
print("=" * 60)

url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

print(f"\n1. NEXT_PUBLIC_SUPABASE_URL:")
if url and url != "your_supabase_project_url" and url.startswith("https://"):
    print(f"   상태: ✅ 설정됨")
    print(f"   값: {url[:50]}...")
else:
    print(f"   상태: ❌ 설정 안됨")
    print(f"   값: {url if url else '없음'}")

print(f"\n2. SUPABASE_SERVICE_ROLE_KEY:")
if key and len(key) > 100:
    print(f"   상태: ✅ 설정됨 (길이: {len(key)}자)")
    print(f"   값: {key[:30]}...{key[-10:]}")
elif key and len(key) < 50:
    print(f"   상태: ⚠️  placeholder 값일 가능성 (길이: {len(key)}자)")
    print(f"   값: {key}")
else:
    print(f"   상태: ❌ 설정 안됨")
    print(f"   값: 없음")

print("\n" + "=" * 60)
print("다음 단계:")
if not key or len(key) < 100:
    print("1. Supabase Dashboard 접속: https://supabase.com/dashboard")
    print("2. Settings > API 메뉴로 이동")
    print("3. service_role key 복사 (⚠️ anon key가 아님!)")
    print("4. .env.local 파일에 SUPABASE_SERVICE_ROLE_KEY 설정")
    print("5. 자세한 가이드: docs/SUPABASE_API_KEY_SETUP.md")
else:
    print("✅ 환경 변수가 정상적으로 설정되었습니다!")
    print("크롤러를 실행하여 테스트하세요.")
print("=" * 60)

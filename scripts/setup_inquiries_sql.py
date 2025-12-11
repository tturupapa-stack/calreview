#!/usr/bin/env python3
"""문의하기 기능을 위한 Supabase SQL 실행 스크립트

이 스크립트는 Supabase REST API를 통해 SQL을 실행합니다.
참고: Supabase는 일반적으로 직접 SQL 실행을 지원하지 않으므로,
이 스크립트는 SQL을 Supabase Dashboard에 자동으로 제출하는 것을 시도합니다.

실제로는 Supabase Dashboard에서 수동으로 실행해야 합니다.
"""

import os
import sys
import requests
from dotenv import load_dotenv
from supabase import create_client

load_dotenv(".env.local")

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    print("❌ 환경 변수가 설정되지 않았습니다.")
    sys.exit(1)

# SQL 파일 읽기
sql_file_path = os.path.join(os.path.dirname(__file__), "..", "docs", "supabase-inquiries.sql")
if not os.path.exists(sql_file_path):
    print(f"❌ SQL 파일을 찾을 수 없습니다: {sql_file_path}")
    sys.exit(1)

with open(sql_file_path, "r", encoding="utf-8") as f:
    sql_content = f.read()

print("=" * 60)
print("문의하기 기능 SQL 실행")
print("=" * 60)

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

# 테이블이 이미 존재하는지 확인
try:
    result = supabase.table("inquiries").select("id").limit(1).execute()
    print("✓ 'inquiries' 테이블이 이미 존재합니다.")
    print("설정이 완료되었습니다!")
    sys.exit(0)
except Exception as e:
    error_msg = str(e)
    if "PGRST205" in error_msg or "does not exist" in error_msg.lower() or "not found" in error_msg.lower():
        print("⚠ 'inquiries' 테이블이 존재하지 않습니다.")
        print("\nSQL을 실행해야 합니다.")
        print("\n" + "=" * 60)
        print("다음 SQL을 Supabase Dashboard > SQL Editor에서 실행하세요:")
        print("=" * 60)
        print("\n" + sql_content)
        print("\n" + "=" * 60)
        print("\n또는 아래 명령어로 Supabase CLI를 사용할 수 있습니다:")
        print("supabase db execute --file docs/supabase-inquiries.sql")
        sys.exit(1)
    else:
        print(f"❌ 오류: {e}")
        sys.exit(1)

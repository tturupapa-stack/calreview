#!/usr/bin/env python3
"""데이터베이스 source 제약 조건 업데이트 스크립트

Supabase campaigns 테이블에 새 사이트들(stylec, modan 등)을 추가합니다.
"""

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
print("데이터베이스 Source 제약 조건 업데이트")
print("=" * 60)

url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not url or not key:
    print("❌ 환경 변수가 설정되지 않았습니다.")
    sys.exit(1)

try:
    client = create_client(url, key)
    
    # SQL 파일 읽기
    sql_file = project_root / "docs" / "supabase-add-new-sites.sql"
    if not sql_file.exists():
        print(f"❌ SQL 파일을 찾을 수 없습니다: {sql_file}")
        sys.exit(1)
    
    sql_content = sql_file.read_text()
    
    print("\n⚠️  주의: Supabase Python 클라이언트는 DDL(ALTER TABLE) 명령을 직접 실행할 수 없습니다.")
    print("다음 SQL을 Supabase SQL Editor에서 직접 실행해야 합니다:\n")
    print("-" * 60)
    print(sql_content)
    print("-" * 60)
    print("\n실행 방법:")
    print("1. Supabase Dashboard > SQL Editor 접속")
    print("2. 위 SQL을 복사하여 붙여넣기")
    print("3. Run 버튼 클릭")
    print("\n또는 다음 파일을 참고하세요:")
    print(f"   {sql_file}")
    print(f"   {project_root / 'docs' / 'UPDATE_SOURCE_CONSTRAINT.md'}")
    
except Exception as e:
    print(f"❌ 오류 발생: {e}")
    sys.exit(1)

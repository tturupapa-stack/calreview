#!/usr/bin/env python3
"""문의하기 기능을 위한 Supabase SQL 실행 스크립트

이 스크립트는 psycopg2를 사용하여 PostgreSQL에 직접 연결하여 SQL을 실행합니다.
"""

import os
import sys
from dotenv import load_dotenv
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

load_dotenv(".env.local")

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    print("❌ 환경 변수가 설정되지 않았습니다.")
    sys.exit(1)

# Supabase URL에서 프로젝트 참조 추출
project_ref = SUPABASE_URL.replace("https://", "").replace(".supabase.co", "").split("/")[-1]

# PostgreSQL 연결 문자열 구성
# Supabase의 경우 연결 정보는 다음과 같습니다:
# Host: db.{project_ref}.supabase.co
# Port: 5432
# Database: postgres
# User: postgres.{project_ref}
# Password: {SUPABASE_SERVICE_ROLE_KEY} (하지만 이는 service_role_key이므로 직접 연결이 제한적일 수 있음)

# 실제로는 Supabase의 연결 정보가 다를 수 있으므로,
# Supabase Dashboard > Settings > Database에서 연결 정보를 확인해야 합니다.

# 하지만 service_role_key로는 직접 PostgreSQL 연결이 제한적이므로,
# 여기서는 Supabase의 REST API를 통해 테이블을 생성하는 방법을 시도합니다.

print("=" * 60)
print("문의하기 기능 SQL 실행")
print("=" * 60)

# SQL 파일 읽기
sql_file_path = os.path.join(os.path.dirname(__file__), "..", "docs", "supabase-inquiries.sql")
if not os.path.exists(sql_file_path):
    print(f"❌ SQL 파일을 찾을 수 없습니다: {sql_file_path}")
    sys.exit(1)

with open(sql_file_path, "r", encoding="utf-8") as f:
    sql_content = f.read()

# Supabase의 PostgreSQL 연결 정보
# 참고: Supabase Dashboard > Settings > Database에서 확인 가능
db_host = f"db.{project_ref}.supabase.co"
db_port = 5432
db_name = "postgres"
db_user = f"postgres.{project_ref}"
# 비밀번호는 service_role_key가 아닌 데이터베이스 비밀번호여야 합니다.
# 하지만 이는 Supabase Dashboard에서만 확인 가능합니다.

print(f"\n프로젝트 참조: {project_ref}")
print(f"데이터베이스 호스트: {db_host}")

# PostgreSQL 연결 시도
# 참고: service_role_key로는 직접 PostgreSQL 연결이 제한적이므로,
# 여기서는 안내만 제공합니다.

print("\n⚠ PostgreSQL 직접 연결은 데이터베이스 비밀번호가 필요합니다.")
print("   Supabase Dashboard > Settings > Database에서 연결 정보를 확인하세요.")
print("\n대신 다음 방법을 사용할 수 있습니다:")
print("1. Supabase Dashboard > SQL Editor에서 SQL 실행")
print("2. Supabase CLI 사용 (로컬 프로젝트 연결 필요)")
print("\nSQL 내용:")
print("-" * 60)
print(sql_content)
print("-" * 60)

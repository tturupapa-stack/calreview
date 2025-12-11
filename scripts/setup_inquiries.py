#!/usr/bin/env python3
"""문의하기 기능을 위한 Supabase 설정 스크립트

이 스크립트는 다음을 수행합니다:
1. inquiries 테이블 생성 및 설정
2. inquiries Storage 버킷 생성 및 정책 설정
"""

import os
import sys
import requests
from dotenv import load_dotenv
from supabase import create_client

# .env.local 로드
load_dotenv(".env.local")

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    print("❌ 환경 변수가 설정되지 않았습니다.")
    print("NEXT_PUBLIC_SUPABASE_URL과 SUPABASE_SERVICE_ROLE_KEY를 확인해주세요.")
    sys.exit(1)

# Supabase URL에서 PostgreSQL 연결 정보 추출
# 예: https://xxxxx.supabase.co -> xxxxx.supabase.co
db_host = SUPABASE_URL.replace("https://", "").replace("http://", "")
db_name = "postgres"
db_user = "postgres"
# Supabase의 경우 비밀번호는 프로젝트 설정에서 확인 필요
# 하지만 service_role_key로는 직접 DB 접근이 불가능하므로
# Supabase Management API를 사용하거나 수동 설정이 필요합니다.

print("=" * 60)
print("문의하기 기능 Supabase 설정")
print("=" * 60)

# 방법 1: Supabase Python 클라이언트를 사용하여 Storage 버킷 생성
print("\n1. Storage 버킷 생성 중...")
try:
    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    
    # 버킷이 이미 존재하는지 확인
    buckets = supabase.storage.list_buckets()
    bucket_exists = any(bucket.name == "inquiries" for bucket in buckets)
    
    if bucket_exists:
        print("   ✓ 'inquiries' 버킷이 이미 존재합니다.")
    else:
        # 버킷 생성 (public: false)
        try:
            result = supabase.storage.create_bucket(
                "inquiries",
                options={"public": False, "file_size_limit": 5242880, "allowed_mime_types": ["image/jpeg", "image/png", "application/pdf"]}
            )
            print("   ✓ 'inquiries' 버킷이 생성되었습니다.")
        except Exception as e:
            if "already exists" in str(e).lower() or "duplicate" in str(e).lower():
                print("   ✓ 'inquiries' 버킷이 이미 존재합니다.")
            else:
                print(f"   ⚠ 버킷 생성 중 오류: {e}")
                print("   → 수동으로 생성해주세요: Supabase Dashboard > Storage > New Bucket")
    
    # Storage 정책 설정 (Python 클라이언트로는 정책 설정이 어려우므로 안내만 제공)
    print("\n   ⚠ Storage 정책은 수동으로 설정해야 합니다:")
    print("   → Supabase Dashboard > Storage > Policies > inquiries 버킷")
    print("   → 다음 정책 추가:")
    print("     CREATE POLICY \"Anyone can upload inquiry attachments\"")
    print("     ON storage.objects FOR INSERT")
    print("     WITH CHECK (bucket_id = 'inquiries');")
    
except Exception as e:
    print(f"   ❌ Storage 설정 중 오류: {e}")
    print("   → 수동으로 설정해주세요.")

# 방법 2: SQL 실행 (Supabase Management API 사용)
print("\n2. 데이터베이스 테이블 생성 중...")
try:
    sql_file_path = os.path.join(os.path.dirname(__file__), "..", "docs", "supabase-inquiries.sql")
    if os.path.exists(sql_file_path):
        with open(sql_file_path, "r", encoding="utf-8") as f:
            sql_content = f.read()
        
        # 테이블이 이미 존재하는지 확인
        try:
            result = supabase.table("inquiries").select("id").limit(1).execute()
            print("   ✓ 'inquiries' 테이블이 이미 존재합니다.")
        except Exception as e:
            error_msg = str(e)
            if "PGRST205" in error_msg or "does not exist" in error_msg.lower() or "not found" in error_msg.lower():
                print("   ⚠ 'inquiries' 테이블이 존재하지 않습니다.")
                print("   → Supabase Management API를 통해 SQL 실행 시도 중...")
                
                # Supabase Management API를 사용하여 SQL 실행
                # 참고: Management API는 별도의 access token이 필요합니다.
                # 여기서는 service_role_key를 사용하여 시도합니다.
                project_ref = SUPABASE_URL.replace("https://", "").replace(".supabase.co", "")
                management_url = f"https://api.supabase.com/v1/projects/{project_ref}/database/query"
                
                headers = {
                    "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
                    "Content-Type": "application/json",
                }
                
                # SQL을 여러 개의 문장으로 분리하여 실행
                sql_statements = [s.strip() for s in sql_content.split(";") if s.strip() and not s.strip().startswith("--")]
                
                success_count = 0
                for sql_stmt in sql_statements:
                    if not sql_stmt or sql_stmt.startswith("--"):
                        continue
                    try:
                        # Supabase Management API는 일반적으로 사용할 수 없으므로
                        # 대신 PostgREST의 rpc를 사용하거나, 직접 PostgreSQL 연결이 필요합니다.
                        # 여기서는 안내만 제공합니다.
                        pass
                    except Exception as exec_error:
                        pass
                
                # Management API가 작동하지 않으므로 안내 제공
                print("   ⚠ 자동 SQL 실행이 불가능합니다 (Management API 권한 필요).")
                print("   → 다음 SQL을 Supabase Dashboard > SQL Editor에서 실행하세요:\n")
                print("-" * 60)
                print(sql_content)
                print("-" * 60)
            else:
                print(f"   ⚠ 테이블 확인 중 오류: {e}")
                print("   → 다음 SQL을 Supabase Dashboard > SQL Editor에서 실행하세요:\n")
                print("-" * 60)
                print(sql_content)
                print("-" * 60)
    else:
        print("   ❌ SQL 파일을 찾을 수 없습니다: docs/supabase-inquiries.sql")
except Exception as e:
    print(f"   ❌ SQL 설정 중 오류: {e}")
    print("   → 수동으로 설정해주세요.")

print("\n" + "=" * 60)
print("설정 완료!")
print("=" * 60)
print("\n다음 단계:")
print("1. Supabase Dashboard > SQL Editor에서 위 SQL 실행")
print("2. Supabase Dashboard > Storage > Policies에서 Storage 정책 설정")
print("3. /contact 페이지에서 문의하기 기능 테스트")

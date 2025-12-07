import os
import sys
from dotenv import load_dotenv

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from supabase import create_client
from crawler.category import normalize_category
from crawler.region import normalize_region

def main():
    load_dotenv(".env.local")
    
    url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    if not url or not key:
        print("Error: Supabase credentials not found")
        return

    supabase = create_client(url, key)
    
    print("Fetching all campaigns...")
    try:
        # Fetch all rows (pagination might be needed for large datasets, but assuming < 10000 for now)
        res = supabase.table("campaigns").select("*").execute()
        campaigns = res.data
        print(f"Total campaigns: {len(campaigns)}")
        
        updates = []
        for c in campaigns:
            source = c.get("source")
            raw_cat = c.get("category")
            title = c.get("title")
            raw_region = c.get("region")
            c_id = c.get("id")
            
            # Normalize
            std_cat = normalize_category(source, raw_cat, title)
            std_region = normalize_region(raw_region)
            
            # Check if update is needed
            if std_cat != raw_cat or std_region != raw_region:
                updates.append({
                    "id": c_id,
                    "category": std_cat,
                    "region": std_region
                })
        
        print(f" Campaigns to update: {len(updates)}")
        
        if updates:
            # Upsert requires all non-nullable fields if we are effectively replacing the row for some DBs, 
            # OR we can iterate and update. Given 600 rows, iteration is fine.
            # However, to be faster, let's reuse the 'campaigns' objects we fetched, modify them, and upsert them back.
            # This ensures all fields are present.
            
            modified_campaigns = []
            for c in campaigns:
                 c_id = c.get("id")
                 modified = False
                 
                 # Logic repeated for clarity/safety inside loop
                 source = c.get("source")
                 raw_cat = c.get("category")
                 title = c.get("title")
                 raw_region = c.get("region")
                 
                 raw_type = c.get("type")

                 # 강남맛집, 디너의여왕, 리뷰노트, 리뷰플레이스는 원본 카테고리가 있음.
                 # 서울오빠, 모두의체험단, 파블로는 원본 카테고리가 없고 모두 추론된 값임.
                 # 따라서 이들 사이트는 raw_cat을 무시하고(이미 오염되었을 수 있음) 다시 Title 기반으로 추론해야 함.
                 if source in ["seoulouba", "modooexperience", "pavlovu"]:
                     raw_cat = None

                 std_cat = normalize_category(source, raw_cat, title)
                 std_region = normalize_region(raw_region)
                 
                 # 1. Type Repair Logic implementation
                 # Initialize std_type with raw_type first
                 std_type = raw_type
                 
                 # 카테고리가 명확한 제품군이면 무조건 delivery로 강제 (기존 오류 수정)
                 if std_cat in ["디지털", "식품", "도서", "유아동", "패션", "반려동물", "배송", "재택"]:
                      std_type = "delivery"
                 
                 # 타입이 없거나 수정이 필요한 경우
                 elif not std_type:
                     if std_region == "배송":
                         std_type = "delivery"
                     elif std_cat in ["맛집", "뷰티", "여행", "문화"]:
                         std_type = "visit"
                     
                     elif std_cat == "생활":
                         # 생활 카테고리는 방문(헬스장 등)과 배송(생활용품)이 섞여있음
                         # 지역정보가 없거나 "배송"이면 배송형으로 간주
                         if not std_region or std_region == "배송":
                             std_type = "delivery"
                         else:
                             # 지역 정보가 있으면 방문형으로 간주
                             std_type = "visit"
                     elif "기자단" in title or "기자단" in (raw_cat or ""):
                         std_type = "reporter"

                 if std_cat != raw_cat or std_region != raw_region or std_type != raw_type:
                     c["category"] = std_cat
                     c["region"] = std_region
                     c["type"] = std_type
                     modified_campaigns.append(c) # 'c' is the full object
            
            print(f"Total rows to upsert: {len(modified_campaigns)}")
            
            chunk_size = 100
            for i in range(0, len(modified_campaigns), chunk_size):
                chunk = modified_campaigns[i:i+chunk_size]
                print(f"Upserting chunk {i} to {i+len(chunk)}...")
                # Must specify on_conflict to merge. ID is PK.
                supabase.table("campaigns").upsert(chunk, on_conflict="id").execute()
                
            print("Migration completed.")
        else:
            print("No updates needed.")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()

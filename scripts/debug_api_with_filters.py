
import os
import sys
from datetime import datetime
from dotenv import load_dotenv
from supabase import create_client
from collections import Counter

def main():
    load_dotenv(".env.local")
    url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    supabase = create_client(url, key)
    today_str = datetime.now().strftime("%Y-%m-%d")

    # Test Categories
    categories = ["맛집", "뷰티", "생활", "디지털"]
    
    print(f"Checking filtered results (Deadline >= {today_str})...")
    
    for cat in categories:
        print(f"\n--- Filter: Category = '{cat}' ---")
        
        # Simulate API logic: is_active=True, deadline>=today, category=cat
        res = supabase.table("campaigns").select("source, title, category")\
            .eq("is_active", True)\
            .gte("application_deadline", today_str)\
            .eq("category", cat)\
            .limit(100)\
            .execute()
            
        data = res.data
        count = len(data)
        print(f"Total fetched (limit 100): {count}")
        
        if count == 0:
            print("No items found.")
            continue
            
        sources = [d['source'] for d in data]
        dist = Counter(sources)
        
    # Test Region
    print("\n--- Filter: Region = '서울' ---")
    res = supabase.table("campaigns").select("source, title, category")\
        .eq("is_active", True)\
        .gte("application_deadline", today_str)\
        .ilike("region", "%서울%")\
        .limit(100)\
        .execute()
        
    data = res.data
    count = len(data)
    print(f"Total fetched (limit 100): {count}")
    
    if count > 0:
        sources = [d['source'] for d in data]
        dist = Counter(sources)
        for src, c in dist.items():
            print(f" - {src}: {c}")
    # Test Type
    print("\n--- Filter: Type = 'delivery' ---")
    res = supabase.table("campaigns").select("source, title, category")\
        .eq("is_active", True)\
        .gte("application_deadline", today_str)\
        .eq("type", "delivery")\
        .limit(100)\
        .execute()
        
    data = res.data
    count = len(data)
    print(f"Total fetched (limit 100): {count}")
    
    if count > 0:
        sources = [d['source'] for d in data]
        dist = Counter(sources)
        for src, c in dist.items():
            print(f" - {src}: {c}")
if __name__ == "__main__":
    main()

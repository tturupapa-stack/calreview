
import os
import sys
from dotenv import load_dotenv
from supabase import create_client
from collections import Counter
from datetime import datetime

def main():
    load_dotenv(".env.local")
    url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    supabase = create_client(url, key)
    today = datetime.now().strftime("%Y-%m-%d")
    
    print("Checking SeoulOppa top 50 categories (Deadline Ascending)...")
    res = supabase.table("campaigns")\
        .select("title, category, application_deadline")\
        .eq("source", "seoulouba")\
        .eq("is_active", True)\
        .gte("application_deadline", today)\
        .order("application_deadline", desc=False)\
        .limit(50)\
        .execute()
    
    data = res.data
    cats = [d['category'] for d in data]
    print(f"Top 50 Categories: {Counter(cats)}")
    
    print("\nChecking for ANY non-food items in active set...")
    res_all = supabase.table("campaigns")\
        .select("category")\
        .eq("source", "seoulouba")\
        .eq("is_active", True)\
        .gte("application_deadline", today)\
        .neq("category", "맛집")\
        .limit(20)\
        .execute()
        
    print(f"Non-Food items found: {len(res_all.data)}")
    if res_all.data:
        print(f"Sample Non-Food Categories: {[d['category'] for d in res_all.data]}")

if __name__ == "__main__":
    main()

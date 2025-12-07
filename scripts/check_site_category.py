
import os
import sys
from dotenv import load_dotenv
from supabase import create_client

def main():
    if len(sys.argv) < 2:
        print("Usage: python check_site_category.py <site_name> [limit=20]")
        return
        
    site_name = sys.argv[1]
    limit = int(sys.argv[2]) if len(sys.argv) > 2 else 20
    
    load_dotenv(".env.local")
    url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    supabase = create_client(url, key)
    
    print(f"Checking {site_name} (Limit {limit})...")
    
    # 1. Check distinct categories
    print("\n--- Distinct Categories ---")
    try:
        # Supabase doesn't support 'distinct' easily in python client without RPC or raw sql usually, 
        # but we can fetch and set.
        res = supabase.table("campaigns").select("category, type").eq("source", site_name).limit(1000).execute()
        cats = set()
        for c in res.data:
            cats.add(f"{c['category']} ({c['type']})")
        
        for c in sorted(cats):
            print(c)
    except Exception as e:
        print(f"Error fetching distinct: {e}")

    # 2. Sample campaigns
    print("\n--- Sample Campaigns ---")
    res = supabase.table("campaigns").select("*").eq("source", site_name).limit(limit).execute()
    for c in res.data:
        print(f"[{c['source']}] {c['title']} -> Cat: '{c['category']}', Type: '{c['type']}', Loc: '{c['region']}'")

if __name__ == "__main__":
    main()


import os
import sys
from dotenv import load_dotenv
from supabase import create_client
from collections import Counter

def main():
    load_dotenv(".env.local")
    url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    supabase = create_client(url, key)
    
    print("Checking for duplicates in ReviewNote...")
    res = supabase.table("campaigns").select("id, title, source_id, source_url").eq("source", "reviewnote").ilike("title", "%맑은물 약콩두유%").execute()
    
    print(f"Found {len(res.data)} items.")
    for item in res.data:
        print(f"ID: {item['id']} | SourceID: {item['source_id']} | Title: {item['title']} | URL: {item['source_url']}")

if __name__ == "__main__":
    main()

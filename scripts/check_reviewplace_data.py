
import os
import sys
from dotenv import load_dotenv
from supabase import create_client

def main():
    load_dotenv(".env.local")
    url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    supabase = create_client(url, key)
    
    print("Checking ReviewPlace data...")
    res = supabase.table("campaigns").select("title, category, type, region").eq("source", "reviewplace").limit(20).execute()
    
    if not res.data:
        print("No ReviewPlace campaigns found.")
        return

    print(f"Found {len(res.data)} campaigns. Sample Data:")
    for c in res.data:
        print(f"Title: {c['title'][:30]}... | Cat: {c['category']} | Type: {c['type']} | Loc: {c['region']}")

if __name__ == "__main__":
    main()


import os
import sys
from dotenv import load_dotenv
from supabase import create_client

def main():
    load_dotenv(".env.local")
    url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    supabase = create_client(url, key)
    
    print("Checking Gangnam data (Golf items)...")
    res = supabase.table("campaigns").select("title, category, type, updated_at").eq("source", "gangnam").ilike("title", "%골프%").execute()
    
    if not res.data:
        print("No Gangnam Golf campaigns found.")
        return

    print(f"Found {len(res.data)} Golf campaigns. Sample Data:")
    for c in res.data:
        print(f"Title: {c['title']} | Cat: {c['category']} | Updated: {c['updated_at']}")

if __name__ == "__main__":
    main()


import os
import sys
from dotenv import load_dotenv
from supabase import create_client

def main():
    load_dotenv(".env.local")
    url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    supabase = create_client(url, key)
    
    print("Checking Pavlovu data...")
    # Check source name. Assuming 'pavlovu' based on filename.
    source_name = "pavlovu"

    res = supabase.table("campaigns").select("title, category, type, updated_at").eq("source", source_name).limit(20).execute()
    
    if not res.data:
        print(f"No campaigns found for source '{source_name}'.")
        return

    print(f"Found {len(res.data)} campaigns. Sample Data:")
    for c in res.data:
        print(f"Title: {c['title'][:30]}... | Cat: {c['category']} | Type: {c['type']} | Updated: {c['updated_at']}")

if __name__ == "__main__":
    main()

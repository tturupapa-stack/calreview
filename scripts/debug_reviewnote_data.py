
import os
import sys
from dotenv import load_dotenv
from supabase import create_client
from datetime import datetime

def main():
    load_dotenv(".env.local")
    url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    supabase = create_client(url, key)
    
    print("Checking ReviewNote data...")
    res = supabase.table("campaigns").select("title, source, is_active, application_deadline").eq("source", "reviewnote").limit(10).execute()
    
    if not res.data:
        print("No ReviewNote campaigns found.")
        return

    print(f"Found {len(res.data)} campaigns. Sample Data:")
    today_str = datetime.now().strftime("%Y-%m-%d")
    print(f"Today (in Python): {today_str}")
    
    for c in res.data:
        print(f"Title: {c['title'][:20]}... | Active: {c['is_active']} | Deadline: {c['application_deadline']}")

if __name__ == "__main__":
    main()


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
    print(f"Checking first 50 visible campaigns (Sort: Deadline Ascending)...")
    
    res = supabase.table("campaigns").select("source, title, application_deadline")\
        .eq("is_active", True)\
        .gte("application_deadline", today_str)\
        .order("application_deadline", desc=False)\
        .limit(50)\
        .execute()
        
    data = res.data
    print(f"Fetch count: {len(data)}")
    
    sources = [d['source'] for d in data]
    counts = Counter(sources)
    
    print("\nTop 50 Source Distribution:")
    for src, count in counts.items():
        print(f" - {src}: {count}")
        
    print("\nFirst 10 items:")
    for item in data[:10]:
        print(f"[{item['source']}] {item['application_deadline']} - {item['title'][:30]}")

if __name__ == "__main__":
    main()

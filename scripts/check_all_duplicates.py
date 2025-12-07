
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
    
    print("Fetching ReviewNote campaigns to check for title duplicates...")
    res = supabase.table("campaigns").select("id, source_id, title").eq("source", "reviewnote").eq("is_active", True).execute()
    
    data = res.data
    print(f"Total Active ReviewNote: {len(data)}")
    
    titles = [d['title'] for d in data]
    title_counts = Counter(titles)
    
    duplicates = {t: c for t, c in title_counts.items() if c > 1}
    print(f"Found {len(duplicates)} duplicate titles.")
    
    for title, count in duplicates.items():
        print(f"\nTitle: {title} ({count})")
        # Find the items
        items = [d for d in data if d['title'] == title]
        for item in items:
            print(f" - SourceID: {item['source_id']} (Len: {len(item['source_id'])})")

if __name__ == "__main__":
    main()


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
    
    print("Fetching ReviewNote campaigns to fix duplicates...")
    res = supabase.table("campaigns").select("id, source_id, title").eq("source", "reviewnote").eq("is_active", True).execute()
    
    data = res.data
    titles = [d['title'] for d in data]
    title_counts = Counter(titles)
    
    duplicates = [t for t, c in title_counts.items() if c > 1]
    print(f"Found {len(duplicates)} duplicate titles.")
    
    deleted_count = 0
    
    for title in duplicates:
        items = [d for d in data if d['title'] == title]
        # Sort items by source_id length (ascending). We want to keep the short (numeric) one.
        # Check if we have both numeric (len<=7) and hash (len>10)
        items.sort(key=lambda x: len(x['source_id']))
        
        canonical = items[0] # Shortest ID
        to_delete = items[1:] # The rest (longer IDs)
        
        # Security check: only delete if canonical is short and to_delete is long
        if len(canonical['source_id']) <= 7:
            for item in to_delete:
                if len(item['source_id']) > 10:
                    print(f"Deleting duplicate for '{title}': SourceID {item['source_id']} (keeping {canonical['source_id']})")
                    supabase.table("campaigns").delete().eq("id", item['id']).execute()
                    deleted_count += 1
                else:
                    print(f"Skipping '{title}': Both IDs seem numeric/short? {canonical['source_id']} vs {item['source_id']}")
        else:
             print(f"Skipping '{title}': Canonical ID {canonical['source_id']} is too long?")

    print(f"Total deleted: {deleted_count}")

if __name__ == "__main__":
    main()

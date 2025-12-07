
import os
import sys
from dotenv import load_dotenv
from supabase import create_client

def main():
    load_dotenv(".env.local")
    url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    supabase = create_client(url, key)
    
    print("Checking distinct source names in Supabase...")
    # Supabase doesn't have a direct 'distinct' easily via python client without rpc sometimes, 
    # but we can fetch unique source names by grouping or just fetching all (limited) and set()
    # Or just use the 'distinct' on the query builder if available or supported.
    # Actually, let's just fetch a bunch and see unique.
    
    # Alternatively, use a group by query if possible? Python client is typically simple wrapper.
    # Let's just fetch columns source, limit 1000 and confirm.
    
    res = supabase.table("campaigns").select("source").limit(2000).execute()
    
    sources = set()
    for item in res.data:
        sources.add(item['source'])
        
    print(f"Found sources: {sources}")

if __name__ == "__main__":
    main()

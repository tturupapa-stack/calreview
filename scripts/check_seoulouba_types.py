
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
    
    print("Checking SeoulOppa type distribution...")
    res = supabase.table("campaigns").select("type").eq("source", "seoulouba").execute()
    
    counts = Counter([d['type'] for d in res.data])
    print(counts)

if __name__ == "__main__":
    main()

import os
import sys
from dotenv import load_dotenv

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from supabase import create_client

def main():
    load_dotenv(".env.local")
    
    url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    if not url or not key:
        print("Error: Supabase credentials not found")
        return

    supabase = create_client(url, key)
    
    print("Fetching locations...")
    try:
        res = supabase.table("campaigns").select("region, source").execute()
        
        locations = set()
        
        # Analyze first word (Province/City)
        provinces = set()
        
        for item in res.data:
            loc = item.get("region")
            if loc:
                locations.add(loc)
                parts = loc.split()
                if parts:
                    provinces.add(parts[0])
        
        print("\nTop-level Provinces found:")
        print(sorted(list(provinces)))
        
        print("\nSample Locations (first 50):")
        print(sorted(list(locations))[:50])
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()

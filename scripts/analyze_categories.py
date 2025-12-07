import os
import sys
from dotenv import load_dotenv

# Add project root to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from supabase import create_client

def main():
    # Load .env.local explicitly
    load_dotenv(".env.local")
    
    url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    if not url or not key:
        print("Error: Supabase credentials not found in .env.local")
        return

    supabase = create_client(url, key)
    
    print("Fetching categories...")
    try:
        res = supabase.table("campaigns").select("category, source").execute()
        
        categories = set()
        source_categories = {}
        
        for item in res.data:
            cat = item.get("category")
            source = item.get("source")
            
            if cat:
                categories.add(cat)
                if source not in source_categories:
                    source_categories[source] = set()
                source_categories[source].add(cat)
        
        print("\nAll Unique Categories:")
        print(sorted(list(categories)))
        
        print("\nCategories by Source:")
        for source, cats in source_categories.items():
            print(f"- {source}: {sorted(list(cats))}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()

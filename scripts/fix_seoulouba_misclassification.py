
import os
from dotenv import load_dotenv
from supabase import create_client

def main():
    load_dotenv(".env.local")
    url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    supabase = create_client(url, key)
    
    print("Fixing 'Mara Gongbang' misclassifications (Culture -> Food)...")
    
    # Select items that have "Maragongbang" in title AND are marked as "Culture"
    res = supabase.table("campaigns").select("id, title, category").ilike("title", "%마라공방%").eq("category", "문화").execute()
    
    items = res.data
    print(f"Found {len(items)} misclassified items.")
    
    for item in items:
        print(f"Updating: {item['title']} (ID: {item['id']})")
        supabase.table("campaigns").update({"category": "맛집"}).eq("id", item['id']).execute()
        
    print("Fix complete.")

if __name__ == "__main__":
    main()


import os
import sys
from dotenv import load_dotenv
from supabase import create_client

def main():
    load_dotenv(".env.local")
    url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    supabase = create_client(url, key)
    
    print("Checking ModooExperience data...")
    # Check source name - likely 'modoo' or 'modooexperience'. Trying 'modoo' first based on common conventions, 
    # but I will check for 'modooexperience' if that fails. Or just check distinct sources.
    
    # Let's try 'modoo' first as it's shorter, but wait, the file is modooexperience.py.
    # I'll try to find any that match 'modoo%'.
    
    res = supabase.table("campaigns").select("source").ilike("source", "%mod%").limit(1).execute()
    source_name = "modoo"
    if res.data:
        source_name = res.data[0]['source']
        print(f"Detected source name: {source_name}")
    else:
        print("Could not detect Modoo source name. Trying 'modooexperience'...")
        source_name = "modooexperience"

    res = supabase.table("campaigns").select("title, category, type, updated_at").eq("source", source_name).limit(20).execute()
    
    if not res.data:
        print(f"No campaigns found for source '{source_name}'.")
        return

    print(f"Found {len(res.data)} campaigns. Sample Data:")
    for c in res.data:
        print(f"Title: {c['title'][:30]}... | Cat: {c['category']} | Updated: {c['updated_at']}")

if __name__ == "__main__":
    main()


import os
import sys
from datetime import datetime
from dotenv import load_dotenv
from supabase import create_client

def main():
    load_dotenv(".env.local")
    url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    supabase = create_client(url, key)
    
    today_str = datetime.now().strftime("%Y-%m-%d")
    print(f"Checking visibility for Modoo/Pavlovu. Today: {today_str}")
    
    for source in ["modooexperience", "pavlovu"]:
        print(f"\n--- Checking {source} ---")
        # 1. Total count
        res_total = supabase.table("campaigns").select("*", count="exact", head=True).eq("source", source).execute()
        print(f"Total in DB: {res_total.count}")
        
        # 2. Visible API Logic (is_active=True, deadline >= Today)
        res_visible = supabase.table("campaigns").select("*", count="exact", head=True)\
            .eq("source", source)\
            .eq("is_active", True)\
            .gte("application_deadline", today_str)\
            .execute()
            
        print(f"Visible in API: {res_visible.count}")
        
        # 3. Sample failing items
        if res_total.count and res_total.count > 0:
             # Check a few with null deadline or past deadline
             res_bad = supabase.table("campaigns").select("title, application_deadline, is_active")\
                 .eq("source", source)\
                 .lt("application_deadline", today_str)\
                 .limit(5).execute()
                 
             if res_bad.data:
                 print("Sample PAST deadlines:")
                 for item in res_bad.data:
                     print(f" - {item['title'][:20]}... : {item['application_deadline']}")
                     
             res_null = supabase.table("campaigns").select("title, application_deadline, is_active")\
                 .eq("source", source)\
                 .is_("application_deadline", "null")\
                 .limit(5).execute()
                 
             if res_null.data:
                 print("Sample NULL deadlines:")
                 for item in res_null.data:
                     print(f" - {item['title'][:20]}... : {item['application_deadline']}")

if __name__ == "__main__":
    main()

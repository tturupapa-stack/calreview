
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
    
    print("Fetching all campaigns (id, source, is_active, application_deadline)...")
    # Fetch a large chunk
    res = supabase.table("campaigns").select("source, is_active, application_deadline").limit(5000).execute()
    
    data = res.data
    total = len(data)
    print(f"Total rows fetched: {total}")
    
    sources = set(d['source'] for d in data)
    print(f"Sources found: {sources}")
    
    today_str = datetime.now().strftime("%Y-%m-%d")
    print(f"Current Date Filter (>=): {today_str}")

    stats = {s: {"total": 0, "active": 0, "future_deadline": 0, "visible_in_api": 0} for s in sources}
    
    for row in data:
        src = row['source']
        is_active = row.get('is_active')
        deadline = row.get('application_deadline')
        
        stats[src]["total"] += 1
        
        if is_active:
            stats[src]["active"] += 1
            
            if deadline:
                # Simple string compare works for ISO format YYYY-MM-DD
                # We need to handle potential time parts.
                # The API uses: gte("application_deadline", todayStr)
                if deadline >= today_str:
                    stats[src]["future_deadline"] += 1
                    stats[src]["visible_in_api"] += 1
            else:
                 # If deadline is None, gte usually fails or excludes. 
                 # In SQL `completion_date >= '...'` excludes NULL.
                 pass

    print("\n--- Visibility Statistics per Source ---\n")
    print(f"{'Source':<15} | {'Total':<6} | {'Active':<6} | {'Future':<6} | {'Visible (Est)':<13}")
    print("-" * 60)
    for src, stat in stats.items():
        print(f"{src:<15} | {stat['total']:<6} | {stat['active']:<6} | {stat['future_deadline']:<6} | {stat['visible_in_api']:<13}")
        
    print("\nIf 'Visible' is 0 or low, check 'Active' flags or 'Future' deadlines.")

if __name__ == "__main__":
    main()

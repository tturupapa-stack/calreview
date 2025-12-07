
import sys
import os

# Add project root to path
sys.path.append(os.getcwd())

from crawler.main import run_crawler
from crawler.utils import save_campaigns_to_supabase

def main():
    print("Crawling seoulouba...")
    # site_name matches the module name in crawler/sites/
    campaigns = run_crawler("seoulouba") 
    print(f"Crawled {len(campaigns)} campaigns.")
    
    if campaigns:
        print("Saving to Supabase...")
        save_campaigns_to_supabase(campaigns)
        print("Done.")
    else:
        print("No campaigns found.")

if __name__ == "__main__":
    main()

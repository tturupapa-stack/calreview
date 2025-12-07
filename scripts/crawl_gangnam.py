
import os
import sys
import logging
from dotenv import load_dotenv

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from crawler.sites.gangnam import crawl
from crawler.utils import save_campaigns_to_supabase

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("Crawler")

def main():
    load_dotenv(".env.local")
    
    print("Crawling Gangnam...")
    campaigns = crawl()
    
    print(f"Crawled {len(campaigns)} campaigns.")
    
    # Debug: Check Screen Golf category
    for c in campaigns:
        if "골프" in c.title or "골프" in (c.category or ""):
            print(f"[DEBUG] Found Golf: Title='{c.title}', Cat='{c.category}'")
    
    print("Saving to Supabase...")
    save_campaigns_to_supabase(campaigns)
    print("Done.")

if __name__ == "__main__":
    main()

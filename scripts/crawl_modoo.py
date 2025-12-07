
import os
import sys
import logging
from dotenv import load_dotenv

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from crawler.sites.modooexperience import crawl
from crawler.utils import save_campaigns_to_supabase

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("Crawler")
logger.setLevel(logging.DEBUG) # Force DEBUG

def main():
    load_dotenv(".env.local")
    
    print("Crawling ModooExperience...")
    campaigns = crawl()
    
    print(f"Crawled {len(campaigns)} campaigns.")
    
    print("Saving to Supabase...")
    save_campaigns_to_supabase(campaigns)
    print("Done.")

if __name__ == "__main__":
    main()

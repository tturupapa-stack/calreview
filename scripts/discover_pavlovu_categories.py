
import requests
from bs4 import BeautifulSoup

BASE_URL = "https://pavlovu.com"

def main():
    print("Fetching Pavlovu main page to find categories...")
    try:
        res = requests.get(BASE_URL, headers={
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }, timeout=10)
        soup = BeautifulSoup(res.text, "html.parser")
        
        # Look for navigation links
        links = soup.select("a[href]")
        
        seen = set()
        print("\n--- Potential Category Links ---")
        for a in links:
            href = a.get("href", "")
            text = a.get_text(strip=True)
            
            if not href: continue
             # Filter related to campaign list
            if "review_campaign_list.php" in href or "category" in href:
                 if href not in seen:
                    print(f"Text: '{text}' -> Href: '{href}'")
                    seen.add(href)

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()

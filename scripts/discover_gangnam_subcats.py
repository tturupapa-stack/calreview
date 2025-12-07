
import requests
from bs4 import BeautifulSoup

def main():
    url = "https://xn--939au0g4vj8sq.net/cp/?ca=40"
    print(f"Fetching {url}...")
    try:
        res = requests.get(url, headers={
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }, timeout=10)
        soup = BeautifulSoup(res.text, "html.parser")
        
        # Look for filters or tabs that might indicate sub-categories
        # Often inside .category, .filter, or just links with more params
        links = soup.select("a[href*='?ca=']")
        
        print("\n--- Links in ca=20 page ---")
        seen = set()
        for a in links:
            href = a.get("href")
            text = a.get_text(strip=True)
            if href not in seen:
                seen.add(href)
                print(f"Text: '{text}' -> Href: '{href}'")
                
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()

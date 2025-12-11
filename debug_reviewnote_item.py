import requests
import json
from bs4 import BeautifulSoup

def debug_item():
    url = "https://www.reviewnote.co.kr/"
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    
    res = requests.get(url, headers=headers)
    soup = BeautifulSoup(res.text, "html.parser")
    
    script = soup.find("script", {"id": "__NEXT_DATA__"})
    if not script:
        print("No NEXT_DATA found")
        return

    data = json.loads(script.string)
    props = data.get("props", {}).get("pageProps", {})
    
    # Search in all lists
    lists = ["premiums", "populars", "nearEnds", "recents"]
    found = False
    
    print(f"{'Title':<20} | {'Category (Raw)':<15} | {'Location (Raw)':<15} | {'City':<10} | {'Sido':<10}")
    print("-" * 80)
    
    for key in lists:
        items = props.get(key, [])
        for item in items:
            title = item.get("campaignTitle") or item.get("title")
            if "오르트클라우드" in title:
                found = True
                cat_title = item.get("category", {}).get("title")
                city = item.get("city", "")
                sido = item.get("sido", {}).get("name", "")
                loc = f"{city} {sido}".strip()
                
                print(f"{title[:20]:<20} | {str(cat_title):<15} | {loc:<15} | {str(city):<10} | {str(sido):<10}")
                
    if not found:
        print("Item '오르트클라우드' not found in current main page lists.")

if __name__ == "__main__":
    debug_item()

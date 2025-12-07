
import requests
from bs4 import BeautifulSoup
import json

def main():
    url = "https://www.reviewnote.co.kr/"
    print("Fetching ReviewNote home to inspect JSON...")
    
    res = requests.get(url, headers={
        "User-Agent": "Mozilla/5.0"
    })
    soup = BeautifulSoup(res.text, "html.parser")
    next_data = soup.find("script", id="__NEXT_DATA__")
    
    data = json.loads(next_data.string)
    page_props = data.get("props", {}).get("pageProps", {})
    
    target_lists = ["premiums", "populars", "nearEnds", "recents"]
    
    for list_name in target_lists:
        items = page_props.get(list_name, [])
        print(f"\n--- List: {list_name} ({len(items)} items) ---")
        if items:
            item = items[0]
            print(f"Title: {item.get('title')}")
            print(f"ID: {item.get('id')} (Type: {type(item.get('id'))})")
            print(f"Keys: {list(item.keys())}")

if __name__ == "__main__":
    main()

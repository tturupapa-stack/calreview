
import requests
from bs4 import BeautifulSoup

def main():
    url = "https://www.seoulouba.co.kr/campaign/"
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    
    print(f"Fetching {url}...")
    res = requests.get(url, headers=headers)
    soup = BeautifulSoup(res.text, "html.parser")
    
    # 1. Look for main tabs (Visit, Delivery, etc.)
    # Based on screenshots, there are tabs like "방문형", "배송형", "기자단"
    
    print("\n--- Links containing '배송' ---")
    for a in soup.find_all("a", href=True):
        if "배송" in a.get_text():
            print(f"Text: {a.get_text().strip()}, Href: {a['href']}")

    print("\n--- Links containing '방문' ---")
    for a in soup.find_all("a", href=True):
        if "방문" in a.get_text():
            print(f"Text: {a.get_text().strip()}, Href: {a['href']}")

    # 2. Look for specific categories (Food, Travel, etc.)
    # They might be in a submenu or visible on the page
    categories = ["맛집", "여행", "숙박", "뷰티", "패션", "생활", "디지털", "식품"]
    print("\n--- Category Links ---")
    for cat in categories:
        for a in soup.find_all("a", href=True):
            if cat in a.get_text():
                print(f"Category: {cat}, Text: {a.get_text().strip()}, Href: {a['href']}")

if __name__ == "__main__":
    main()

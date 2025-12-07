
import requests
from bs4 import BeautifulSoup
import concurrent.futures

def check_id(cat_id):
    url = f"https://www.seoulouba.co.kr/campaign/?cat={cat_id}"
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    try:
        res = requests.get(url, headers=headers, timeout=5)
        soup = BeautifulSoup(res.text, "html.parser")
        # Title usually in <title> or breadcrumbs
        # Looking for active tab text
        active_tab = soup.select_one(".cate_tab a.active")
        active_text = active_tab.get_text(strip=True) if active_tab else "Unknown"
        
        # Also check page title
        page_title = soup.title.get_text(strip=True) if soup.title else ""
        
        return cat_id, active_text, page_title
    except Exception as e:
        return cat_id, "Error", str(e)

def main():
    print("Checking IDs 377 to 400...")
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
        futures = {executor.submit(check_id, i): i for i in range(377, 401)}
        results = []
        for future in concurrent.futures.as_completed(futures):
            results.append(future.result())
            
    for cat_id, active, title in sorted(results):
        print(f"ID {cat_id}: Active='{active}', Title='{title}'")

if __name__ == "__main__":
    main()

import requests
from bs4 import BeautifulSoup

def check_gangnam_count():
    # Category 2005: 맛집 (Food)
    url = "https://xn--939au0g4vj8sq.net/cp/?ca=2005" 
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    
    try:
        res = requests.get(url, headers=headers)
        soup = BeautifulSoup(res.text, 'html.parser')
        
        # Try to find a total count element. 
        # Often looks like "Total 123" or generic pagination end.
        
        # Method 1: Look for specific 'total' class or text
        # (Visually inspecting the site source would be better, but blindly...)
        
        # Method 2: Check pagination
        pagination = soup.select(".pagination a, .paging a")
        last_page = 1
        if pagination:
            for p in pagination:
                try:
                    num = int(p.get_text())
                    if num > last_page:
                        last_page = num
                except:
                    pass
        
        items = soup.select("li.list_item")
        
        print(f"Items on page 1: {len(items)}")
        print(f"Detected last page in pagination: {last_page}")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_gangnam_count()

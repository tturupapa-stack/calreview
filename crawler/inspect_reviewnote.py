import requests
from bs4 import BeautifulSoup

def inspect():
    url = "https://www.reviewnote.co.kr/"
    headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
    res = requests.get(url, headers=headers)
    soup = BeautifulSoup(res.text, 'html.parser')
    
    # Try to find campaign items
    # Usually they are in a list or grid
    # Let's look for common container classes
    
    print("Page Title:", soup.title.string)
    
    # Check for Next.js data
    next_data = soup.find('script', id='__NEXT_DATA__')
    if next_data:
        import json
        data = json.loads(next_data.string)
        page_props = data.get('props', {}).get('pageProps', {})
        
        items = []
        if 'premiums' in page_props:
            items.extend(page_props['premiums'])
        if 'recents' in page_props:
            items.extend(page_props['recents'])
            
        print(f"\nTotal items found: {len(items)}")
        
        print("\nSample Items (First 20):")
        for i, item in enumerate(items[:20]):
            cat_title = item.get('category', {}).get('title')
            title = item.get('title')
            city = item.get('city')
            sido = item.get('sido', {}).get('name')
            print(f"[{i+1}] Title: {title} | Cat: {cat_title} | Loc: {city} {sido}")
    else:
        print("\n__NEXT_DATA__ script not found.")

if __name__ == "__main__":
    inspect()

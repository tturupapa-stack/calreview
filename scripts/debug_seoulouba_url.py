
import sys
import os
import requests
from bs4 import BeautifulSoup

# Add project root
sys.path.append(os.getcwd())

from crawler.utils_detail import extract_detail_info, _extract_seoulouba_detail

url = "https://www.seoulouba.co.kr/campaign/?c=347642"

def main():
    print(f"Testing URL: {url}")
    
    # 1. Use the main function
    print("Running extract_detail_info...")
    try:
        res = extract_detail_info(url, "seoulouba")
        print(f"Result: {res}")
    except Exception as e:
        print(f"Error: {e}")

    # 2. Manual fetch to inspect HTML
    print("\nManual fetch...")
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    r = requests.get(url, headers=headers)
    print(f"Status: {r.status_code}")
    soup = BeautifulSoup(r.text, "html.parser")
    
    # Check selectors
    print("Checking selectors:")
    # .view_tit_tag > span
    tags1 = soup.select(".view_tit_tag span")
    print(f".view_tit_tag span: {[t.get_text() for t in tags1]}")

    # .view_info span
    tags2 = soup.select(".view_info span")
    print(f".view_info span: {[t.get_text() for t in tags2]}")
    
    # .tag_box span
    tags3 = soup.select(".tag_box span")
    print(f".tag_box span: {[t.get_text() for t in tags3]}")

    import re
    keyword = "여행/숙박"
    indices = [m.start() for m in re.finditer(re.escape(keyword), r.text)]
    print(f"Found {len(indices)} occurrences of '{keyword}'")
    for i, idx in enumerate(indices):
        start = max(0, idx - 200)
        end = min(len(r.text), idx + 200)
        print(f"Occurrence {i+1}: ...{r.text[start:end]}...")
    
    if "on" in r.text:
         print("Found 'on' class in HTML")

if __name__ == "__main__":
    main()

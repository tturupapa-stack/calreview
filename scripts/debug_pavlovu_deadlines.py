
import requests
from bs4 import BeautifulSoup

def main():
    url = "https://pavlovu.com/review_campaign_list.php"
    print("Fetching Pavlovu list to check raw deadlines...")
    
    try:
        res = requests.get(url, headers={
             "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }, timeout=10)
        soup = BeautifulSoup(res.text, "html.parser")
        cards = soup.select(".box")
        
        print(f"Found {len(cards)} cards.")
        for i, card in enumerate(cards[:20]):
            dday_el = card.select_one(".dday")
            raw_dday = dday_el.get_text(strip=True) if dday_el else "None"
            print(f"Card {i+1}: Deadline Text = '{raw_dday}'")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()

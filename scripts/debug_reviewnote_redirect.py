
import requests

def main():
    # Hash ID from the duplicate found earlier
    hash_id = "1bfc2c9a8434c8a0" 
    url = f"https://www.reviewnote.co.kr/campaigns/{hash_id}"
    
    print(f"Checking URL: {url}")
    try:
        res = requests.get(url, allow_redirects=False, timeout=10)
        print(f"Status Code: {res.status_code}")
        print(f"Headers Location: {res.headers.get('Location')}")
        
        if res.status_code in [301, 302]:
            print("Redirect confirmed.")
        
        # Follow redirect
        res_followed = requests.get(url, allow_redirects=True, timeout=10)
        print(f"Final URL: {res_followed.url}")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()

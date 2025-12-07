
import requests

def check_url(url):
    try:
        res = requests.head(url, timeout=3, allow_redirects=True)
        if res.status_code == 200 and 'image' in res.headers.get('Content-Type', ''):
            print(f"[OK] {url}")
            return True
        else:
            print(f"[FAIL] {url} ({res.status_code})")
    except Exception as e:
        print(f"[ERR] {url} - {e}")
    return False

candidates = [
    # SeoulOppa
    "https://www.seoulouba.co.kr/image/common/logo.png",
    "https://www.seoulouba.co.kr/img/logo.png",
    
    # ReviewPlace
    "https://www.reviewplace.co.kr/images/common/logo.png",
    "https://www.reviewplace.co.kr/img/logo.png",
    
    # ReviewNote
    "https://www.reviewnote.co.kr/img/logo.png",
    "https://www.reviewnote.co.kr/assets/logo.png",
    
    # DinnerQueen
    "https://dinnerqueen.net/images/logo.svg",
    "https://dinnerqueen.net/img/logo.png",
    
    # Google Favicon tests for remaining
    "https://www.google.com/s2/favicons?domain=modan.kr&sz=64",
    "https://www.google.com/s2/favicons?domain=pavlovu.com&sz=64",
    "https://www.google.com/s2/favicons?domain=xn--939au0g4vj8sq.net&sz=64"
]

for url in candidates:
    check_url(url)

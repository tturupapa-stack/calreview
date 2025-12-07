
from crawler.category import normalize_category

def main():
    title = "[서울 강남구] 마라공방 강남역점"
    site = "seoulouba"
    # SeoulOppa raw category for "Visit" (Category ID 378) is "맛집" (Food)
    raw_category = "맛집" 
    
    print(f"Title: {title}")
    print(f"Raw Category: {raw_category}")
    
    final_cat = normalize_category(site, raw_category, title)
    print(f"Normalized Category: {final_cat}")
    
    if final_cat != "맛집":
        print("MISCLASSIFICATION DETECTED!")
        if "공방" in title:
            print("Reason: '공방' keyword triggered Culture.")

if __name__ == "__main__":
    main()

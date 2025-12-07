
from crawler.category import normalize_category

def test(title, expected, expected_type=None):
    # site_name and raw_category affect it, but we want to test keyword power.
    # ReviewNote often gives "맛집" as raw category for these misclassified items.
    raw = "맛집" 
    cat = normalize_category("reviewnote", raw, title)
    print(f"Title: '{title}' -> Cat: '{cat}' (Expected: '{expected}')")

    if expected_type:
        # Simulate utils.py logic
        ctype = "visit" # Default for "맛집" raw
        if cat in ["디지털", "식품", "도서", "유아동", "패션", "반려동물", "배송", "재택"]:
            ctype = "delivery"
        elif cat == "생활":
            # Assume no location for delivery-like lifestyle, or location for visit
            pass 
        
        print(f"  -> Inferred Type: '{ctype}' (Expected: '{expected_type}')")

print("Testing Normalization Logic...")
test("무타공 정수기 2세대", "디지털", "delivery")
test("원더바레 미사역점", "생활", "visit") # Should be Visit type but Lifestyle category
test("삼성전자 비스포크 제트 청소기", "디지털", "delivery")
test("용인대 태권도", "생활", "visit")
test("음식물 처리기 링클", "디지털", "delivery")
test("누수탐사대", "생활", "visit")
test("별내스크린골프", "생활", "visit")
test("다나통증마사지", "생활", "visit")

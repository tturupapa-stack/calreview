
from crawler.category import normalize_category

def main():
    # Simulate the exact context of Gangnam crawler failure
    site = "gangnam"
    fixed_cat = "맛집"
    title_raw = "[남양주 별내] 별내스크린골프"
    
    # 1. Simulate title cleaning in gangnam.py
    import re
    title_clean = re.sub(r"\[[^\]]+\]\s*", "", title_raw).strip()
    print(f"Clean Title: '{title_clean}'")
    
    # 2. Run normalization
    cat = normalize_category(site, fixed_cat, title_clean)
    print(f"Normalized Category: '{cat}'")
    
    # 3. Check keywords directly
    life_keywords = ["운동", "pt", "필라테스", "요가", "헬스", "클래스", "청소", "이사", "생활", "바레", "유도", "태권도", "주짓수", "댄스", "무용", "짐", "체육관", "골프", "누수", "마사지", "네일", "왁싱"]
    print(f"'골프' in keywords? {'골프' in life_keywords}")
    print(f"'골프' in title? {'골프' in title_clean}")

if __name__ == "__main__":
    main()

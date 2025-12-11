from crawler.category import normalize_category
from crawler.utils import _campaign_to_supabase_dict
from crawler.models import Campaign

def test_items():
    items = [
        # 1. ReviewNote Tumbler Case
        Campaign(
            site_name="reviewnote",
            title="오르트클라우드",
            category="기타", # Assumption: Raw category might be '기타'
            location="전국", # Assumption: Product usually has nationwide or no location
            url="http://test.com/1",
            image_url="",
            deadline="D-1",
            channel="블로그",
            type=None
        ),
        # 2. SeoulOppa Furniture Case
        Campaign(
            site_name="seoulouba",
            title="[기자단] 베루샤디자인가구",
            category="맛집", # SeoulOppa crawler might be scraping from ID 378 (Food)? Or raw category is empty?
            location="",
            url="http://test.com/2",
            image_url="",
            deadline="D-1",
            channel="블로그",
            type="visit" # SeoulOppa might set fixed type
        ),
        # 3. SeoulOppa Makeup Case
        Campaign(
            site_name="seoulouba",
            title="[기자단] 메이메이크업",
            category="맛집",
            location="",
            url="http://test.com/3",
            image_url="",
            deadline="D-1",
            channel="블로그",
            type="visit"
        ),
        # 4. Critical Logic Check: Food Category but Nationwide Location
        Campaign(
            site_name="reviewnote",
            title="Some Tumbler",
            category="맛집", # Wrongly classified as Food
            location="전국", # But location is Nationwide
            url="http://test.com/4",
            image_url="",
            deadline="D-0",
            channel="블로그",
            type="visit" # Crawler says visit
        ),
        # 5. Generic Reporter Case (Should be Living, NOT Food)
        Campaign(
            site_name="seoulouba",
            title="[기자단] 어떤 브랜드",
            category="맛집", # Raw cat 378
            location="",
            url="http://test.com/5",
            image_url="",
            deadline="D-0",
            channel="블로그",
            type="visit"
        )
    ]

    print(f"{'Site':<12} | {'Title':<20} | {'Raw Cat':<10} | {'Raw Loc':<10} | {'Std Cat':<10} | {'Std Type':<10} | {'Std Region':<10}")
    print("-" * 100)

    for item in items:
        # Simulate normalization logic locally if needed, or use the utils function
        # But _campaign_to_supabase_dict does the logic.
        
        # We need to mock Supabase client? No, just check the dict creation part if it was isolated.
        # Actually _campaign_to_supabase_dict is hard to run because it depends on os.environ for SUPABASE_URL?
        # Let's just import normalize_category and normalize_region and replicate the logic in utils.py
        
        from crawler.region import normalize_region
        
        std_cat = normalize_category(item.site_name, item.category, item.title)
        std_region = normalize_region(item.location)
        
        # Logic from utils.py (simplified/copied for tracing)
        campaign_type = None
        if "기자단" in item.title:
            campaign_type = "reporter"
        elif std_cat in ["디지털", "식품", "도서", "유아동", "패션", "반려동물", "배송", "재택"]:
            campaign_type = "delivery"
        elif item.type:
            campaign_type = item.type
        else:
            if std_region in ["배송", "재택"] or item.location in ["배송", "재택"]:
                campaign_type = "delivery"
            elif std_cat == "생활":
                if not std_region or std_region in ["배송", "재택", "전국"]: 
                    campaign_type = "delivery"
                else:
                    campaign_type = "visit"
            elif std_cat in ["맛집", "뷰티", "여행", "문화"]:
                campaign_type = "visit"
        
        print(f"{item.site_name:<12} | {item.title[:20]:<20} | {str(item.category):<10} | {str(item.location):<10} | {std_cat:<10} | {str(campaign_type):<10} | {str(std_region):<10}")

if __name__ == "__main__":
    test_items()

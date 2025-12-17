from typing import Optional

def normalize_category(site_name: str, raw_category: Optional[str], title: str) -> str:
    """
    캠페인 카테고리를 표준 카테고리로 정규화합니다.
    표준 카테고리: 맛집, 뷰티, 여행, 생활, 식품, 패션, 디지털, 문화, 반려동물, 유아동, 도서, 재택, 배송
    """

    # 1. 텍스트 정제
    cat = raw_category.strip() if raw_category else ""
    title_norm = title.lower()

    # 1.5 강력한 제품/배송 키워드 확인 (우선순위 최상)
    # 카테고리가 '맛집'으로 잘못 분류된 경우를 구제하기 위함
    # 단, 이번 수정에서는 세부 카테고리를 살리기 위해 매핑을 세분화함

    # 패션/의류/잡화
    # 주의: "옷"은 "계란옷" 등 음식 용어에도 사용되므로 단독 매칭 제외
    fashion_keywords = ["슬리퍼", "신발", "의류", "패션", "양말", "티셔츠", "바지", "치마", "자켓", "코트", "빈티지", "의상점"]
    if any(k in title_norm for k in fashion_keywords):
        # "옷"이 포함되어 있지만 음식 관련 단어와 함께 쓰인 경우 제외
        return "패션"

    # 2. 타이틀 기반 강력한 키워드 - Raw Category보다 우선 (잘못된 카테고리 보정)

    # 특정 음식점 체인명
    food_chain_names = ["텍사스파파", "스노우폭스", "본죽", "본도시락", "김가네", "한솥", "이삭토스트"]
    if any(k in title_norm for k in food_chain_names):
        return "맛집"

    # 뷰티 키워드 - Raw Category가 "식품"이어도 두피/탈모 등이 있으면 뷰티로 분류
    beauty_keywords = ["헤어", "네일", "속눈썹", "에스테틱", "왁싱", "피부", "미용실", "뷰티", "펌", "염색", "피부관리", "메이크업", "눈썹", "모발", "미용", "두피", "탈모", "살롱", "태닝", "손톱", "타투", "피어싱", "문신", "반영구"]
    if any(k in title_norm for k in beauty_keywords):
        return "뷰티"

    # 서비스/클리닉 키워드 - Raw Category가 "식품"이어도 연구소/클리닉이면 생활로 분류
    service_keywords = ["연구소", "클리닉", "센터", "학원", "교습소"]
    if any(k in title_norm for k in service_keywords):
        return "생활"

    # 반려동물 키워드 - Raw Category보다 우선
    # 주의: "댕댕", "~개", "~하개" 등 강아지 관련 신조어/접미사 포함
    pet_keywords = ["펫", "독", "도그", "dog", "냥", "멍", "강아지", "고양이", "반려", "애견", "펫샵", "펫호텔", "동물병원", "사료", "달마시안", "푸들", "말티즈", "포메", "비숑", "댕댕", "퍼피", "puppy", "마스코타", "게코", "몽몽"]
    # "~하개", "~없개", "~이개" 등 강아지 관련 이름 패턴
    pet_suffix_patterns = ["하개", "없개", "이개", "댕이", "몽이"]
    if any(k in title_norm for k in pet_keywords) or any(title_norm.endswith(k) or k in title_norm for k in pet_suffix_patterns):
        return "반려동물"

    # 꽃집/플라워 키워드 - 생활로 분류
    flower_keywords = ["플라워", "플로리스트", "꽃집", "꽃배달", "화원", "플로라", "플레르", "블룸", "가든", "정원", "라일락"]
    # 예외: "정원"이 음식점 이름일 수 있음 (예: 정원식당)
    if any(k in title_norm for k in flower_keywords):
        # "정원"인 경우 음식 관련 단어와 함께 있으면 제외
        if "정원" in title_norm and any(food in title_norm for food in ["식당", "밥", "국", "찌개"]):
            pass  # 음식점이므로 생활 분류 안함
        else:
            return "생활"

    # 가구 키워드 - 문화(전시) 전에 체크
    furniture_keywords = ["가구", "소파", "침대", "매트리스", "식탁", "의자", "책상", "인테리어", "조명", "이불"]
    if any(k in title_norm for k in furniture_keywords):
        return "생활"

    # 곤충/체험학습 키워드 - 생활로 분류
    experience_keywords = ["곤충", "체험학습", "자연학습"]
    if any(k in title_norm for k in experience_keywords):
        return "생활"

    # 노래방/엔터테인먼트 키워드 - 문화로 분류
    entertainment_keywords = ["노래방", "코인노래", "노래타운", "코노"]
    if any(k in title_norm for k in entertainment_keywords):
        return "문화"

    # 세탁/크리닝 키워드 - 생활로 분류
    cleaning_keywords = ["세탁", "크리닝", "드라이"]
    if any(k in title_norm for k in cleaning_keywords):
        return "생활"

    # 3. 명시적 세부 카테고리 매핑 (Raw Category가 아주 구체적인 경우)
    if "디지털" in cat or "가전" in cat:
        return "디지털"
    if "식품" in cat or "밀키트" in cat:
        return "식품"
    if "도서" in cat or "책" in cat:
        return "도서"
    if "유아" in cat or "육아" in cat:
        return "유아동"
    if "반려" in cat or "애견" in cat or "강아지" in cat or "고양이" in cat:
        return "반려동물"
    if "패션" in cat or "의류" in cat:
        return "패션"
    if "재택" in cat:
        return "재택"

    # 4. 타이틀 기반 세부 키워드 매핑

    # 패션/의류 매장 키워드
    fashion_store_keywords = ["핫스노우", "편집샵", "빈티지샵", "옷가게", "의류매장", "쇼룸"]
    if any(k in title_norm for k in fashion_store_keywords):
        return "패션"

    # 맛집 키워드 (디저트, 카페, 음식점 등)
    # 주의: "회", "탕" 등 짧은 키워드는 다른 단어에 포함될 수 있으므로 더 구체적인 키워드 사용
    food_keywords = [
        # 디저트/카페
        "크레페", "디저트", "베이커리", "케이크", "케크", "카페", "커피", "빵집", "제과", "베이커", "마들렌", "요거트", "아이스크림", "젤라또", "와플", "마카롱", "타르트", "쿠키",
        # 음식점
        "식당", "맛집", "고기", "삼겹", "치킨", "피자", "햄버거", "초밥", "횟집", "회집", "라멘", "국밥", "찌개", "설렁탕", "감자탕", "곰탕", "삼계탕", "육개장", "순대국", "면옥", "정식", "한식", "중식", "일식", "양식", "분식", "샤브", "순대", "족발", "보쌈", "스노우폭스", "곱창", "막창", "소갈비", "돼지", "소고기", "스시", "우동", "돈까스", "덮밥", "김밥", "떡볶이", "브런치", "파스타", "스테이크", "바베큐", "bbq", "뷔페", "buffet",
        # 정육/해산물
        "정육", "축산", "해산물", "수산", "생선"
    ]
    if any(k in title_norm for k in food_keywords):
        return "맛집"
        
    # 여행/숙박/레저 키워드
    travel_keywords = [
        "펜션", "호텔", "풀빌라", "숙박", "캠핑", "글램핑", "여행", "리조트", "스테이", "카라반", "민박", "게스트하우스",
        "테마파크", "놀이공원", "워터파크", "눈썰매", "스키", "스노우", "짚라인", "루지", "레일바이크", "번지", "래프팅",
        "아쿠아리움", "아쿠아", "동물원", "식물원", "수목원", "자연휴양림", "온천", "찜질방", "사우나",
        "서핑", "서프", "surf", "다이빙", "스쿠버", "스노클링", "카약", "패들보드", "요트", "크루즈"
    ]
    if any(k in title_norm for k in travel_keywords):
        return "여행"
        
    # 문화/스튜디오 키워드
    culture_keywords = ["공방", "전시", "연극", "뮤지컬", "영화", "책방", "스냅", "사진", "촬영", "웨딩", "스튜디오", "프롤로그", "문화", "팝업스토어", "팝업", "아뜰리에", "필름"]
    
    # 예외: "마라공방" 등 음식점 이름에 "공방"이 들어가는 경우 제외
    triggered_culture = False
    for k in culture_keywords:
        if k in title_norm:
            # "공방"이 있지만 "마라"가 있으면 무시 (마라공방)
            if k == "공방" and "마라" in title_norm:
                continue
            triggered_culture = True
            break
            
    if triggered_culture:
        return "문화"

    # 제품 키워드 (세부 분류 - 영양제 등 추가)
    # 생활/여가(청소)보다 먼저 체크해야 "청소기"가 디지털로 분류됨
    if any(k in title_norm for k in ["디지털", "가전", "노트북", "폰", "이어폰", "정수기", "음식물", "처리기", "청소기", "비데", "제습기", "에어컨", "전자", "wi-fi", "wifi", "와이파이", "공유기", "라우터", "액세스포인트", "ap", "블루투스", "스피커", "모니터", "tv", "태블릿"]):
        return "디지털"
    # 건강식품/영양제/가공식품 키워드 (식품)
    health_food_keywords = [
        # 건강식품/영양제
        "밀키트", "식품", "간식", "음료", "영양제", "비타민", "멜라토닌", "유산균",
        "건강식품", "건강즙", "홍삼", "프로바이오틱스", "밀크씨슬", "씨슬",
        "흑염소", "녹용", "오메가", "루테인", "콜라겐", "글루타치온", "마그네슘",
        "아연", "철분", "칼슘", "유산균", "락토", "젖산균", "효소", "발효",
        "즙", "액기스", "엑기스", "추출물", "분말", "환", "캔디", "캡슐",
        "liposomal", "c2000", "리포좀", "리포솜", "호두오일", "아마씨", "치아씨드",
        "단백질", "프로틴", "아미노산", "bcaa", "크레아틴", "보충제",
        "알부민", "albumin", "글루코사민", "msm", "관절", "뼈건강",
        # 가공식품/밀키트
        "너비아니", "유부", "만두", "떡", "젤리", "과자", "쿠키", "초콜릿",
        "라면", "면", "소스", "장", "김치", "젓갈", "반찬", "조미료",
        "냉동", "레토르트", "즉석", "통조림", "캔", "파우치",
        "완자", "동그랑땡", "전", "부침", "튀김", "새우", "오징어", "계란옷",
        "양반", "동원", "cj", "오뚜기", "풀무원", "비비고"
    ]
    if any(k in title_norm for k in health_food_keywords):
        return "식품"
    if any(k in title_norm for k in ["책", "도서"]):
        return "도서"
    if any(k in title_norm for k in ["유아", "육아", "기저귀", "장난감"]):
        return "유아동"
    if any(k in title_norm for k in ["반려", "강아지", "고양이", "사료", "동물병원", "애견", "펫샵", "펫호텔"]):
        return "반려동물"
    if "재택" in title_norm:
        return "재택"
    
    # 가구/인테리어 키워드 (생활)
    if any(k in title_norm for k in ["가구", "소파", "침대", "매트리스", "식탁", "의자", "책상", "인테리어", "조명", "이불"]):
        return "생활"
        
    # 주방용품/텀블러 (생활)
    if any(k in title_norm for k in ["텀블러", "보틀", "컵", "주방", "식기", "냄비", "후라이팬"]):
        return "생활"

    # 생활/여가 키워드
    life_keywords = [
        # 운동/스포츠
        "운동", "pt", "필라테스", "요가", "헬스", "클래스", "바레", "유도", "태권도", "주짓수", "댄스", "무용", "짐", "체육관", "골프", "체형관리", "스트레칭", "교정", "자세",
        "승마", "농구", "축구", "배구", "테니스", "배드민턴", "점핑", "트램폴린", "클라이밍", "볼링",
        # 서비스
        "청소", "이사", "생활", "누수", "마사지", "네일", "왁싱", "세차", "워시", "타로", "점술", "사주", "운세", "연구소", "클리닉", "센터",
        # PC방/게임
        "pc방", "피씨방", "게임", "보드게임", "방탈출",
        # 세탁/클리닝
        "런드리", "세탁", "크리닝", "홈케어",
        # 자동차
        "오토", "카센터", "타이어", "정비", "광택", "코팅", "ppf", "썬팅",
        # 낚시/레저
        "낚시", "좌대",
        # 기타 서비스
        "테라피", "치료", "힐링", "명상"
    ]
    if any(k in title_norm for k in life_keywords):
        return "생활"

    # [기자단] 예외 처리: 상위 특정 키워드(뷰티, 여행 등)에 걸리지 않았는데 '기자단'이면
    # '맛집-기자단'인지 '기타-기자단'인지 애매하므로, 포괄적인 '생활'로 분류하여 '맛집' 쏠림 방지
    # (단, 식당 이름만 있는 경우 생활로 빠질 수 있으나, 가구/제품 등이 맛집으로 가는 것보다는 나음)
    if "기자단" in title_norm:
        return "생활"

    # 4. 일반/광범위 Raw 카테고리 매핑 (타이틀에서 특정하지 못한 경우)
    # 주의: modan의 "제품" 카테고리는 방문형 체험이므로 배송으로 분류하지 않음
    if "배송" in cat:
        return "배송"
    # modan이 아닌 사이트의 "제품" 카테고리만 배송으로 분류
    if "제품" in cat and site_name != "modan":
        return "배송"
    if "맛집" in cat:
        return "맛집"
    if any(k in cat for k in ["뷰티", "미용"]):
        return "뷰티"
    if any(k in cat for k in ["여행", "숙박"]):
        return "여행"
    if any(k in cat for k in ["문화", "전시", "연극"]):
        return "문화"
    if any(k in cat for k in ["여가", "생활"]):
        return "생활"
        
    # 5. 제품 키워드 (일반) -> 배송
    # 타이틀에 특정 제품 키워드가 없지만, 일반적인 배송/제품 관련 키워드가 있는 경우
    # 주의: "제품"은 modan에서 방문형 매장을 의미하므로 제외
    delivery_keywords = ["택배", "배송"]
    if any(k in title_norm for k in delivery_keywords):
        return "배송"

    # 6. 기본값 처리
    # 기타 카테고리이거나 분류가 모호한 경우
    if cat == "기타":
        return "생활"  # 기타는 생활로

    if cat == "배송형":  # 혹시 위에서 안걸린 경우
        return "배송"
    elif cat == "기자단":
        return "생활"  # 기자단은 보통 생활/정보성으로 분류

    # modan의 "제품" 카테고리: 방문형 매장이므로 생활로 분류
    if site_name == "modan" and cat == "제품":
        return "생활"

    # 서울오빠, 강남맛집 등에서 '방문형'인데 키워드가 없으면 대부분 '맛집'일 확률이 높음 (식당, 카페 등)
    # 따라서 Default는 '맛집'으로 설정 (단, 배송형은 위에서 걸러져야 함)
    return "맛집"

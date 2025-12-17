import { createClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";
import { parseSearchQuery } from "@/lib/search-parser";
import { calculateDday } from "@/lib/utils";
import { DEADLINE_KEYWORDS_MAP, TYPE_KEYWORDS_MAP } from "@/constants/mappings";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;

    // 자연어 검색 쿼리 또는 일반 필터 파라미터
    const q = searchParams.get("q"); // 자연어 검색
    const regionParam = searchParams.get("region");
    // 다중 지역 지원: 쉼표로 구분된 지역 목록
    const regions = regionParam ? regionParam.split(",").map(r => r.trim()).filter(Boolean) : [];
    const detailedRegionParam = searchParams.get("detailed_region");
    // 다중 상세 지역 지원: 쉼표로 구분된 상세 지역 목록
    const detailedRegions = detailedRegionParam ? detailedRegionParam.split(",").map(r => r.trim()).filter(Boolean) : [];
    const category = searchParams.get("category");
    const type = searchParams.get("type");
    const channel = searchParams.get("channel");
    const sort = searchParams.get("sort") || "deadline";

    // 페이지네이션 파라미터
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = (page - 1) * limit;

    // 자연어 검색 쿼리가 있으면 파싱
    let parsedQuery: ReturnType<typeof parseSearchQuery> | null = null;
    if (q && q.trim()) {
      parsedQuery = parseSearchQuery(q);

      // 검색 기록 저장 (비동기, 실패해도 검색은 계속)
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from("search_history").insert({
            user_id: user.id,
            query: q,
            parsed_region: parsedQuery.region,
            parsed_category: parsedQuery.category,
            parsed_deadline: parsedQuery.deadline,
            parsed_type: parsedQuery.type,
            parsed_channel: parsedQuery.channel,
          });
        }
      } catch (err) {
        // 검색 기록 저장 실패는 무시
        console.error("검색 기록 저장 실패:", err);
      }
    }

    // Supabase 쿼리 빌더 (count 옵션 추가)
    // KST 기준으로 오늘 날짜 계산 (UTC+9)
    const now = new Date();
    const kstDate = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    const todayStr = kstDate.toISOString().split("T")[0];

    let query = supabase
      .from("campaigns")
      .select("*", { count: "exact" })
      .eq("is_active", true)
      .gte("application_deadline", todayStr); // 오늘 날짜 이후의 게시물만 조회

    // 필터 적용 (자연어 검색 결과 우선, 없으면 일반 파라미터 사용)
    // 자연어 검색에서 지역이 추출되면 단일 지역 배열로, 아니면 URL 파라미터의 다중 지역 사용
    const finalRegions = parsedQuery?.region 
      ? [parsedQuery.region] 
      : regions.length > 0 
        ? regions 
        : [];
    const finalCategory = parsedQuery?.category || category;
    const finalType = parsedQuery?.type || type;
    const finalChannel = parsedQuery?.channel || channel;

    // 제목 검색: 자연어 검색 쿼리가 있고 필터가 추출되지 않았거나, 
    // 필터가 추출되었어도 남은 키워드가 있으면 제목 검색 수행
    let titleSearchQuery: string | null = null;
    if (q && q.trim()) {
      // 필터가 하나도 추출되지 않았으면 전체 쿼리를 제목 검색에 사용
      const hasFilters = parsedQuery && (
        parsedQuery.region ||
        parsedQuery.category ||
        parsedQuery.deadline ||
        parsedQuery.type ||
        parsedQuery.channel
      );

      if (!hasFilters) {
        // 필터가 없으면 전체 쿼리를 제목 검색에 사용
        titleSearchQuery = q.trim();
      } else {
        // 필터가 있으면, 원본 쿼리에서 필터 키워드를 제거한 나머지를 제목 검색에 사용
        // 예: "수원시 피자" -> 지역: 수원, 제목: "피자"
        let remainingQuery = q.trim();

        // 추출된 키워드 제거 (간단한 방식)
        if (parsedQuery?.region) {
          remainingQuery = remainingQuery.replace(new RegExp(parsedQuery.region, "gi"), "").trim();
          remainingQuery = remainingQuery.replace(new RegExp(`${parsedQuery.region}시`, "gi"), "").trim();
        }
        // URL 파라미터의 다중 지역도 제거
        if (regions.length > 0) {
          for (const region of regions) {
            remainingQuery = remainingQuery.replace(new RegExp(region, "gi"), "").trim();
            remainingQuery = remainingQuery.replace(new RegExp(`${region}시`, "gi"), "").trim();
          }
        }
        // URL 파라미터의 다중 상세 지역도 제거
        if (detailedRegions.length > 0) {
          for (const detailedRegion of detailedRegions) {
            remainingQuery = remainingQuery.replace(new RegExp(detailedRegion, "gi"), "").trim();
          }
        }
        if (parsedQuery?.category) {
          remainingQuery = remainingQuery.replace(new RegExp(parsedQuery.category, "gi"), "").trim();
        }
        if (parsedQuery?.deadline) {
          const keywords = DEADLINE_KEYWORDS_MAP[parsedQuery.deadline] || [];
          for (const keyword of keywords) {
            remainingQuery = remainingQuery.replace(new RegExp(keyword, "gi"), "").trim();
          }
        }
        if (parsedQuery?.type) {
          const keyword = TYPE_KEYWORDS_MAP[parsedQuery.type];
          if (keyword) {
            remainingQuery = remainingQuery.replace(new RegExp(keyword, "gi"), "").trim();
          }
        }
        if (parsedQuery?.channel) {
          const channelParts = parsedQuery.channel.split("/");
          for (const part of channelParts) {
            remainingQuery = remainingQuery.replace(new RegExp(part, "gi"), "").trim();
          }
        }

        // 남은 키워드가 2글자 이상이면 제목 검색에 사용
        if (remainingQuery.length >= 2) {
          titleSearchQuery = remainingQuery;
        }
      }
    }

    // 다중 지역 필터링 (OR 조건)
    if (finalRegions.length > 0) {
      // 여러 지역 중 하나라도 매칭되면 표시
      const regionConditions = finalRegions.map(region => {
        // 시 단위인 경우 (도 이름이 아닌 경우) 더 정확한 매칭
        const isCityLevel = !["서울", "경기", "인천", "강원", "충남", "충북", "전남", "전북", "경남", "경북", "제주", "전국", "배송"].includes(region);
        
        if (isCityLevel) {
          // 시 단위 검색: "수원" 또는 "수원시" 둘 다 매칭
          return `region.ilike.%${region}%`;
        } else {
          // 도 단위 검색
          return `region.ilike.%${region}%`;
        }
      });
      
      // OR 조건으로 결합
      if (regionConditions.length === 1) {
        query = query.ilike("region", `%${finalRegions[0]}%`);
      } else {
        // Supabase의 or() 메서드를 사용하여 여러 조건을 OR로 결합
        query = query.or(regionConditions.join(","));
      }
    }
    // 다중 상세 지역 필터링 (OR 조건)
    if (detailedRegions.length > 0) {
      const detailedRegionConditions = detailedRegions.map(detailedRegion => {
        // "시", "구", "군" 접미사 제거
        let keyword = detailedRegion.replace(/(시|구|군)$/, "");

        // 1. 단음절 방지 (중구 -> 중, 동구 -> 동 검색 방지)
        // 접미사를 제거했는데 1글자가 되면 제거하지 않음 (예: "중구", "서구"는 그대로 검색)
        if (keyword.length < 2) {
          keyword = detailedRegion;
        }

        // 2. "고양" (지역) vs "고양이" (동물) 구분
        if (keyword === "고양") {
          return `region.ilike.%${keyword}%,title.match.고양($|[^이])`;
        } else {
          return `region.ilike.%${keyword}%,title.ilike.%${keyword}%`;
        }
      });

      // OR 조건으로 결합
      if (detailedRegionConditions.length === 1) {
        const keyword = detailedRegions[0].replace(/(시|구|군)$/, "");
        const finalKeyword = keyword.length < 2 ? detailedRegions[0] : keyword;
        if (finalKeyword === "고양") {
          query = query.or(`region.ilike.%${finalKeyword}%,title.match.고양($|[^이])`);
        } else {
          query = query.or(`region.ilike.%${finalKeyword}%,title.ilike.%${finalKeyword}%`);
        }
      } else {
        // Supabase의 or() 메서드를 사용하여 여러 조건을 OR로 결합
        query = query.or(detailedRegionConditions.join(","));
      }
    }
    if (finalCategory) {
      query = query.eq("category", finalCategory);
    }
    if (finalType) {
      query = query.eq("type", finalType);
    }
    if (finalChannel) {
      query = query.ilike("channel", `%${finalChannel}%`);
    }

    // 사이트 이름 필터 (디버깅/검증용)


    const site_name = searchParams.get("site_name");
    if (site_name) {
      query = query.eq("source", site_name);
    }

    // 제목 검색 (필터 키워드를 제외한 나머지)
    if (titleSearchQuery) {
      query = query.ilike("title", `%${titleSearchQuery}%`);
    }

    // 마감일 필터 (자연어 검색에서 추출된 경우)
    if (parsedQuery?.deadline) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      switch (parsedQuery.deadline) {
        case "deadline": // 마감임박 (7일 이내)
          const weekLater = new Date(today);
          weekLater.setDate(weekLater.getDate() + 7);
          query = query
            .gte("application_deadline", today.toISOString())
            .lte("application_deadline", weekLater.toISOString());
          break;
        case "this_week": // 이번주
          const endOfWeek = new Date(today);
          endOfWeek.setDate(endOfWeek.getDate() + (7 - endOfWeek.getDay()));
          query = query
            .gte("application_deadline", today.toISOString())
            .lte("application_deadline", endOfWeek.toISOString());
          break;
        case "next_week": // 다음주
          const startOfNextWeek = new Date(today);
          startOfNextWeek.setDate(startOfNextWeek.getDate() + (7 - startOfNextWeek.getDay()));
          const endOfNextWeek = new Date(startOfNextWeek);
          endOfNextWeek.setDate(endOfNextWeek.getDate() + 7);
          query = query
            .gte("application_deadline", startOfNextWeek.toISOString())
            .lte("application_deadline", endOfNextWeek.toISOString());
          break;
        case "this_month": // 이번달
          const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
          query = query
            .gte("application_deadline", today.toISOString())
            .lte("application_deadline", endOfMonth.toISOString());
          break;
        case "today": { // 오늘
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          query = query
            .gte("application_deadline", today.toISOString())
            .lt("application_deadline", tomorrow.toISOString());
          break;
        }
        case "tomorrow": { // 내일
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          const dayAfterTomorrow = new Date(today);
          dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
          query = query
            .gte("application_deadline", tomorrow.toISOString())
            .lt("application_deadline", dayAfterTomorrow.toISOString());
          break;
        }
      }
    }

    // 정렬
    if (sort === "deadline") {
      query = query.order("application_deadline", { ascending: true, nullsFirst: false });
    } else if (sort === "latest") {
      query = query.order("created_at", { ascending: false });
    } else if (sort === "selection_rate") {
      // 당첨확률순 (selection_rate 높은 순, NULL 값은 마지막)
      query = query.order("selection_rate", { ascending: false, nullsFirst: false });
    } else if (sort === "competition") {
      // 경쟁률 낮은 순 (selection_rate 높은 순과 동일하지만 신청자 적은 것 우선)
      query = query.order("selection_rate", { ascending: false, nullsFirst: false });
    }

    // 페이지네이션 적용
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error("Supabase 쿼리 오류:", error);
      return NextResponse.json(
        { error: "검색 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    // Supabase 데이터를 Campaign 타입에 맞게 변환
    type CampaignRow = {
      id: string;
      application_deadline: string | null;
      region: string | null;
      thumbnail_url: string | null;
      [key: string]: unknown;
    };
    const campaigns = (data || []).map((item: CampaignRow) => ({
      ...item,
      // 표시용 필드 매핑
      deadline: item.application_deadline
        ? calculateDday(item.application_deadline)
        : null,
      location: item.region,
      image_url: item.thumbnail_url,
    }));

    return NextResponse.json({
      campaigns,
      count: campaigns.length,
      total: count || 0,
      page,
      limit,
      hasMore: count ? offset + campaigns.length < count : false,
    });
  } catch (error) {
    console.error("API 오류:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}


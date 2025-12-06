import { createClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

// 신청 생성
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // 인증 확인
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { campaign_id, status } = body;

    if (!campaign_id) {
      return NextResponse.json(
        { error: "캠페인 ID가 필요합니다." },
        { status: 400 }
      );
    }

    // 캠페인 존재 확인
    const { data: campaign, error: campaignError } = await supabase
      .from("campaigns")
      .select("id")
      .eq("id", campaign_id)
      .eq("is_active", true)
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json(
        { error: "존재하지 않는 캠페인입니다." },
        { status: 404 }
      );
    }

    // 이미 신청했는지 확인
    const { data: existing } = await supabase
      .from("applications")
      .select("id, status")
      .eq("user_id", user.id)
      .eq("campaign_id", campaign_id)
      .single();

    if (existing) {
      if (existing.status === "cancelled") {
        // 취소된 신청이면 다시 활성화
        const { data, error } = await supabase
          .from("applications")
          .update({
            status: "applied",
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id)
          .select()
          .single();

        if (error) {
          throw error;
        }

        return NextResponse.json({
          success: true,
          application: data,
          message: "신청이 완료되었습니다.",
        });
      } else {
        return NextResponse.json(
          { error: "이미 신청한 캠페인입니다." },
          { status: 400 }
        );
      }
    }

    // 북마크 또는 신청 생성
    const { data, error } = await supabase
      .from("applications")
      .insert({
        user_id: user.id,
        campaign_id: campaign_id,
        status: status || "bookmarked", // 기본값은 북마크
      })
      .select()
      .single();

    if (error) {
      console.error("신청 생성 오류:", error);
      throw error;
    }

    return NextResponse.json({
      success: true,
      application: data,
      message: "신청이 완료되었습니다.",
    });
  } catch (error: any) {
    console.error("API 오류:", error);
    return NextResponse.json(
      { error: error.message || "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// 내 신청 목록 조회
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // 인증 확인
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const statusParams = searchParams.getAll("status"); // 여러 status 필터 지원

    let query = supabase
      .from("applications")
      .select(
        `
        *,
        campaigns (
          id,
          title,
          thumbnail_url,
          category,
          region,
          channel,
          type,
          source_url,
          application_deadline,
          review_deadline_days
        )
      `
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (statusParams.length > 0) {
      // 여러 status 필터 지원 (예: ?status=bookmarked&status=applied)
      query = query.in("status", statusParams);
    }

    const { data, error } = await query;

    if (error) {
      console.error("신청 목록 조회 오류:", error);
      throw error;
    }

    return NextResponse.json({
      applications: data || [],
      count: data?.length || 0,
    });
  } catch (error: any) {
    console.error("API 오류:", error);
    return NextResponse.json(
      { error: error.message || "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}


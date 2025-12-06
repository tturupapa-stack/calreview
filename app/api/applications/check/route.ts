import { createClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

/**
 * 특정 캠페인의 신청 상태 확인
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // 인증 확인
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({
        application: null,
      });
    }

    const searchParams = request.nextUrl.searchParams;
    const campaign_id = searchParams.get("campaign_id");

    if (!campaign_id) {
      return NextResponse.json(
        { error: "campaign_id가 필요합니다." },
        { status: 400 }
      );
    }

    // 해당 캠페인의 신청 정보 조회 (북마크 포함)
    const { data, error } = await supabase
      .from("applications")
      .select("id, status")
      .eq("user_id", user.id)
      .eq("campaign_id", campaign_id)
      .neq("status", "cancelled")
      .maybeSingle(); // single() 대신 maybeSingle() 사용하여 없을 때도 정상 처리

    if (error) {
      throw error;
    }

    return NextResponse.json({
      application: data || null,
    });
  } catch (error: any) {
    console.error("신청 상태 확인 오류:", error);
    return NextResponse.json(
      { error: error.message || "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}


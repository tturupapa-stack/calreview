import { createClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

/**
 * Google Calendar 연결 해제
 */
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

    // users 테이블에서 연결 정보 제거
    const { error: updateError } = await supabase
      .from("users")
      .update({
        google_refresh_token: null,
        google_calendar_connected: false,
      })
      .eq("id", user.id);

    if (updateError) {
      console.error("연결 해제 오류:", updateError);
      throw updateError;
    }

    return NextResponse.json({
      success: true,
      message: "구글 캘린더 연결이 해제되었습니다.",
    });
  } catch (error: any) {
    console.error("Google Calendar 연결 해제 오류:", error);
    return NextResponse.json(
      { error: error.message || "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}


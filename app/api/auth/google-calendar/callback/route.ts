import { createClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { redirect } from "next/navigation";

/**
 * Google Calendar OAuth 콜백 처리
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const state = searchParams.get("state"); // 사용자 ID

    if (!code || !state) {
      return redirect("/settings?error=missing_params");
    }

    // 환경 변수 확인
    const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CALENDAR_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      console.error("Google Calendar 환경 변수 누락");
      return redirect("/settings?error=config_error");
    }

    // Redirect URI는 현재 요청의 origin 사용
    const origin = new URL(request.url).origin;
    
    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      `${origin}/api/auth/google-calendar/callback`
    );

    // 인증 코드를 액세스 토큰과 리프레시 토큰으로 교환
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.refresh_token) {
      return redirect("/settings?error=no_refresh_token");
    }

    // Supabase에 리프레시 토큰 저장
    const supabase = await createClient();
    
    // 사용자 확인
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user || user.id !== state) {
      return redirect("/settings?error=unauthorized");
    }

    // users 테이블 업데이트
    const { error: updateError } = await supabase
      .from("users")
      .update({
        google_refresh_token: tokens.refresh_token,
        google_calendar_connected: true,
      })
      .eq("id", user.id);

    if (updateError) {
      console.error("사용자 정보 업데이트 오류:", updateError);
      return redirect("/settings?error=update_failed");
    }

    return redirect("/settings?success=calendar_connected");
  } catch (error: any) {
    console.error("Google Calendar 콜백 오류:", error);
    return redirect("/settings?error=callback_failed");
  }
}


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
    const redirectUri = `${origin}/api/auth/google-calendar/callback`;
    
    console.log("Google Calendar OAuth 콜백 처리:", {
      origin,
      redirectUri,
      hasClientId: !!clientId,
      clientIdLength: clientId?.length,
      hasCode: !!code,
      hasState: !!state,
    });
    
    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri
    );

    // 인증 코드를 액세스 토큰과 리프레시 토큰으로 교환
    let tokens;
    try {
      const tokenResponse = await oauth2Client.getToken(code);
      tokens = tokenResponse.tokens;
    } catch (tokenError: any) {
      console.error("Google OAuth 토큰 교환 오류:", {
        error: tokenError,
        message: tokenError.message,
        code: tokenError.code,
        response: tokenError.response?.data,
      });
      
      // 구체적인 오류 타입에 따라 다른 에러 코드 반환
      if (tokenError.code === 401 || tokenError.message?.includes("invalid_client")) {
        return redirect("/settings?error=invalid_client");
      }
      if (tokenError.message?.includes("redirect_uri_mismatch")) {
        return redirect("/settings?error=redirect_uri_mismatch");
      }
      
      throw tokenError; // 다른 에러는 catch 블록으로 전달
    }

    if (!tokens.refresh_token) {
      console.warn("리프레시 토큰을 받지 못했습니다. 사용자가 이미 승인했을 수 있습니다.");
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
    console.error("Google Calendar 콜백 오류:", {
      error,
      message: error?.message,
      code: error?.code,
      stack: error?.stack,
      response: error?.response?.data,
    });
    
    // 이미 리다이렉트된 경우가 아니면 에러 리다이렉트
    return redirect("/settings?error=callback_failed");
  }
}


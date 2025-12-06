import { createClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";

/**
 * Google Calendar OAuth 연결 시작
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
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    // Redirect URI는 현재 앱의 URL을 사용
    const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CALENDAR_CLIENT_ID,
      process.env.GOOGLE_CALENDAR_CLIENT_SECRET,
      `${origin}/api/auth/google-calendar/callback`
    );

    const scopes = [
      "https://www.googleapis.com/auth/calendar.events",
      "https://www.googleapis.com/auth/calendar.readonly",
    ];

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: scopes,
      prompt: "consent", // refresh token을 받기 위해 필요
      state: user.id, // 사용자 ID를 state로 전달
    });

    return NextResponse.json({
      authUrl,
    });
  } catch (error: any) {
    console.error("Google Calendar 연결 오류:", error);
    return NextResponse.json(
      { error: error.message || "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}


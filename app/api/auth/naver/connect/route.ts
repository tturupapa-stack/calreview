import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const naverClientId = process.env.NAVER_CLIENT_ID;
  
  if (!naverClientId) {
    return NextResponse.json(
      { error: "네이버 Client ID가 설정되지 않았습니다." },
      { status: 500 }
    );
  }

  // 로컬 개발 환경과 프로덕션 환경에 따라 redirect_uri 설정
  // 환경 변수에서 줄바꿈/공백 제거
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").trim().replace(/\n/g, "");
  const redirectUri = `${baseUrl}/api/auth/naver/callback`;
  
  // 네이버 OAuth 인증 URL 생성
  const state = Math.random().toString(36).substring(7); // CSRF 방지용 state
  const naverAuthUrl = `https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${naverClientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;
  
  // state를 쿠키에 저장 (CSRF 방지)
  const response = NextResponse.redirect(naverAuthUrl);
  response.cookies.set("naver_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600, // 10분
  });
  
  return response;
}


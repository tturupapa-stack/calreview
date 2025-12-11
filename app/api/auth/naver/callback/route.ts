import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// 네이버 OAuth 사용자를 위한 고정 비밀번호 (환경 변수로 관리)
const NAVER_USER_PASSWORD = process.env.NAVER_OAUTH_PASSWORD || "naver_oauth_secure_password_2024_calreview";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  
  // 에러 처리
  if (error) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent("네이버 로그인에 실패했습니다.")}`, request.url)
    );
  }
  
  // 필수 파라미터 확인
  if (!code || !state) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent("잘못된 요청입니다.")}`, request.url)
    );
  }
  
  // CSRF 방지: state 검증
  const cookieStore = await cookies();
  const savedState = cookieStore.get("naver_oauth_state")?.value;
  
  if (!savedState || savedState !== state) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent("보안 검증에 실패했습니다.")}`, request.url)
    );
  }
  
  try {
    // 1. 네이버 Access Token 발급
    // 환경 변수에서 줄바꿈/공백 제거
    const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").trim().replace(/\n/g, "");
    const redirectUri = `${baseUrl}/api/auth/naver/callback`;
    
    const tokenResponse = await fetch("https://nid.naver.com/oauth2.0/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: process.env.NAVER_CLIENT_ID!,
        client_secret: process.env.NAVER_CLIENT_SECRET!,
        code: code,
        state: state,
      }),
    });
    
    if (!tokenResponse.ok) {
      throw new Error("네이버 토큰 발급 실패");
    }
    
    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    
    // 2. 네이버 사용자 정보 가져오기
    const userResponse = await fetch("https://openapi.naver.com/v1/nid/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    
    if (!userResponse.ok) {
      throw new Error("네이버 사용자 정보 조회 실패");
    }
    
    const userData = await userResponse.json();
    
    if (userData.resultcode !== "00") {
      throw new Error("네이버 사용자 정보 조회 실패");
    }
    
    const naverUser = userData.response;
    
    // 3. Supabase Service Client 생성
    const serviceSupabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() {
            return [];
          },
          setAll() {},
        },
      }
    );
    
    // 4. 네이버 ID를 기반으로 고유한 이메일 생성
    const naverEmail = naverUser.email || `naver_${naverUser.id}@oauth.temp`;
    
    // 5. Supabase Auth에서 사용자 확인
    const { data: existingAuthUsers } = await serviceSupabase.auth.admin.listUsers();
    const authUser = existingAuthUsers?.users.find(u => u.email === naverEmail);
    
    if (!authUser) {
      // 새 사용자: Supabase Auth에 생성
      const { data: authData, error: authError } = await serviceSupabase.auth.admin.createUser({
        email: naverEmail,
        password: NAVER_USER_PASSWORD, // 고정 비밀번호
        email_confirm: true,
        user_metadata: {
          name: naverUser.name || naverUser.nickname,
          avatar_url: naverUser.profile_image,
          provider: "naver",
          naver_id: naverUser.id,
        },
      });
      
      if (authError || !authData.user) {
        console.error("Supabase Auth 사용자 생성 실패:", authError);
        throw new Error("사용자 생성 실패");
      }
      
      const userId = authData.user.id;
      
      // public.users 테이블에 삽입
      const { error: insertError } = await serviceSupabase
        .from("users")
        .upsert({
          id: userId,
          email: naverEmail,
          name: naverUser.name || naverUser.nickname,
          avatar_url: naverUser.profile_image,
          provider: "naver",
        }, {
          onConflict: "id"
        });
      
      if (insertError) {
        console.error("public.users 삽입 오류:", insertError);
      }
    } else {
      // 기존 사용자: 비밀번호 업데이트 (통일)
      const { error: updateError } = await serviceSupabase.auth.admin.updateUserById(
        authUser.id,
        {
          password: NAVER_USER_PASSWORD,
          user_metadata: {
            name: naverUser.name || naverUser.nickname,
            avatar_url: naverUser.profile_image,
            provider: "naver",
            naver_id: naverUser.id,
          },
        }
      );
      
      if (updateError) {
        console.error("사용자 업데이트 실패:", updateError);
      }
      
      // public.users 테이블도 업데이트
      const { error: updateUsersError } = await serviceSupabase
        .from("users")
        .upsert({
          id: authUser.id,
          email: naverEmail,
          name: naverUser.name || naverUser.nickname,
          avatar_url: naverUser.profile_image,
          provider: "naver",
        }, {
          onConflict: "id"
        });
      
      if (updateUsersError) {
        console.error("public.users 업데이트 오류:", updateUsersError);
      }
    }
    
    // 6. Supabase 클라이언트로 로그인
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );
    
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: naverEmail,
      password: NAVER_USER_PASSWORD,
    });
    
    if (signInError) {
      console.error("로그인 오류:", signInError);
      throw new Error("로그인 실패");
    }
    
    // 7. 메인 페이지로 리다이렉트
    const response = NextResponse.redirect(new URL("/", request.url));
    
    // state 쿠키 삭제
    response.cookies.delete("naver_oauth_state");
    
    return response;
    
  } catch (error) {
    console.error("네이버 로그인 오류:", error);
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent("로그인 처리 중 오류가 발생했습니다.")}`, request.url)
    );
  }
}

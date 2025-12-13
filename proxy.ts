import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      'Missing Supabase environment variables. Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
    );
  }

  // Placeholder 값 감지
  const placeholderPatterns = [
    'your_supabase_project_url',
    'your-project-url',
    'your_supabase_anon_key',
    'your-anon-key'
  ];

  if (placeholderPatterns.some(pattern => url.includes(pattern) || anonKey.includes(pattern))) {
    throw new Error(
      '⚠️ Supabase 환경 변수가 placeholder 값으로 설정되어 있습니다.\n\n' +
      '다음 단계를 따라주세요:\n' +
      '1. Supabase Dashboard (https://supabase.com/dashboard) 접속\n' +
      '2. 프로젝트 선택 > Settings > API\n' +
      '3. Project URL과 anon/public key 복사\n' +
      '4. .env.local 파일에 다음 형식으로 설정:\n' +
      '   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co\n' +
      '   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
    );
  }

  // URL 유효성 검증
  try {
    const urlObj = new URL(url);
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      throw new Error('Invalid URL protocol');
    }
  } catch (error) {
    throw new Error(
      `Invalid Supabase URL: "${url}"\n\n` +
      '올바른 형식: https://xxxxx.supabase.co\n' +
      '.env.local 파일에서 NEXT_PUBLIC_SUPABASE_URL을 확인해주세요.'
    );
  }

  return { url, anonKey };
}

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const { url, anonKey } = getSupabaseEnv();
  const supabase = createServerClient(
    url,
    anonKey,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          supabaseResponse = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          supabaseResponse.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: "",
            ...options,
          });
          supabaseResponse = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          supabaseResponse.cookies.set({
            name,
            value: "",
            ...options,
          });
        },
      },
    }
  );

  // 세션 새로고침 및 보호된 라우트 체크
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isProtectedRoute = request.nextUrl.pathname.startsWith("/my");
  const isAuthRoute = request.nextUrl.pathname.startsWith("/login");

  // 보호된 라우트에 비로그인 사용자가 접근 시 로그인 페이지로 리다이렉트
  if (isProtectedRoute && !user) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // 로그인 페이지는 누구나 접근 가능 (리다이렉트 제거)
  if (isAuthRoute && user) {
    return NextResponse.redirect(new URL("/search", request.url));
  }

  // 루트 페이지 접속 시 로그인된 유저는 /search로 리다이렉트
  if (request.nextUrl.pathname === "/" && user) {
    return NextResponse.redirect(new URL("/search", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

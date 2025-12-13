import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

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

export async function createClient() {
  const cookieStore = await cookies();
  const { url, anonKey } = getSupabaseEnv();

  return createServerClient(
    url,
    anonKey,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // 쿠키 설정 실패 시 무시 (미들웨어에서 처리)
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch (error) {
            // 쿠키 삭제 실패 시 무시
          }
        },
      },
    }
  );
}


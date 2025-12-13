import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { isAdmin } from "@/lib/admin-utils";
import {
  createErrorResponse,
  createUnauthorizedError,
  createForbiddenError,
} from "@/lib/api-error-handler";

/**
 * 환경 변수 설정 상태 확인 (관리자 전용)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw createUnauthorizedError("로그인이 필요합니다");
    }

    // 관리자 권한 체크
    if (!isAdmin(user.email)) {
      throw createForbiddenError("관리자 권한이 필요합니다");
    }

    // 환경 변수 존재 여부 확인 (값은 노출하지 않음)
    const envStatus = {
      GOOGLE_CALENDAR_CLIENT_ID: !!process.env.GOOGLE_CALENDAR_CLIENT_ID,
      GOOGLE_CALENDAR_CLIENT_SECRET: !!process.env.GOOGLE_CALENDAR_CLIENT_SECRET,
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_APP_URL: !!process.env.NEXT_PUBLIC_APP_URL,
      ADMIN_EMAILS: !!process.env.ADMIN_EMAILS,
      NEXT_PUBLIC_ADMIN_EMAILS: !!process.env.NEXT_PUBLIC_ADMIN_EMAILS,
    };

    // 관리자 이메일 목록 확인 (디버깅용)
    const { getAdminEmails } = await import("@/lib/admin-utils");
    const adminEmails = getAdminEmails();

    const missingEnvVars = Object.entries(envStatus)
      .filter(([_, exists]) => !exists)
      .map(([key]) => key);

    return NextResponse.json({
      status: missingEnvVars.length === 0 ? "ok" : "missing_vars",
      envStatus,
      missingEnvVars,
      adminEmailsCount: adminEmails.length,
      message:
        missingEnvVars.length === 0
          ? "모든 필수 환경 변수가 설정되어 있습니다."
          : `다음 환경 변수가 설정되지 않았습니다: ${missingEnvVars.join(", ")}`,
    });
  } catch (error) {
    return createErrorResponse(error, "환경 변수 확인 중 오류가 발생했습니다");
  }
}

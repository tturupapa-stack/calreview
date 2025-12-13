import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { isAdmin, getAdminEmails } from "@/lib/admin-utils";
import { createErrorResponse, createUnauthorizedError } from "@/lib/api-error-handler";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ isAdmin: false }, { status: 401 });
    }

    const userEmail = user.email || "";
    const adminEmails = getAdminEmails();
    const userIsAdmin = isAdmin(userEmail);

    // 디버깅 정보 (프로덕션에서는 제거 가능)
    console.log("관리자 체크:", {
      userEmail,
      normalizedUserEmail: userEmail.trim().toLowerCase(),
      adminEmails,
      hasAdminEmails: adminEmails.length > 0,
      isAdmin: userIsAdmin,
      hasADMIN_EMAILS: !!process.env.ADMIN_EMAILS,
      hasNEXT_PUBLIC_ADMIN_EMAILS: !!process.env.NEXT_PUBLIC_ADMIN_EMAILS,
    });

    return NextResponse.json({ 
      isAdmin: userIsAdmin,
      // 디버깅 정보 (프로덕션에서는 제거)
      debug: {
        userEmail: userEmail.trim().toLowerCase(),
        adminEmailsCount: adminEmails.length,
        hasADMIN_EMAILS: !!process.env.ADMIN_EMAILS,
        hasNEXT_PUBLIC_ADMIN_EMAILS: !!process.env.NEXT_PUBLIC_ADMIN_EMAILS,
      }
    });
  } catch (error) {
    console.error("관리자 체크 오류:", error);
    return createErrorResponse(error, "관리자 권한 확인 중 오류가 발생했습니다");
  }
}

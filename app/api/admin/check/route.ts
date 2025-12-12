import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { isAdmin } from "@/lib/admin-utils";
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

    const userIsAdmin = isAdmin(user.email);

    return NextResponse.json({ isAdmin: userIsAdmin });
  } catch (error) {
    console.error("관리자 체크 오류:", error);
    return createErrorResponse(error, "관리자 권한 확인 중 오류가 발생했습니다");
  }
}

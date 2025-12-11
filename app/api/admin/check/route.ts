import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ isAdmin: false }, { status: 401 });
    }

    // 관리자 이메일 체크 (환경 변수 또는 하드코딩)
    // TODO: 실제 운영 환경에서는 users 테이블에 is_admin 필드를 추가하는 것을 권장
    const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(",") || [];
    const isAdmin = adminEmails.includes(user.email || "");

    return NextResponse.json({ isAdmin });
  } catch (error) {
    console.error("관리자 체크 오류:", error);
    return NextResponse.json({ isAdmin: false }, { status: 500 });
  }
}

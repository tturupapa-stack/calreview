import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { isAdmin } from "@/lib/admin-utils";
import {
  createErrorResponse,
  createUnauthorizedError,
  createForbiddenError,
  createBadRequestError,
  createNotFoundError,
} from "@/lib/api-error-handler";

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

    // Service role로 모든 문의 조회
    const serviceSupabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await serviceSupabase
      .from("inquiries")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ inquiries: data || [] });
  } catch (error) {
    return createErrorResponse(error, "문의 내역 조회 중 오류가 발생했습니다");
  }
}

export async function PATCH(request: NextRequest) {
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

    const body = await request.json();
    const { id, status, admin_response } = body;

    if (!id) {
      throw createBadRequestError("ID가 필요합니다");
    }

    // 상태 값 검증
    if (status && !["pending", "in_progress", "completed"].includes(status)) {
      throw createBadRequestError("유효하지 않은 상태 값입니다");
    }

    // Service role로 문의 업데이트
    const serviceSupabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const updateData: {
      status?: string;
      admin_response?: string | null;
      admin_response_at?: string | null;
    } = {};

    if (status) {
      updateData.status = status;
    }

    if (admin_response !== undefined) {
      updateData.admin_response = admin_response;
      updateData.admin_response_at = admin_response
        ? new Date().toISOString()
        : null;
    }

    const { data, error } = await serviceSupabase
      .from("inquiries")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      throw createNotFoundError("문의를 찾을 수 없습니다");
    }

    return NextResponse.json({ inquiry: data });
  } catch (error) {
    return createErrorResponse(error, "문의 업데이트 중 오류가 발생했습니다");
  }
}

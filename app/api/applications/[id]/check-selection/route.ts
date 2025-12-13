import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { getSelectionChecker } from "@/lib/selection-checkers";
import { calculateReviewDeadlineString } from "@/lib/review-deadline-calculator";

/**
 * 당첨 여부 자동 확인 API
 * 원본 사이트를 크롤링하여 당첨 여부를 확인합니다.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

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

    // 신청 정보 조회
    const { data: application, error: fetchError } = await supabase
      .from("applications")
      .select(`
        *,
        campaigns (
          id,
          source,
          source_url,
          title,
          application_deadline,
          review_deadline_days
        )
      `)
      .eq("id", id)
      .single();

    if (fetchError || !application) {
      return NextResponse.json(
        { error: "존재하지 않는 신청입니다." },
        { status: 404 }
      );
    }

    if (application.user_id !== user.id) {
      return NextResponse.json(
        { error: "권한이 없습니다." },
        { status: 403 }
      );
    }

    // 이미 선정 처리된 경우
    if (application.status === "selected") {
      return NextResponse.json({
        isSelected: true,
        message: "이미 선정 처리된 신청입니다.",
      });
    }

    // 신청 마감일 확인 (마감일이 지나지 않았으면 확인 불가)
    if (application.campaigns?.application_deadline) {
      const deadline = new Date(application.campaigns.application_deadline);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (deadline >= today) {
        return NextResponse.json({
          isSelected: false,
          message: "신청 마감일이 지나지 않아 확인할 수 없습니다.",
          canCheck: false,
        });
      }
    }

    // 사이트별 당첨 확인 크롤러 가져오기
    const checker = getSelectionChecker(application.campaigns?.source || "");
    
    if (!checker) {
      return NextResponse.json({
        isSelected: false,
        message: "해당 사이트의 자동 확인 기능이 아직 지원되지 않습니다.",
        canCheck: false,
        manualInput: true, // 수동 입력 가능
      });
    }

    // 당첨 여부 확인
    let isSelected = false;
    try {
      isSelected = await checker.checkSelection(
        user,
        application.campaigns?.source_url || ""
      );
    } catch (error: any) {
      console.error("당첨 확인 오류:", error);
      return NextResponse.json({
        isSelected: false,
        message: error.message || "당첨 확인 중 오류가 발생했습니다.",
        error: true,
        manualInput: true, // 수동 입력 가능
      });
    }

    // 당첨된 경우 자동으로 선정 처리
    if (isSelected) {
      // 선정일 계산 (신청 마감일 + 1일, 또는 오늘)
      const selectionDate = application.campaigns?.application_deadline
        ? new Date(application.campaigns.application_deadline)
        : new Date();
      
      // 마감일이 지났으면 오늘을 선정일로
      if (selectionDate < new Date()) {
        selectionDate.setTime(Date.now());
      } else {
        // 마감일 다음날
        selectionDate.setDate(selectionDate.getDate() + 1);
      }

      // 리뷰 마감일 계산 (개선된 계산기 사용)
      const reviewDeadlineStr = calculateReviewDeadlineString(
        application.campaigns as any,
        selectionDate
      );

      // 상태 업데이트
      const updateData: any = {
        status: "selected",
        updated_at: new Date().toISOString(),
        auto_detected: true,
        detected_at: new Date().toISOString(),
        review_deadline: reviewDeadlineStr,
      };

      const { error: updateError } = await supabase
        .from("applications")
        .update(updateData)
        .eq("id", id);

      if (updateError) {
        console.error("상태 업데이트 오류:", updateError);
        return NextResponse.json({
          isSelected: true,
          message: "당첨 확인은 되었으나 상태 업데이트 중 오류가 발생했습니다.",
          error: true,
        });
      }

      // 캘린더 연동 (비동기로 처리)
      try {
        const { data: userData } = await supabase
          .from("users")
          .select("google_calendar_connected")
          .eq("id", user.id)
          .single();

        if (userData?.google_calendar_connected) {
          // 캘린더 연동은 백그라운드에서 처리
          fetch(`${request.nextUrl.origin}/api/applications/${id}/calendar`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
          }).catch((err) => {
            console.error("캘린더 연동 오류:", err);
          });
        }
      } catch (err) {
        console.error("캘린더 연동 요청 오류:", err);
      }

      return NextResponse.json({
        isSelected: true,
        message: "당첨 확인되었습니다! 자동으로 선정 처리되었습니다.",
        autoUpdated: true,
        selectionDate: selectionDate.toISOString().split("T")[0],
        reviewDeadline: reviewDeadlineStr,
      });
    }

    return NextResponse.json({
      isSelected: false,
      message: "아직 당첨되지 않았습니다. 나중에 다시 확인해주세요.",
      manualInput: true,
    });
  } catch (error: any) {
    console.error("당첨 확인 API 오류:", error);
    return NextResponse.json(
      { error: error.message || "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

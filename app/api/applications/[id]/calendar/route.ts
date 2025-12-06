import { createClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";
import {
  createCalendarEvent,
  deleteCalendarEvent,
} from "@/lib/google-calendar";

/**
 * 당첨 등록 시 구글 캘린더에 일정 생성
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

    // 캘린더 연결 상태 확인
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("google_calendar_connected, google_refresh_token")
      .eq("id", user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { error: "사용자 정보를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 구글 캘린더 자동 연동 (모든 사용자에게 무료 제공)

    if (!userData.google_calendar_connected || !userData.google_refresh_token) {
      return NextResponse.json(
        { error: "구글 캘린더가 연결되지 않았습니다." },
        { status: 400 }
      );
    }

    // 신청 정보 조회
    const { data: application, error: appError } = await supabase
      .from("applications")
      .select(
        `
        *,
        campaigns (
          id,
          title,
          region,
          source_url
        )
      `
      )
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (appError || !application) {
      return NextResponse.json(
        { error: "신청 정보를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    if (application.status !== "selected") {
      return NextResponse.json(
        { error: "당첨 상태가 아닙니다." },
        { status: 400 }
      );
    }

    if (!application.visit_date && !application.review_deadline) {
      return NextResponse.json(
        { error: "방문일 또는 리뷰 마감일이 필요합니다." },
        { status: 400 }
      );
    }

    const eventIds: { visitEventId?: string; deadlineEventId?: string } = {};

    // 방문일 이벤트 생성
    if (application.visit_date) {
      const visitDate = new Date(application.visit_date);
      visitDate.setHours(12, 0, 0, 0); // 오후 12시
      const visitEndDate = new Date(visitDate);
      visitEndDate.setHours(14, 0, 0, 0); // 오후 2시

      const visitEventId = await createCalendarEvent(
        userData.google_refresh_token,
        {
          summary: `[체험단] ${application.campaigns.title}`,
          description: `체험단 방문 예정일\n원본 링크: ${application.campaigns.source_url}`,
          startDate: visitDate.toISOString(),
          endDate: visitEndDate.toISOString(),
          location: application.campaigns.region || "",
          reminders: {
            useDefault: false,
            overrides: [
              { method: "email", minutes: 24 * 60 }, // 1일 전
              { method: "popup", minutes: 60 }, // 1시간 전
            ],
          },
        }
      );

      eventIds.visitEventId = visitEventId;
    }

    // 리뷰 마감일 이벤트 생성
    if (application.review_deadline) {
      const deadlineDate = new Date(application.review_deadline);
      deadlineDate.setHours(23, 59, 0, 0); // 자정 직전
      const deadlineEndDate = new Date(deadlineDate);
      deadlineEndDate.setHours(23, 59, 59, 0);

      const deadlineEventId = await createCalendarEvent(
        userData.google_refresh_token,
        {
          summary: `[체험단 리뷰 마감] ${application.campaigns.title}`,
          description: `리뷰 작성 마감일\n원본 링크: ${application.campaigns.source_url}`,
          startDate: deadlineDate.toISOString(),
          endDate: deadlineEndDate.toISOString(),
          location: application.campaigns.region || "",
          reminders: {
            useDefault: false,
            overrides: [
              { method: "email", minutes: 3 * 24 * 60 }, // 3일 전
              { method: "email", minutes: 1 * 24 * 60 }, // 1일 전
              { method: "popup", minutes: 60 }, // 1시간 전
            ],
          },
        }
      );

      eventIds.deadlineEventId = deadlineEventId;
    }

    // applications 테이블에 이벤트 ID 저장
    const { error: updateError } = await supabase
      .from("applications")
      .update({
        calendar_visit_event_id: eventIds.visitEventId || null,
        calendar_deadline_event_id: eventIds.deadlineEventId || null,
      })
      .eq("id", id);

    if (updateError) {
      console.error("이벤트 ID 저장 오류:", updateError);
      // 이미 생성된 이벤트는 삭제
      if (eventIds.visitEventId) {
        try {
          await deleteCalendarEvent(
            userData.google_refresh_token,
            eventIds.visitEventId
          );
        } catch (e) {
          console.error("방문일 이벤트 삭제 실패:", e);
        }
      }
      if (eventIds.deadlineEventId) {
        try {
          await deleteCalendarEvent(
            userData.google_refresh_token,
            eventIds.deadlineEventId
          );
        } catch (e) {
          console.error("마감일 이벤트 삭제 실패:", e);
        }
      }
      throw updateError;
    }

    return NextResponse.json({
      success: true,
      message: "구글 캘린더에 일정이 추가되었습니다.",
      eventIds,
    });
  } catch (error: any) {
    console.error("캘린더 일정 생성 오류:", error);
    return NextResponse.json(
      { error: error.message || "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

/**
 * 캘린더 일정 삭제
 */
export async function DELETE(
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

    // 사용자 정보 조회
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("google_refresh_token")
      .eq("id", user.id)
      .single();

    if (userError || !userData || !userData.google_refresh_token) {
      return NextResponse.json(
        { error: "구글 캘린더가 연결되지 않았습니다." },
        { status: 400 }
      );
    }

    // 신청 정보 조회
    const { data: application, error: appError } = await supabase
      .from("applications")
      .select("calendar_visit_event_id, calendar_deadline_event_id")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (appError || !application) {
      return NextResponse.json(
        { error: "신청 정보를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 캘린더 이벤트 삭제
    if (application.calendar_visit_event_id) {
      try {
        await deleteCalendarEvent(
          userData.google_refresh_token,
          application.calendar_visit_event_id
        );
      } catch (error) {
        console.error("방문일 이벤트 삭제 오류:", error);
      }
    }

    if (application.calendar_deadline_event_id) {
      try {
        await deleteCalendarEvent(
          userData.google_refresh_token,
          application.calendar_deadline_event_id
        );
      } catch (error) {
        console.error("마감일 이벤트 삭제 오류:", error);
      }
    }

    // applications 테이블에서 이벤트 ID 제거
    const { error: updateError } = await supabase
      .from("applications")
      .update({
        calendar_visit_event_id: null,
        calendar_deadline_event_id: null,
      })
      .eq("id", id);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      success: true,
      message: "구글 캘린더 일정이 삭제되었습니다.",
    });
  } catch (error: any) {
    console.error("캘린더 일정 삭제 오류:", error);
    return NextResponse.json(
      { error: error.message || "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}


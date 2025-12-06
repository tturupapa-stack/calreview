import { createClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";
import {
  createCalendarEvent,
} from "@/lib/google-calendar";

// 신청 상태 업데이트 (당첨, 완료, 취소)
export async function PATCH(
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

    const body = await request.json();
    const { status, visit_date, review_deadline, notes } = body;

    if (!status) {
      return NextResponse.json(
        { error: "상태가 필요합니다." },
        { status: 400 }
      );
    }

    // 유효한 상태인지 확인
    const validStatuses = ["bookmarked", "applied", "selected", "completed", "cancelled"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "유효하지 않은 상태입니다." },
        { status: 400 }
      );
    }

    // 신청이 본인 것인지 확인
    const { data: application, error: fetchError } = await supabase
      .from("applications")
      .select("user_id")
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

    // 업데이트 데이터 준비
    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (visit_date) {
      updateData.visit_date = visit_date;
    }

    if (review_deadline) {
      updateData.review_deadline = review_deadline;
    }

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    // 신청 상태 업데이트
    const { data, error } = await supabase
      .from("applications")
      .update(updateData)
      .eq("id", id)
      .select(
        `
        *,
        campaigns (
          id,
          title,
          thumbnail_url,
          category,
          region,
          channel,
          type,
          source_url,
          application_deadline
        )
      `
      )
      .single();

    if (error) {
      console.error("신청 상태 업데이트 오류:", error);
      throw error;
    }

    // 당첨 상태이고 방문일 또는 리뷰 마감일이 있으면 자동으로 캘린더에 추가
    if (status === "selected" && (visit_date || review_deadline)) {
      try {
        // 사용자 정보 조회 (캘린더 연결 상태)
        const { data: userData } = await supabase
          .from("users")
          .select("google_calendar_connected, google_refresh_token")
          .eq("id", user.id)
          .single();

        // 구글 캘린더 자동 연동 (모든 사용자에게 무료 제공)
        if (
          userData?.google_calendar_connected &&
          userData?.google_refresh_token
        ) {
          const eventIds: { visitEventId?: string; deadlineEventId?: string } = {};

          // 방문일 이벤트 생성
          if (visit_date && !data.calendar_visit_event_id) {
            try {
              const visitDate = new Date(visit_date);
              visitDate.setHours(12, 0, 0, 0);
              const visitEndDate = new Date(visitDate);
              visitEndDate.setHours(14, 0, 0, 0);

              const visitEventId = await createCalendarEvent(
                userData.google_refresh_token,
                {
                  summary: `[체험단] ${data.campaigns.title}`,
                  description: `체험단 방문 예정일\n원본 링크: ${data.campaigns.source_url}`,
                  startDate: visitDate.toISOString(),
                  endDate: visitEndDate.toISOString(),
                  location: data.campaigns.region || "",
                  reminders: {
                    useDefault: false,
                    overrides: [
                      { method: "email", minutes: 24 * 60 },
                      { method: "popup", minutes: 60 },
                    ],
                  },
                }
              );

              eventIds.visitEventId = visitEventId;
            } catch (error) {
              console.error("방문일 캘린더 이벤트 생성 오류:", error);
            }
          }

          // 리뷰 마감일 이벤트 생성
          if (review_deadline && !data.calendar_deadline_event_id) {
            try {
              const deadlineDate = new Date(review_deadline);
              deadlineDate.setHours(23, 59, 0, 0);
              const deadlineEndDate = new Date(deadlineDate);
              deadlineEndDate.setHours(23, 59, 59, 0);

              const deadlineEventId = await createCalendarEvent(
                userData.google_refresh_token,
                {
                  summary: `[체험단 리뷰 마감] ${data.campaigns.title}`,
                  description: `리뷰 작성 마감일\n원본 링크: ${data.campaigns.source_url}`,
                  startDate: deadlineDate.toISOString(),
                  endDate: deadlineEndDate.toISOString(),
                  location: data.campaigns.region || "",
                  reminders: {
                    useDefault: false,
                    overrides: [
                      { method: "email", minutes: 3 * 24 * 60 },
                      { method: "email", minutes: 1 * 24 * 60 },
                      { method: "popup", minutes: 60 },
                    ],
                  },
                }
              );

              eventIds.deadlineEventId = deadlineEventId;
            } catch (error) {
              console.error("마감일 캘린더 이벤트 생성 오류:", error);
            }
          }

          // 이벤트 ID가 생성되었으면 applications 테이블 업데이트
          if (eventIds.visitEventId || eventIds.deadlineEventId) {
            const calendarUpdateData: any = {};
            if (eventIds.visitEventId) {
              calendarUpdateData.calendar_visit_event_id = eventIds.visitEventId;
            }
            if (eventIds.deadlineEventId) {
              calendarUpdateData.calendar_deadline_event_id = eventIds.deadlineEventId;
            }

            await supabase
              .from("applications")
              .update(calendarUpdateData)
              .eq("id", id);

            // 응답 데이터에도 반영
            if (data) {
              data.calendar_visit_event_id = eventIds.visitEventId || data.calendar_visit_event_id;
              data.calendar_deadline_event_id = eventIds.deadlineEventId || data.calendar_deadline_event_id;
            }
          }
        }
      } catch (error) {
        // 캘린더 연동 실패해도 상태 업데이트는 성공으로 처리
        console.error("캘린더 자동 연동 오류:", error);
      }
    }

    return NextResponse.json({
      success: true,
      application: data,
      message: "상태가 업데이트되었습니다.",
    });
  } catch (error: any) {
    console.error("API 오류:", error);
    return NextResponse.json(
      { error: error.message || "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// 신청 취소 (DELETE는 취소로 처리)
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

    // 신청이 본인 것인지 확인
    const { data: application, error: fetchError } = await supabase
      .from("applications")
      .select("user_id, status")
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

    // 취소 상태로 변경 (실제 삭제는 하지 않음)
    const { data, error } = await supabase
      .from("applications")
      .update({
        status: "cancelled",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("신청 취소 오류:", error);
      throw error;
    }

    return NextResponse.json({
      success: true,
      application: data,
      message: "신청이 취소되었습니다.",
    });
  } catch (error: any) {
    console.error("API 오류:", error);
    return NextResponse.json(
      { error: error.message || "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}


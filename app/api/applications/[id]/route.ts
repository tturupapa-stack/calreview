import { createClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";
import {
  createCalendarEvent,
  updateCalendarEvent,
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

    console.log("[API] 요청 본문:", {
      status,
      visit_date,
      review_deadline,
      hasVisitDate: !!visit_date,
      hasReviewDeadline: !!review_deadline,
    });

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

    // 신청이 본인 것인지 확인 (기존 데이터도 함께 조회)
    const { data: existingApplication, error: fetchError } = await supabase
      .from("applications")
      .select("user_id, visit_date, review_deadline, calendar_visit_event_id, calendar_deadline_event_id")
      .eq("id", id)
      .single();

    if (fetchError || !existingApplication) {
      return NextResponse.json(
        { error: "존재하지 않는 신청입니다." },
        { status: 404 }
      );
    }

    if (existingApplication.user_id !== user.id) {
      return NextResponse.json(
        { error: "권한이 없습니다." },
        { status: 403 }
      );
    }

    // 날짜는 요청 본문에 있으면 사용하고, 없으면 기존 데이터 사용
    const finalVisitDate = visit_date || existingApplication.visit_date;
    const finalReviewDeadline = review_deadline || existingApplication.review_deadline;

    console.log("[API] 최종 날짜:", {
      finalVisitDate,
      finalReviewDeadline,
      visit_date_from_request: visit_date,
      review_deadline_from_request: review_deadline,
      existing_visit_date: existingApplication.visit_date,
      existing_review_deadline: existingApplication.review_deadline,
    });

    // 업데이트 데이터 준비
    type ApplicationUpdateData = {
      status: string;
      updated_at: string;
      visit_date?: string;
      review_deadline?: string;
      notes?: string;
    };

    const updateData: ApplicationUpdateData = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (finalVisitDate) {
      updateData.visit_date = finalVisitDate;
    }

    if (finalReviewDeadline) {
      updateData.review_deadline = finalReviewDeadline;
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
    console.log("[캘린더 등록] 상태 확인:", {
      status,
      finalVisitDate,
      finalReviewDeadline,
      hasVisitDate: !!finalVisitDate,
      hasReviewDeadline: !!finalReviewDeadline,
    });

    const calendarErrors: string[] = [];

    if (status === "selected" && (finalVisitDate || finalReviewDeadline)) {
      try {
        // 사용자 정보 조회 (캘린더 연결 상태)
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("google_calendar_connected, google_refresh_token")
          .eq("id", user.id)
          .single();

        if (userError) {
          console.error("[캘린더 등록] 사용자 정보 조회 오류:", userError);
          throw userError;
        }

        console.log("[캘린더 등록] 사용자 정보:", {
          userId: user.id,
          google_calendar_connected: userData?.google_calendar_connected,
          hasRefreshToken: !!userData?.google_refresh_token,
        });

        if (
          userData?.google_calendar_connected &&
          userData?.google_refresh_token
        ) {
          console.log("[캘린더 등록] 구글 캘린더 연결 확인됨, 이벤트 생성 시작");
          // campaigns 데이터 null 체크
          if (!data.campaigns) {
            console.error("[캘린더 등록] 캠페인 데이터가 없습니다. application_id:", id);
            throw new Error("캠페인 정보를 찾을 수 없습니다.");
          }

          console.log("[캘린더 등록] 캠페인 정보:", {
            campaignId: data.campaigns.id,
            campaignTitle: data.campaigns.title,
          });

          const eventIds: { visitEventId?: string; deadlineEventId?: string } = {};

          // 방문일 이벤트 처리 (생성 또는 업데이트)
          if (finalVisitDate) {
            // 날짜 문자열(YYYY-MM-DD)을 기반으로 정확한 ISO 문자열 생성 (KST 12:00)
            const startDate = `${finalVisitDate}T12:00:00+09:00`;
            const endDate = `${finalVisitDate}T14:00:00+09:00`;
            const summary = `[체험단] ${data.campaigns.title}`;
            const description = `체험단 방문 예정일\n원본 링크: ${data.campaigns.source_url}`;
            const location = data.campaigns.region || "";

            if (existingApplication.calendar_visit_event_id) {
              console.log("[캘린더 등록] 방문일 이벤트 업데이트 시도:", {
                eventId: existingApplication.calendar_visit_event_id,
                finalVisitDate
              });
              try {
                await updateCalendarEvent(
                  userData.google_refresh_token,
                  existingApplication.calendar_visit_event_id,
                  {
                    summary,
                    description,
                    startDate,
                    endDate,
                    location,
                  }
                );
                console.log("[캘린더 등록] 방문일 이벤트 업데이트 성공");
              } catch (error) {
                console.error("[캘린더 등록] 방문일 이벤트 업데이트 오류:", error);
                calendarErrors.push("방문일 일정 업데이트 실패");
              }
            } else {
              // 신규 생성
              console.log("[캘린더 등록] 방문일 이벤트 생성 시도:", finalVisitDate);
              try {
                const visitEventId = await createCalendarEvent(
                  userData.google_refresh_token,
                  {
                    summary,
                    description,
                    startDate,
                    endDate,
                    location,
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
                console.log("[캘린더 등록] 방문일 캘린더 이벤트 생성 성공:", visitEventId);
              } catch (error) {
                console.error("[캘린더 등록] 방문일 이벤트 생성 오류:", error);
                calendarErrors.push("방문일 일정 생성 실패");
              }
            }
          }

          // 리뷰 마감일 이벤트 처리 (생성 또는 업데이트)
          if (finalReviewDeadline) {
            // 날짜 문자열(YYYY-MM-DD)을 기반으로 정확한 ISO 문자열 생성 (KST 23:59:00, 23:59:59)
            const startDate = `${finalReviewDeadline}T23:59:00+09:00`;
            const endDate = `${finalReviewDeadline}T23:59:59+09:00`;
            const summary = `[체험단 리뷰 마감] ${data.campaigns.title}`;
            const description = `리뷰 작성 마감일\n원본 링크: ${data.campaigns.source_url}`;
            const location = data.campaigns.region || "";

            if (existingApplication.calendar_deadline_event_id) {
              console.log("[캘린더 등록] 리뷰 마감일 이벤트 업데이트 시도:", {
                eventId: existingApplication.calendar_deadline_event_id,
                finalReviewDeadline
              });
              try {
                await updateCalendarEvent(
                  userData.google_refresh_token,
                  existingApplication.calendar_deadline_event_id,
                  {
                    summary,
                    description,
                    startDate,
                    endDate,
                    location,
                  }
                );
                console.log("[캘린더 등록] 리뷰 마감일 이벤트 업데이트 성공");
              } catch (error) {
                console.error("[캘린더 등록] 리뷰 마감일 이벤트 업데이트 오류:", error);
                calendarErrors.push("리뷰 마감일 일정 업데이트 실패");
              }
            } else {
              // 신규 생성
              console.log("[캘린더 등록] 리뷰 마감일 이벤트 생성 시도:", finalReviewDeadline);
              try {
                const deadlineEventId = await createCalendarEvent(
                  userData.google_refresh_token,
                  {
                    summary,
                    description,
                    startDate,
                    endDate,
                    location,
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
                console.log("[캘린더 등록] 리뷰 마감일 캘린더 이벤트 생성 성공:", deadlineEventId);
              } catch (error) {
                console.error("[캘린더 등록] 리뷰 마감일 이벤트 생성 오류:", error);
                calendarErrors.push("리뷰 마감일 일정 생성 실패");
              }
            }
          }

          // 이벤트 ID가 생성되었으면 applications 테이블 업데이트
          console.log("[캘린더 등록] 생성된 이벤트 ID:", eventIds);
          if (eventIds.visitEventId || eventIds.deadlineEventId) {
            type CalendarUpdateData = {
              calendar_visit_event_id?: string;
              calendar_deadline_event_id?: string;
            };
            const calendarUpdateData: CalendarUpdateData = {};
            if (eventIds.visitEventId) {
              calendarUpdateData.calendar_visit_event_id = eventIds.visitEventId;
            }
            if (eventIds.deadlineEventId) {
              calendarUpdateData.calendar_deadline_event_id = eventIds.deadlineEventId;
            }

            console.log("[캘린더 등록] applications 테이블 업데이트:", calendarUpdateData);
            const { error: updateError } = await supabase
              .from("applications")
              .update(calendarUpdateData)
              .eq("id", id);

            if (updateError) {
              console.error("[캘린더 등록] applications 테이블 업데이트 오류:", updateError);
            } else {
              console.log("[캘린더 등록] applications 테이블 업데이트 성공");
            }

            // 응답 데이터에도 반영
            if (data) {
              data.calendar_visit_event_id = eventIds.visitEventId || data.calendar_visit_event_id;
              data.calendar_deadline_event_id = eventIds.deadlineEventId || data.calendar_deadline_event_id;
            }
          } else {
            console.log("[캘린더 등록] 생성된 이벤트가 없어서 테이블 업데이트를 건너뜁니다.");
          }
        } else {
          console.log("[캘린더 등록] 구글 캘린더 상태 확인:", {
            userId: user.id,
            google_calendar_connected: userData?.google_calendar_connected,
            hasRefreshToken: !!userData?.google_refresh_token,
          });

          // 연결되었다고 표시되어 있지만 토큰이 없는 경우 (오류 상황)
          if (userData?.google_calendar_connected && !userData?.google_refresh_token) {
            calendarErrors.push("구글 캘린더 연결이 만료되었습니다. 설정에서 연결 해제 후 다시 연결해주세요.");
          }
          // 아예 연결 안된 경우는 오류 아님 (무시)
        }
      } catch (error) {
        // 캘린더 연동 실패해도 상태 업데이트는 성공으로 처리
        console.error("[캘린더 등록] 캘린더 자동 연동 오류:", error);
        // 에러 상세 정보 로깅
        if (error instanceof Error) {
          console.error("[캘린더 등록] 에러 메시지:", error.message);
          console.error("[캘린더 등록] 에러 스택:", error.stack);
        }
      }
    } else if (status === "selected") {
      console.log("[캘린더 등록] 선정 상태이지만 방문일/리뷰 마감일이 없습니다. visit_date:", finalVisitDate, "review_deadline:", finalReviewDeadline);
    } else {
      console.log("[캘린더 등록] 캘린더 등록 조건 불만족:", {
        status,
        isSelected: status === "selected",
        hasVisitDate: !!finalVisitDate,
        hasReviewDeadline: !!finalReviewDeadline,
      });
    }

    const responseData: any = {
      success: true,
      application: data,
      message: "상태가 업데이트되었습니다.",
    };

    // 캘린더 등록 관련 정보 추가
    if (status === "selected") {
      responseData.calendarInfo = {
        visitEventId: data?.calendar_visit_event_id,
        deadlineEventId: data?.calendar_deadline_event_id,
        errors: calendarErrors || [],
      };
    }

    console.log("[API] 최종 응답 데이터:", {
      applicationId: data?.id,
      status: data?.status,
      calendar_visit_event_id: data?.calendar_visit_event_id,
      calendar_deadline_event_id: data?.calendar_deadline_event_id,
      calendarErrors: calendarErrors || [],
    });

    return NextResponse.json(responseData);
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


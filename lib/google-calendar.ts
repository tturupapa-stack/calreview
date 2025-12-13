import { google } from "googleapis";

function getGoogleCalendarEnv() {
  const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CALENDAR_CLIENT_SECRET;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!clientId || !clientSecret || !supabaseUrl) {
    throw new Error(
      'Missing Google Calendar environment variables. Please check GOOGLE_CALENDAR_CLIENT_ID, GOOGLE_CALENDAR_CLIENT_SECRET, and NEXT_PUBLIC_SUPABASE_URL.'
    );
  }

  return { clientId, clientSecret, redirectUri: `${supabaseUrl}/api/auth/google-calendar/callback` };
}

/**
 * Google Calendar API 클라이언트 생성
 */
export function createCalendarClient(refreshToken: string) {
  const { clientId, clientSecret, redirectUri } = getGoogleCalendarEnv();
  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    redirectUri
  );

  oauth2Client.setCredentials({
    refresh_token: refreshToken,
  });

  // 토큰 갱신 시 자동 재시도 설정
  oauth2Client.on("tokens", (tokens) => {
    if (tokens.refresh_token) {
      // refresh_token이 새로 발급된 경우 업데이트할 수 있음
      // 현재는 저장하지 않고, 만료 시 재인증 요구
    }
  });

  return google.calendar({ version: "v3", auth: oauth2Client });
}

/**
 * 인증 오류인지 확인 (토큰 만료 등)
 */
export function isAuthenticationError(error: any): boolean {
  // 401 Unauthorized
  if (error.code === 401 || error.response?.status === 401) {
    return true;
  }

  // invalid_grant 에러 (토큰 만료, 취소 등)
  if (error.message?.includes('invalid_grant')) {
    return true;
  }

  // 응답 데이터에 에러 코드가 있는 경우
  if (error.response?.data?.error) {
    const errorCode = error.response.data.error;
    if (
      errorCode === 'invalid_grant' ||
      errorCode === 'invalid_client' ||
      errorCode === 'unauthorized'
    ) {
      return true;
    }
  }

  return false;
}

/**
 * 캘린더 이벤트 생성
 */
export async function createCalendarEvent(
  refreshToken: string,
  options: {
    summary: string;
    description?: string;
    startDate: string; // ISO 8601 format
    endDate: string; // ISO 8601 format
    location?: string;
    reminders?: {
      useDefault?: boolean;
      overrides?: Array<{ method: "email" | "popup"; minutes: number }>;
    };
  }
): Promise<string> {
  try {
    console.log("[구글 캘린더 API] 이벤트 생성 시작:", {
      summary: options.summary,
      startDate: options.startDate,
      endDate: options.endDate,
    });

  const calendar = createCalendarClient(refreshToken);

  const event = {
    summary: options.summary,
    description: options.description || "",
    start: {
      dateTime: options.startDate,
      timeZone: "Asia/Seoul",
    },
    end: {
      dateTime: options.endDate,
      timeZone: "Asia/Seoul",
    },
    location: options.location,
    reminders: options.reminders || {
      useDefault: false,
      overrides: [
        { method: "email", minutes: 24 * 60 }, // 1일 전
        { method: "popup", minutes: 60 }, // 1시간 전
      ],
    },
  };

    console.log("[구글 캘린더 API] 이벤트 데이터:", JSON.stringify(event, null, 2));

  const response = await calendar.events.insert({
    calendarId: "primary",
    requestBody: event,
  });

    const eventId = response.data.id || "";
    console.log("[구글 캘린더 API] 이벤트 생성 성공:", eventId);
    return eventId;
  } catch (error: any) {
    console.error("[구글 캘린더 API] 이벤트 생성 오류:", error);
    if (error.response) {
      console.error("[구글 캘린더 API] 응답 상태:", error.response.status);
      console.error("[구글 캘린더 API] 응답 데이터:", error.response.data);
    }
    if (error.message) {
      console.error("[구글 캘린더 API] 에러 메시지:", error.message);
    }
    throw error;
  }
}

/**
 * 캘린더 이벤트 업데이트
 */
export async function updateCalendarEvent(
  refreshToken: string,
  eventId: string,
  options: {
    summary?: string;
    description?: string;
    startDate?: string;
    endDate?: string;
    location?: string;
  }
): Promise<void> {
  try {
    const calendar = createCalendarClient(refreshToken);

    type CalendarEventUpdate = {
      summary?: string;
      description?: string;
      start?: { dateTime: string; timeZone: string };
      end?: { dateTime: string; timeZone: string };
      location?: string;
    };

    const event: CalendarEventUpdate = {};
    if (options.summary) event.summary = options.summary;
    if (options.description !== undefined) event.description = options.description;
    if (options.startDate) {
      event.start = {
        dateTime: options.startDate,
        timeZone: "Asia/Seoul",
      };
    }
    if (options.endDate) {
      event.end = {
        dateTime: options.endDate,
        timeZone: "Asia/Seoul",
      };
    }
    if (options.location !== undefined) event.location = options.location;

    await calendar.events.patch({
      calendarId: "primary",
      eventId: eventId,
      requestBody: event,
    });
  } catch (error: any) {
    console.error("[구글 캘린더 API] 이벤트 업데이트 오류:", error);
    if (error.response) {
      console.error("[구글 캘린더 API] 응답 상태:", error.response.status);
      console.error("[구글 캘린더 API] 응답 데이터:", error.response.data);
    }
    throw error;
  }
}

/**
 * 캘린더 이벤트 삭제
 */
export async function deleteCalendarEvent(
  refreshToken: string,
  eventId: string
): Promise<void> {
  try {
    const calendar = createCalendarClient(refreshToken);

    await calendar.events.delete({
      calendarId: "primary",
      eventId: eventId,
    });
  } catch (error: any) {
    console.error("[구글 캘린더 API] 이벤트 삭제 오류:", error);
    if (error.response) {
      console.error("[구글 캘린더 API] 응답 상태:", error.response.status);
      console.error("[구글 캘린더 API] 응답 데이터:", error.response.data);
    }
    throw error;
  }
}


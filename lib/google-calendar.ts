import { google } from "googleapis";

/**
 * Google Calendar API 클라이언트 생성
 */
export function createCalendarClient(refreshToken: string) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CALENDAR_CLIENT_ID,
    process.env.GOOGLE_CALENDAR_CLIENT_SECRET,
    process.env.NEXT_PUBLIC_SUPABASE_URL + "/api/auth/google-calendar/callback"
  );

  oauth2Client.setCredentials({
    refresh_token: refreshToken,
  });

  return google.calendar({ version: "v3", auth: oauth2Client });
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

  const response = await calendar.events.insert({
    calendarId: "primary",
    requestBody: event,
  });

  return response.data.id || "";
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
  const calendar = createCalendarClient(refreshToken);

  const event: any = {};
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
}

/**
 * 캘린더 이벤트 삭제
 */
export async function deleteCalendarEvent(
  refreshToken: string,
  eventId: string
): Promise<void> {
  const calendar = createCalendarClient(refreshToken);

  await calendar.events.delete({
    calendarId: "primary",
    eventId: eventId,
  });
}


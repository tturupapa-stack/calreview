
import { PATCH } from "@/app/api/applications/[id]/route";
import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createCalendarEvent } from "@/lib/google-calendar";

// Mock dependencies
jest.mock("@/lib/supabase-server", () => ({
    createClient: jest.fn(),
}));

jest.mock("@/lib/google-calendar", () => ({
    createCalendarEvent: jest.fn(),
}));

jest.mock("next/server", () => {
    return {
        NextRequest: class {
            constructor(url, init) {
                this.url = url;
                this.method = init?.method || "GET";
                this.body = init?.body;
            }
            json() {
                return Promise.resolve(JSON.parse(this.body));
            }
        },
        NextResponse: {
            json: jest.fn((data, init) => ({
                status: init?.status || 200,
                json: async () => data,
            })),
        },
    };
});

describe("Calendar Integration Flow", () => {
    const mockCreateClient = createClient as jest.Mock;
    const mockCreateCalendarEvent = createCalendarEvent as jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should create calendar events when status changes to selected", async () => {
        // 1. Setup Mock Supabase Client
        const mockSupabase = {
            auth: {
                getUser: jest.fn().mockResolvedValue({
                    data: { user: { id: "user-123" } },
                    error: null,
                }),
            },
            from: jest.fn((table) => {
                if (table === "applications") {
                    return {
                        select: jest.fn().mockReturnThis(),
                        eq: jest.fn().mockReturnThis(),
                        single: jest.fn().mockImplementation(() => {
                            // First call: check ownership (existing application)
                            return Promise.resolve({
                                data: {
                                    user_id: "user-123",
                                    visit_date: null,
                                    review_deadline: null,
                                    calendar_visit_event_id: null,
                                    calendar_deadline_event_id: null,
                                },
                                error: null,
                            });
                        }),
                        update: jest.fn().mockImplementation(() => {
                            // Update call - returns the updated application with campaign data
                            return {
                                eq: jest.fn().mockReturnThis(),
                                select: jest.fn().mockReturnThis(),
                                single: jest.fn().mockResolvedValue({
                                    data: {
                                        id: "app-123",
                                        status: "selected",
                                        calendar_visit_event_id: null,
                                        calendar_deadline_event_id: null,
                                        campaigns: {
                                            id: "camp-123",
                                            title: "Test Campaign",
                                            source_url: "http://example.com",
                                            region: "Seoul",
                                        }
                                    },
                                    error: null
                                })
                            }
                        })
                    };
                }
                if (table === "users") {
                    return {
                        select: jest.fn().mockReturnThis(),
                        eq: jest.fn().mockReturnThis(),
                        single: jest.fn().mockResolvedValue({
                            data: {
                                google_calendar_connected: true,
                                google_refresh_token: "refresh-token-123",
                            },
                            error: null,
                        }),
                    };
                }
                return {
                    select: jest.fn().mockReturnThis(),
                    eq: jest.fn().mockReturnThis(),
                    single: jest.fn().mockResolvedValue({ data: {}, error: null }),
                    update: jest.fn().mockReturnThis(),
                };
            }),
        };

        mockCreateClient.mockResolvedValue(mockSupabase);
        mockCreateCalendarEvent.mockResolvedValue("new-event-id");

        // 2. Mock Request
        const req = new NextRequest("http://localhost/api/applications/app-123", {
            method: "PATCH",
            body: JSON.stringify({
                status: "selected",
                visit_date: "2024-12-25",
                review_deadline: "2024-12-30",
            }),
        });

        const params = Promise.resolve({ id: "app-123" });

        // 3. Execute Handler
        const response = await PATCH(req, { params });
        const json = await response.json();

        // 4. Assertions
        expect(response.status).toBe(200);
        expect(json.success).toBe(true);

        // Verify createClient was called
        expect(mockCreateClient).toHaveBeenCalled();

        // Verify User was fetched for Calendar connection
        expect(mockSupabase.from).toHaveBeenCalledWith("users");

        // Verify createCalendarEvent was called twice (visit date + deadline)
        expect(mockCreateCalendarEvent).toHaveBeenCalledTimes(2);

        // Check arguments for Visit Date Event
        expect(mockCreateCalendarEvent).toHaveBeenCalledWith(
            "refresh-token-123",
            expect.objectContaining({
                summary: "[체험단] Test Campaign",
                startDate: "2024-12-25T12:00:00+09:00",
            })
        );

        // Check arguments for Deadline Event
        expect(mockCreateCalendarEvent).toHaveBeenCalledWith(
            "refresh-token-123",
            expect.objectContaining({
                summary: "[체험단 리뷰 마감] Test Campaign",
                startDate: "2024-12-30T23:59:00+09:00",
            })
        );
    });
});

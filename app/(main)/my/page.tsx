"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Calendar } from "@/components/features/Calendar";

export default function MyPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isCalendarConnected, setIsCalendarConnected] = useState(false);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<any[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      if (user) {
        const { data: userData } = await supabase
          .from("users")
          .select("google_calendar_connected")
          .eq("id", user.id)
          .single();

        if (userData) {
          setIsCalendarConnected(userData.google_calendar_connected || false);
        }

        // 임박한 마감일 조회
        const today = new Date();
        const threeDaysLater = new Date(today);
        threeDaysLater.setDate(threeDaysLater.getDate() + 3);

        const { data: applications } = await supabase
          .from("applications")
          .select(`
            id,
            review_deadline,
            campaigns!inner(id, title, source_url)
          `)
          .eq("user_id", user.id)
          .eq("status", "selected")
          .not("review_deadline", "is", null)
          .lte("review_deadline", threeDaysLater.toISOString().split("T")[0])
          .gte("review_deadline", today.toISOString().split("T")[0])
          .order("review_deadline", { ascending: true });

        if (applications) {
          setUpcomingDeadlines(applications);
        }

        // 캘린더 이벤트 조회
        const { data: selectedApplications } = await supabase
          .from("applications")
          .select(`
            id,
            visit_date,
            review_deadline,
            calendar_visit_event_id,
            calendar_deadline_event_id,
            campaigns!inner(id, title)
          `)
          .eq("user_id", user.id)
          .eq("status", "selected");

        if (selectedApplications) {
          const events: any[] = [];
          selectedApplications.forEach((app: any) => {
            if (app.visit_date) {
              events.push({
                id: `visit-${app.id}`,
                date: app.visit_date,
                type: "visit",
                title: app.campaigns.title,
                applicationId: app.id,
                campaignId: app.campaigns.id,
                isInGoogleCalendar: !!app.calendar_visit_event_id,
              });
            }
            if (app.review_deadline) {
              events.push({
                id: `deadline-${app.id}`,
                date: app.review_deadline,
                type: "deadline",
                title: app.campaigns.title,
                applicationId: app.id,
                campaignId: app.campaigns.id,
                isInGoogleCalendar: !!app.calendar_deadline_event_id,
              });
            }
          });
          setCalendarEvents(events);
        }
      }
      setIsLoading(false);
    };

    checkUser();
  }, [supabase]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-block w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-2"></div>
            <p className="text-gray-600">로딩 중...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">마이페이지</h1>
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              로그인이 필요합니다
            </h2>
            <p className="text-gray-600 mb-6">
              마이페이지 기능을 사용하려면 로그인해주세요.
            </p>
            <button
              onClick={() => router.push("/login?redirect=/my")}
              className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
            >
              로그인하기
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">마이페이지</h1>

        {/* 마감 임박 알림 */}
        {upcomingDeadlines.length > 0 && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded">
            <h3 className="text-lg font-semibold text-red-800 mb-2">
              🚨 리뷰 마감이 임박했습니다!
            </h3>
            <div className="space-y-2">
              {upcomingDeadlines.map((app) => {
                const deadline = new Date(app.review_deadline);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                deadline.setHours(0, 0, 0, 0);
                const daysLeft = Math.ceil(
                  (deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
                );

                return (
                  <div
                    key={app.id}
                    className="flex items-center justify-between bg-white rounded p-3"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {app.campaigns.title}
                      </p>
                      <p className="text-sm text-gray-600">
                        마감: {deadline.toLocaleDateString("ko-KR")}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-bold ${
                          daysLeft === 0
                            ? "bg-red-100 text-red-700"
                            : daysLeft === 1
                            ? "bg-orange-100 text-orange-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        D-{daysLeft}
                      </span>
                      <Link
                        href="/my/campaigns"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        확인 →
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 캘린더 연동 안내 */}
        {!isCalendarConnected && (
          <div className="mb-6 bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
            <h3 className="text-lg font-semibold text-blue-800 mb-1">
              📅 구글 캘린더를 연동하세요
            </h3>
            <p className="text-sm text-blue-700 mb-3">
              당첨된 체험단의 방문일과 리뷰 마감일이 자동으로 구글 캘린더에 등록됩니다.
            </p>
            <button
              onClick={() => router.push("/settings")}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700"
            >
              지금 연동하기
            </button>
          </div>
        )}

        {/* 주요 기능 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link
            href="/my/campaigns"
            className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow md:col-span-2"
          >
            <div className="flex items-center gap-4 mb-2">
              <div className="w-10 h-10 bg-purple-100 rounded flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900">체험단 관리</h2>
            </div>
            <p className="text-gray-600 text-sm">
              북마크, 신청, 선정, 완료된 체험단을 한곳에서 관리하세요.
            </p>
          </Link>

          <Link
            href="/settings"
            className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow border-2 border-blue-100"
          >
            <div className="flex items-center gap-4 mb-2">
              <div className="w-10 h-10 bg-blue-100 rounded flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900">구글 캘린더</h2>
            </div>
            <p className="text-gray-600 text-sm">
              {isCalendarConnected ? "연결됨 ✓" : "일정 자동 관리"}
            </p>
          </Link>

          <Link
            href="/settings"
            className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-4 mb-2">
              <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900">설정</h2>
            </div>
            <p className="text-gray-600 text-sm">계정 및 알림 설정</p>
          </Link>
        </div>

        {/* 캘린더 */}
        {calendarEvents.length > 0 && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">일정 캘린더</h2>
            <Calendar events={calendarEvents} />
          </div>
        )}

        {/* 빠른 링크 */}
        <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">빠른 링크</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/search" className="text-sm text-blue-600 hover:underline">
              체험단 검색
            </Link>
            <Link href="/premium" className="text-sm text-blue-600 hover:underline">
              서비스 안내
            </Link>
            <Link href="/settings" className="text-sm text-blue-600 hover:underline">
              설정
            </Link>
            <Link href="/" className="text-sm text-blue-600 hover:underline">
              메인으로
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

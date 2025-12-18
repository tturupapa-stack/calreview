"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Calendar } from "@/components/features/Calendar";
import { CheckSelectionButton } from "@/components/features/CheckSelectionButton";
import { StatusPipeline } from "@/components/ui/StatusPipeline";
import { StatDashboard } from "@/components/ui/StatCard";
import { calculateReviewDeadlineString, estimateSelectionDate } from "@/lib/review-deadline-calculator";
import { SELECTION_CHECK_ENABLED } from "@/lib/feature-flags";
import type { Campaign } from "@/types/campaign";

interface Application {
  id: string;
  status: "bookmarked" | "applied" | "selected" | "completed" | "cancelled";
  visit_date: string | null;
  review_deadline: string | null;
  calendar_visit_event_id: string | null;
  calendar_deadline_event_id: string | null;
  auto_detected: boolean;
  detected_at: string | null;
  created_at: string;
  campaigns: {
    id: string;
    title: string;
    thumbnail_url: string | null;
    category: string | null;
    region: string | null;
    channel: string | null;
    type: string | null;
    source_url: string;
    source: string;
    application_deadline: string | null;
    review_deadline_days: number | null;
  };
}

function calculateDday(deadline: string | null): string {
  if (!deadline) return "";
  try {
    const deadlineDate = new Date(deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    deadlineDate.setHours(0, 0, 0, 0);

    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "D-0";
    if (diffDays > 0) return `D-${diffDays}`;
    return `D+${Math.abs(diffDays)}`;
  } catch {
    return "";
  }
}

export default function MyCampaignsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isCalendarConnected, setIsCalendarConnected] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("bookmarked");
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [visitDate, setVisitDate] = useState("");
  const [reviewDeadline, setReviewDeadline] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const fetchData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setCurrentUser(user);

      if (!user) {
        setIsLoading(false);
        return;
      }

      // 사용자 정보 조회
      const { data: userData } = await supabase
        .from("users")
        .select("google_calendar_connected")
        .eq("id", user.id)
        .single();

      if (userData) {
        setIsCalendarConnected(userData.google_calendar_connected || false);
      }

      // 전체 신청 목록 조회
      const response = await fetch("/api/applications");
      if (!response.ok) {
        let errorMessage = "신청 목록을 불러올 수 없습니다.";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          errorMessage = `서버 오류 (${response.status}): ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setApplications(data.applications || []);
    } catch (error: any) {
      console.error("데이터 조회 오류:", error);
      const errorMessage = error instanceof Error
        ? error.message
        : error?.message || "데이터를 불러오는 중 오류가 발생했습니다.";

      // 네트워크 에러인 경우 더 명확한 메시지 제공
      if (errorMessage.includes("Failed to fetch") || errorMessage.includes("NetworkError")) {
        alert("네트워크 연결을 확인해주세요. 서버가 실행 중인지 확인하세요.");
      } else {
        alert(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [supabase, router]);

  const handleSelectClick = (applicationId: string) => {
    const app = applications.find((a) => a.id === applicationId);
    if (!app) return;

    // 신청 마감일 체크
    if (app.campaigns.application_deadline) {
      const deadlineDate = new Date(app.campaigns.application_deadline);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      deadlineDate.setHours(0, 0, 0, 0);

      if (today < deadlineDate) {
        alert("⚠️ 신청 마감일 전에는 선정 처리를 할 수 없습니다.\n\n신청 마감일: " + deadlineDate.toLocaleDateString("ko-KR"));
        return;
      }
    }

    setEditingId(applicationId);

    // 기존 값이 있으면 로드
    setVisitDate(app.visit_date || "");

    // 리뷰 마감일 자동 계산 (개선된 계산기 사용)
    if (app.review_deadline) {
      setReviewDeadline(app.review_deadline);
    } else {
      // 새로운 계산기 사용 (필요한 필드만 포함)
      const calculatedDeadline = calculateReviewDeadlineString({
        ...app.campaigns,
        source_id: app.campaigns.id,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as Campaign);
      setReviewDeadline(calculatedDeadline);
    }
  };

  const handleSelectConfirm = async (applicationId: string) => {
    const app = applications.find((a) => a.id === applicationId);
    if (!app) {
      alert("신청 정보를 찾을 수 없습니다.");
      return;
    }

    if (!reviewDeadline) {
      alert("리뷰 마감일을 입력해주세요.");
      return;
    }

    setProcessingId(applicationId);

    try {
      // 선정 처리이므로 항상 "selected" 상태로 설정
      const updateData: any = {
        status: "selected",
        review_deadline: reviewDeadline,
      };

      if (visitDate) {
        updateData.visit_date = visitDate;
      }

      console.log("[클라이언트] 선정 처리 데이터:", updateData);

      const response = await fetch(`/api/applications/${applicationId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      // Response는 한 번만 읽을 수 있으므로 먼저 텍스트로 읽기
      const responseText = await response.text();

      if (!response.ok) {
        let errorMessage = "선정 처리 중 오류가 발생했습니다.";
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          // JSON 파싱 실패 시 상태 텍스트 사용
          errorMessage = `서버 오류 (${response.status}): ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      // 성공한 경우에만 JSON 파싱
      const data = JSON.parse(responseText);

      console.log("[클라이언트] API 응답:", data);

      // 캘린더 이벤트 ID 확인 (안전하게 처리)
      const hasCalendarEvents = !!(data?.application?.calendar_visit_event_id || data?.application?.calendar_deadline_event_id);
      const calendarErrors: string[] = Array.isArray(data?.calendarInfo?.errors) ? data.calendarInfo.errors : [];

      console.log("[클라이언트] 캘린더 이벤트 ID:", {
        visitEventId: data?.application?.calendar_visit_event_id,
        deadlineEventId: data?.application?.calendar_deadline_event_id,
        hasCalendarEvents: !!hasCalendarEvents,
        calendarErrors,
      });

      // 목록 새로고침
      const refreshResponse = await fetch("/api/applications");
      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json();
        setApplications(refreshData.applications || []);
      }

      setEditingId(null);
      setVisitDate("");
      setReviewDeadline("");

      // 캘린더 등록 여부에 따른 메시지
      let calendarMessage = "";
      if (hasCalendarEvents) {
        calendarMessage = " 구글 캘린더에 등록되었습니다.";
      } else if (isCalendarConnected) {
        if (calendarErrors && calendarErrors.length > 0) {
          calendarMessage = `\n\n구글 캘린더 등록 실패:\n${calendarErrors.join("\n")}`;
        } else {
          calendarMessage = "\n\n구글 캘린더 등록 실패 (서버 로그 확인 필요)";
        }
      }
      alert("✓ 선정 처리되었습니다 (v2 check)." + calendarMessage);
    } catch (error: any) {
      console.error("선정 처리 오류:", error);
      const errorMessage = error instanceof Error
        ? error.message
        : error?.message || "선정 처리 중 오류가 발생했습니다.";

      // 네트워크 에러인 경우 더 명확한 메시지 제공
      if (errorMessage.includes("Failed to fetch") || errorMessage.includes("NetworkError")) {
        alert("네트워크 연결을 확인해주세요. 서버가 실행 중인지 확인하세요.");
      } else {
        alert(errorMessage);
      }
    } finally {
      setProcessingId(null);
    }
  };

  const handleStatusChange = async (applicationId: string, newStatus: string) => {
    if (!confirm(`상태를 "${newStatus}"로 변경하시겠습니까?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/applications/${applicationId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "상태 변경 중 오류가 발생했습니다.");
      }

      // 목록 새로고침
      const refreshResponse = await fetch("/api/applications");
      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json();
        setApplications(refreshData.applications || []);
      }

      alert("✓ 상태가 변경되었습니다.");
    } catch (error: any) {
      console.error("상태 변경 오류:", error);
      alert(error.message || "상태 변경 중 오류가 발생했습니다.");
    }
  };

  const handleRemove = async (applicationId: string) => {
    if (!confirm("정말 제거하시겠습니까?")) {
      return;
    }

    try {
      const response = await fetch(`/api/applications/${applicationId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "제거 중 오류가 발생했습니다.");
      }

      setApplications((prev) => prev.filter((app) => app.id !== applicationId));
      alert("✓ 제거되었습니다.");
    } catch (error: any) {
      console.error("제거 오류:", error);
      alert(error.message || "제거 중 오류가 발생했습니다.");
    }
  };

  const filteredApplications = applications.filter((app) => {
    if (statusFilter === "all") return app.status !== "cancelled";
    return app.status === statusFilter;
  });

  // Calculate status counts
  const statusCounts = useMemo(() => ({
    bookmarked: applications.filter(a => a.status === "bookmarked").length,
    applied: applications.filter(a => a.status === "applied").length,
    selected: applications.filter(a => a.status === "selected").length,
    completed: applications.filter(a => a.status === "completed").length,
  }), [applications]);

  // Calculate monthly stats (current month)
  const monthlyStats = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const thisMonthApps = applications.filter(app => {
      const created = new Date(app.created_at);
      return created >= startOfMonth;
    });

    const applied = thisMonthApps.filter(a => a.status !== "bookmarked").length;
    const selected = thisMonthApps.filter(a => a.status === "selected" || a.status === "completed").length;
    const completed = thisMonthApps.filter(a => a.status === "completed").length;
    const selectionRate = applied > 0 ? Math.round((selected / applied) * 100) : 0;

    return { applied, selected, completed, selectionRate };
  }, [applications]);

  // 캘린더 이벤트 변환
  const calendarEvents = applications
    .filter((app) => app.status === "selected")
    .flatMap((app) => {
      const events: any[] = [];

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

      return events;
    });

  if (isLoading) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="text-center">로딩 중...</div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">체험단 관리</h1>
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">로그인이 필요합니다</h2>
            <p className="text-gray-600 mb-6">
              체험단 관리 기능을 사용하려면 로그인해주세요.
            </p>
            <button
              onClick={() => router.push("/login?redirect=/my/campaigns")}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              로그인하기
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* 헤더 */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">체험단 관리</h1>
            <p className="text-sm text-muted-foreground mt-1">북마크부터 리뷰 완료까지 한눈에</p>
          </div>

          {/* 뷰 모드 전환 */}
          <div className="flex gap-1 bg-white rounded-xl p-1 shadow-sm border border-border/50">
            <button
              onClick={() => setViewMode("list")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${viewMode === "list"
                ? "bg-primary text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
            >
              <svg className="w-4 h-4 inline-block mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              리스트
            </button>
            <button
              onClick={() => setViewMode("calendar")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${viewMode === "calendar"
                ? "bg-primary text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
            >
              <svg className="w-4 h-4 inline-block mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              캘린더
            </button>
          </div>
        </div>

        {/* Status Pipeline */}
        <div className="mb-6">
          <StatusPipeline
            counts={statusCounts}
            currentStatus={statusFilter}
            onStatusChange={setStatusFilter}
          />
        </div>

        {/* Monthly Stats Dashboard */}
        <div className="mb-6">
          <StatDashboard stats={monthlyStats} />
        </div>

        {/* 캘린더 뷰 */}
        {viewMode === "calendar" ? (
          <div>
            {calendarEvents.length > 0 ? (
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    선정된 체험단의 방문일과 리뷰 마감일을 확인하세요
                    {isCalendarConnected && (
                      <span className="ml-2 text-blue-600">📅 구글 캘린더 연동됨</span>
                    )}
                  </p>
                </div>
                <Calendar events={calendarEvents} />
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  일정이 없습니다
                </h3>
                <p className="text-gray-600 mb-4">
                  선정된 체험단이 있으면 일정이 표시됩니다
                </p>
                <button
                  onClick={() => setViewMode("list")}
                  className="inline-block px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
                >
                  리스트 보기
                </button>
              </div>
            )}
          </div>
        ) : (
          /* 리스트 뷰 */
          <div>
            {/* 리스트 */}
            {filteredApplications.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border border-border/50 p-12 text-center">
                <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                  {statusFilter === "bookmarked" && (
                    <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                  )}
                  {statusFilter === "applied" && (
                    <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  )}
                  {statusFilter === "selected" && (
                    <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                  {statusFilter === "completed" && (
                    <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  )}
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {statusFilter === "bookmarked" && "아직 북마크한 체험단이 없어요"}
                  {statusFilter === "applied" && "신청한 체험단이 없어요"}
                  {statusFilter === "selected" && "선정된 체험단이 없어요"}
                  {statusFilter === "completed" && "완료한 체험단이 없어요"}
                </h3>
                <p className="text-sm text-muted-foreground mb-6">
                  {statusFilter === "bookmarked" && "관심있는 체험단을 북마크해보세요!"}
                  {statusFilter === "applied" && "북마크한 체험단에 신청해보세요!"}
                  {statusFilter === "selected" && "신청한 체험단의 당첨 발표를 기다려보세요!"}
                  {statusFilter === "completed" && "선정된 체험단의 리뷰를 완료해보세요!"}
                </p>
                <Link
                  href="/search"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-medium rounded-xl hover:bg-primary/90 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  체험단 둘러보기
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredApplications.map((app) => (
                  <div
                    key={app.id}
                    className="bg-white rounded-2xl shadow-sm border border-border/50 overflow-hidden hover:shadow-md hover:border-primary/20 transition-all duration-300"
                  >
                    <div className="p-5 sm:p-6">
                      <div className="flex flex-col sm:flex-row gap-4">
                        {/* 썸네일 */}
                        {app.campaigns.thumbnail_url && (
                          <div className="relative w-full sm:w-36 h-36 bg-secondary rounded-xl flex-shrink-0 overflow-hidden group">
                            <Image
                              src={app.campaigns.thumbnail_url}
                              alt={app.campaigns.title}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                              sizes="144px"
                            />
                          </div>
                        )}

                        {/* 내용 */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <Link
                              href={`/campaign/${app.campaigns.id}`}
                              className="text-lg font-bold text-foreground hover:text-primary transition-colors line-clamp-2"
                            >
                              {app.campaigns.title}
                            </Link>
                            <span
                              className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold ${app.status === "bookmarked"
                                ? "status-bookmarked"
                                : app.status === "applied"
                                  ? "status-applied"
                                  : app.status === "selected"
                                    ? "status-selected"
                                    : "status-completed"
                                }`}
                            >
                              {app.status === "bookmarked" && "북마크"}
                              {app.status === "applied" && "신청중"}
                              {app.status === "selected" && "선정됨"}
                              {app.status === "completed" && "완료"}
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-2 mb-3">
                            {app.campaigns.source && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-secondary rounded-lg text-xs font-medium text-muted-foreground">
                                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                                </svg>
                                {app.campaigns.source === "reviewnote" && "리뷰노트"}
                                {app.campaigns.source === "dinnerqueen" && "디너의여왕"}
                                {app.campaigns.source === "gangnam" && "강남맛집"}
                                {app.campaigns.source === "reviewplace" && "리뷰플레이스"}
                                {app.campaigns.source === "stylec" && "스타일씨"}
                                {app.campaigns.source === "modan" && "모두의체험단"}
                                {app.campaigns.source === "chuble" && "츄블"}
                                {app.campaigns.source === "dinodan" && "디노단"}
                                {app.campaigns.source === "real_review" && "리얼리뷰"}
                              </span>
                            )}
                            {app.campaigns.category && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary/10 rounded-lg text-xs font-medium text-primary">
                                {app.campaigns.category}
                              </span>
                            )}
                            {app.campaigns.region && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-secondary rounded-lg text-xs font-medium text-muted-foreground">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                {app.campaigns.region}
                              </span>
                            )}
                            {app.campaigns.channel && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-secondary rounded-lg text-xs font-medium text-muted-foreground">
                                {app.campaigns.channel}
                              </span>
                            )}
                          </div>

                          {/* 자동 당첨 확인 표시 */}
                          {SELECTION_CHECK_ENABLED && app.status === "selected" && app.auto_detected && (
                            <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                              <div className="flex items-center gap-2">
                                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="text-sm font-medium text-blue-800">
                                  자동 당첨 확인됨
                                </span>
                                {app.detected_at && (
                                  <span className="text-xs text-blue-600 ml-auto">
                                    {new Date(app.detected_at).toLocaleDateString("ko-KR")}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          {/* 방문일/리뷰 마감일 정보 (선정된 경우) */}
                          {app.status === "selected" && (
                            <div className="mb-3 space-y-2">
                              {app.visit_date && (
                                <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                                  <span className="font-medium text-gray-700">방문 예정일: </span>
                                  <span className="font-semibold text-green-700">
                                    {new Date(app.visit_date).toLocaleDateString("ko-KR")}
                                  </span>
                                  {app.calendar_visit_event_id && (
                                    <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                                      📅 캘린더 등록됨
                                    </span>
                                  )}
                                </div>
                              )}
                              {app.review_deadline && (
                                <div className="p-3 bg-orange-50 border border-orange-200 rounded-md">
                                  <span className="font-medium text-gray-700">리뷰 마감일: </span>
                                  <span className={`font-bold ${calculateDday(app.review_deadline).startsWith("D+")
                                    ? "text-red-600"
                                    : calculateDday(app.review_deadline) === "D-0" || calculateDday(app.review_deadline) === "D-1"
                                      ? "text-orange-600"
                                      : "text-green-600"
                                    }`}>
                                    {calculateDday(app.review_deadline)}
                                  </span>
                                  <span className="text-gray-600 ml-2">
                                    ({new Date(app.review_deadline).toLocaleDateString("ko-KR")})
                                  </span>
                                  {app.calendar_deadline_event_id && (
                                    <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                                      📅 캘린더 등록됨
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          )}

                          {/* 선정 처리/수정 입력 */}
                          {editingId === app.id && (app.status === "bookmarked" || app.status === "selected") ? (
                            <div className="mb-4 space-y-3 p-4 bg-gray-50 rounded-lg">
                              {app.campaigns.review_deadline_days && app.status === "bookmarked" && (
                                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                                  <p className="text-sm text-blue-800">
                                    <strong>📝 이 체험단의 리뷰 작성 기간:</strong> {app.campaigns.review_deadline_days}일
                                  </p>
                                  {app.campaigns.application_deadline ? (
                                    <p className="text-xs text-blue-700 mt-1">
                                      💡 신청 마감일: {new Date(app.campaigns.application_deadline).toLocaleDateString("ko-KR")}
                                      <br />
                                      예상 선정일: {new Date(new Date(app.campaigns.application_deadline).setDate(new Date(app.campaigns.application_deadline).getDate() + 1)).toLocaleDateString("ko-KR")}
                                      <br />
                                      리뷰 마감일: 선정일 + {app.campaigns.review_deadline_days}일 = <strong>{new Date(new Date(app.campaigns.application_deadline).setDate(new Date(app.campaigns.application_deadline).getDate() + 1 + app.campaigns.review_deadline_days)).toLocaleDateString("ko-KR")}</strong>
                                    </p>
                                  ) : (
                                    <p className="text-xs text-blue-700 mt-1">
                                      💡 오늘 기준 {app.campaigns.review_deadline_days}일 후가 리뷰 마감일입니다.
                                    </p>
                                  )}
                                </div>
                              )}

                              {/* 방문 예정일 */}
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  방문 예정일 (선택사항)
                                </label>
                                <input
                                  type="date"
                                  value={visitDate}
                                  onChange={(e) => setVisitDate(e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                  placeholder="방문일을 입력하세요"
                                />
                                <p className="mt-1 text-xs text-gray-500">
                                  방문형 체험단인 경우 방문 예정일을 입력하세요.
                                </p>
                              </div>

                              {/* 리뷰 마감일 */}
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  리뷰 마감일 <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="date"
                                  value={reviewDeadline}
                                  onChange={(e) => setReviewDeadline(e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                />
                                {app.campaigns.review_deadline_days && app.status === "bookmarked" && (
                                  <p className="mt-1 text-xs text-gray-500">
                                    ✓ 체험단 사이트에서 크롤링한 리뷰 기간 정보({app.campaigns.review_deadline_days}일)를 바탕으로 자동 계산되었습니다.
                                  </p>
                                )}
                                {!app.campaigns.review_deadline_days && (
                                  <p className="mt-1 text-xs text-gray-500">
                                    ⚠️ 이 체험단은 리뷰 기간 정보가 없어 직접 입력해주세요.
                                  </p>
                                )}
                              </div>

                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleSelectConfirm(app.id)}
                                  disabled={processingId === app.id || !reviewDeadline}
                                  className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 disabled:opacity-50"
                                >
                                  {processingId === app.id ? "처리 중..." : app.status === "selected" ? "저장" : "선정 처리"}
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingId(null);
                                    setVisitDate("");
                                    setReviewDeadline("");
                                  }}
                                  className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-200"
                                >
                                  취소
                                </button>
                              </div>
                            </div>
                          ) : (
                            /* 액션 버튼 */
                            <div className="flex gap-2 flex-wrap pt-2 border-t border-border/50 mt-3">
                              {app.status === "bookmarked" && (
                                <>
                                  {/* 신청 완료 버튼 */}
                                  <button
                                    onClick={() => handleStatusChange(app.id, "applied")}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 text-white text-sm font-medium rounded-xl hover:bg-amber-600 hover:shadow-md transition-all duration-200"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                    신청 완료
                                  </button>
                                  {/* 당첨 확인 버튼 */}
                                  {SELECTION_CHECK_ENABLED && (
                                    <div className="w-full sm:w-auto">
                                      <CheckSelectionButton
                                        applicationId={app.id}
                                        campaignTitle={app.campaigns.title}
                                        applicationDeadline={app.campaigns.application_deadline}
                                        onSuccess={() => {
                                          fetchData();
                                        }}
                                      />
                                    </div>
                                  )}
                                  <button
                                    onClick={() => handleSelectClick(app.id)}
                                    disabled={(() => {
                                      if (!app.campaigns.application_deadline) return false;
                                      const deadline = new Date(app.campaigns.application_deadline);
                                      const today = new Date();
                                      deadline.setHours(0, 0, 0, 0);
                                      today.setHours(0, 0, 0, 0);
                                      return today < deadline;
                                    })()}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-success text-white text-sm font-medium rounded-xl hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                    title={(() => {
                                      if (!app.campaigns.application_deadline) return "선정 처리";
                                      const deadline = new Date(app.campaigns.application_deadline);
                                      const today = new Date();
                                      deadline.setHours(0, 0, 0, 0);
                                      today.setHours(0, 0, 0, 0);
                                      if (today < deadline) {
                                        return "신청 마감일 이후에 선정 가능합니다";
                                      }
                                      return "선정 처리";
                                    })()}
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    수동 선정
                                  </button>
                                </>
                              )}
                              {app.status === "applied" && (
                                <>
                                  {/* 당첨 확인 버튼 */}
                                  {SELECTION_CHECK_ENABLED && (
                                    <div className="w-full sm:w-auto">
                                      <CheckSelectionButton
                                        applicationId={app.id}
                                        campaignTitle={app.campaigns.title}
                                        applicationDeadline={app.campaigns.application_deadline}
                                        onSuccess={() => {
                                          fetchData();
                                        }}
                                      />
                                    </div>
                                  )}
                                  <button
                                    onClick={() => handleSelectClick(app.id)}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-success text-white text-sm font-medium rounded-xl hover:shadow-md transition-all duration-200"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    당첨됨
                                  </button>
                                </>
                              )}
                              {app.status === "selected" && (
                                <>
                                  <button
                                    onClick={() => handleSelectClick(app.id)}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary/90 hover:shadow-md transition-all duration-200"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    일정 수정
                                  </button>
                                  <button
                                    onClick={() => handleStatusChange(app.id, "completed")}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-premium text-white text-sm font-medium rounded-xl hover:shadow-md transition-all duration-200"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                    </svg>
                                    완료
                                  </button>
                                </>
                              )}
                              <a
                                href={app.campaigns.source_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-secondary text-foreground text-sm font-medium rounded-xl hover:bg-secondary/80 transition-all duration-200"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                                원본 보기
                              </a>
                              <button
                                onClick={() => handleRemove(app.id)}
                                className="inline-flex items-center gap-1.5 px-4 py-2 text-muted-foreground text-sm font-medium rounded-xl hover:bg-destructive/10 hover:text-destructive transition-all duration-200"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                제거
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}


"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Calendar } from "@/components/features/Calendar";

interface Application {
  id: string;
  status: "bookmarked" | "applied" | "selected" | "completed" | "cancelled";
  visit_date: string | null;
  review_deadline: string | null;
  calendar_visit_event_id: string | null;
  calendar_deadline_event_id: string | null;
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

  useEffect(() => {
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

    // 리뷰 마감일 자동 계산
    if (app.review_deadline) {
      setReviewDeadline(app.review_deadline);
    } else if (app.campaigns.review_deadline_days && app.campaigns.application_deadline) {
      // 선정일 = 신청 마감일 + 1일
      const selectionDate = new Date(app.campaigns.application_deadline);
      selectionDate.setDate(selectionDate.getDate() + 1);

      // 리뷰 마감일 = 선정일 + 리뷰 기간
      const reviewDeadlineDate = new Date(selectionDate);
      reviewDeadlineDate.setDate(reviewDeadlineDate.getDate() + app.campaigns.review_deadline_days);

      setReviewDeadline(reviewDeadlineDate.toISOString().split("T")[0]);
    } else if (app.campaigns.review_deadline_days) {
      // application_deadline 없으면 오늘 기준
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const deadline = new Date(today);
      deadline.setDate(deadline.getDate() + app.campaigns.review_deadline_days);
      setReviewDeadline(deadline.toISOString().split("T")[0]);
    } else {
      setReviewDeadline("");
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
      alert("✓ 선정 처리되었습니다." + calendarMessage);
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
    <div className="bg-gray-50 min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">체험단 관리</h1>

          {/* 뷰 모드 전환 */}
          <div className="flex gap-2 bg-white rounded-lg p-1 shadow-sm">
            <button
              onClick={() => setViewMode("list")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === "list"
                  ? "bg-blue-600 text-white"
                  : "text-gray-700 hover:bg-gray-100"
                }`}
            >
              <svg className="w-5 h-5 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              리스트
            </button>
            <button
              onClick={() => setViewMode("calendar")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === "calendar"
                  ? "bg-blue-600 text-white"
                  : "text-gray-700 hover:bg-gray-100"
                }`}
            >
              <svg className="w-5 h-5 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              캘린더
            </button>
          </div>
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
            {/* 상태 필터 탭 */}
            <div className="mb-6 flex gap-2 flex-wrap bg-white rounded-lg p-1 shadow-sm">
              <button
                onClick={() => setStatusFilter("bookmarked")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${statusFilter === "bookmarked"
                    ? "bg-blue-600 text-white"
                    : "text-gray-700 hover:bg-gray-100"
                  }`}
              >
                북마크
                <span className="ml-2 text-xs opacity-75">
                  ({applications.filter(a => a.status === "bookmarked").length})
                </span>
              </button>
              <button
                onClick={() => setStatusFilter("applied")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${statusFilter === "applied"
                    ? "bg-blue-600 text-white"
                    : "text-gray-700 hover:bg-gray-100"
                  }`}
              >
                신청중
                <span className="ml-2 text-xs opacity-75">
                  ({applications.filter(a => a.status === "applied").length})
                </span>
              </button>
              <button
                onClick={() => setStatusFilter("selected")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${statusFilter === "selected"
                    ? "bg-blue-600 text-white"
                    : "text-gray-700 hover:bg-gray-100"
                  }`}
              >
                선정됨
                <span className="ml-2 text-xs opacity-75">
                  ({applications.filter(a => a.status === "selected").length})
                </span>
              </button>
              <button
                onClick={() => setStatusFilter("completed")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${statusFilter === "completed"
                    ? "bg-blue-600 text-white"
                    : "text-gray-700 hover:bg-gray-100"
                  }`}
              >
                완료
                <span className="ml-2 text-xs opacity-75">
                  ({applications.filter(a => a.status === "completed").length})
                </span>
              </button>
            </div>

            {/* 리스트 */}
            {filteredApplications.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-8 text-center text-gray-500">
                {statusFilter === "bookmarked" && "북마크한 체험단이 없습니다."}
                {statusFilter === "applied" && "신청한 체험단이 없습니다."}
                {statusFilter === "selected" && "선정된 체험단이 없습니다."}
                {statusFilter === "completed" && "완료한 체험단이 없습니다."}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredApplications.map((app) => (
                  <div
                    key={app.id}
                    className="bg-white rounded-lg shadow-sm overflow-hidden"
                  >
                    <div className="p-6">
                      <div className="flex flex-col sm:flex-row gap-4">
                        {/* 썸네일 */}
                        {app.campaigns.thumbnail_url && (
                          <div className="relative w-full sm:w-32 h-32 bg-gray-200 rounded-md flex-shrink-0">
                            <Image
                              src={app.campaigns.thumbnail_url}
                              alt={app.campaigns.title}
                              fill
                              className="object-cover rounded-md"
                              sizes="128px"
                            />
                          </div>
                        )}

                        {/* 내용 */}
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <Link
                              href={`/campaign/${app.campaigns.id}`}
                              className="text-lg font-semibold text-gray-900 hover:text-blue-600"
                            >
                              {app.campaigns.title}
                            </Link>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${app.status === "bookmarked"
                                  ? "bg-blue-100 text-blue-700"
                                  : app.status === "applied"
                                    ? "bg-yellow-100 text-yellow-700"
                                    : app.status === "selected"
                                      ? "bg-green-100 text-green-700"
                                      : "bg-gray-100 text-gray-700"
                                }`}
                            >
                              {app.status === "bookmarked" && "북마크"}
                              {app.status === "applied" && "신청중"}
                              {app.status === "selected" && "선정됨"}
                              {app.status === "completed" && "완료"}
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-3 text-sm text-gray-600 mb-3">
                            {app.campaigns.source && (
                              <span className="flex items-center gap-1">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                                </svg>
                                {app.campaigns.source === "reviewnote" && "리뷰노트"}
                                {app.campaigns.source === "dinnerqueen" && "디너의여왕"}
                                {app.campaigns.source === "gangnam" && "강남맛집"}
                                {app.campaigns.source === "reviewplace" && "리뷰플레이스"}
                              </span>
                            )}
                            {app.campaigns.category && (
                              <span>📁 {app.campaigns.category}</span>
                            )}
                            {app.campaigns.region && (
                              <span>📍 {app.campaigns.region}</span>
                            )}
                            {app.campaigns.channel && (
                              <span>📱 {app.campaigns.channel}</span>
                            )}
                          </div>

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
                            <div className="flex gap-2 flex-wrap">
                              {app.status === "bookmarked" && (
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
                                  className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
                                  선정
                                </button>
                              )}
                              {app.status === "applied" && (
                                <button
                                  onClick={() => handleStatusChange(app.id, "selected")}
                                  className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700"
                                >
                                  당첨됨
                                </button>
                              )}
                              {app.status === "selected" && (
                                <>
                                  <button
                                    onClick={() => handleSelectClick(app.id)}
                                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
                                  >
                                    일정 수정
                                  </button>
                                  <button
                                    onClick={() => handleStatusChange(app.id, "completed")}
                                    className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700"
                                  >
                                    완료
                                  </button>
                                </>
                              )}
                              <a
                                href={app.campaigns.source_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
                              >
                                원본 보기
                              </a>
                              <button
                                onClick={() => handleRemove(app.id)}
                                className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-200"
                              >
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


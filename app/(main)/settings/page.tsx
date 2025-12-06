"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface UserSettings {
  is_premium: boolean;
  premium_plan: string | null;
  premium_expires_at: string | null;
  google_calendar_connected: boolean;
  notification_email: boolean;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        setCurrentUser(user);

        if (!user) {
          setIsLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from("users")
          .select(
            "is_premium, premium_plan, premium_expires_at, google_calendar_connected, notification_email"
          )
          .eq("id", user.id)
          .single();

        if (error) {
          throw error;
        }

        setSettings(data as UserSettings);
      } catch (error) {
        console.error("설정 조회 오류:", error);
        alert("설정을 불러오는 중 오류가 발생했습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();

    // URL 파라미터 확인 (OAuth 콜백 후)
    const searchParams = new URLSearchParams(window.location.search);
    const success = searchParams.get("success");
    const error = searchParams.get("error");

    if (success === "calendar_connected") {
      alert("구글 캘린더가 연결되었습니다!");
      fetchSettings(); // 다시 로드
      window.history.replaceState({}, "", "/settings");
    } else if (error) {
      alert(`오류: ${error}`);
      window.history.replaceState({}, "", "/settings");
    }
  }, [supabase, router]);

  const handleConnectCalendar = async () => {
    setIsConnecting(true);
    try {
      const response = await fetch("/api/auth/google-calendar/connect");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "연결 실패");
      }

      // Google OAuth 페이지로 리다이렉트
      window.location.href = data.authUrl;
    } catch (error: any) {
      console.error("캘린더 연결 오류:", error);
      alert(error.message || "캘린더 연결 중 오류가 발생했습니다.");
      setIsConnecting(false);
    }
  };

  const handleDisconnectCalendar = async () => {
    if (!confirm("정말 구글 캘린더 연결을 해제하시겠습니까?")) {
      return;
    }

    try {
      const response = await fetch("/api/auth/google-calendar/disconnect", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "연결 해제 실패");
      }

      alert(data.message || "연결이 해제되었습니다.");
      setSettings((prev) =>
        prev ? { ...prev, google_calendar_connected: false } : null
      );
    } catch (error: any) {
      console.error("캘린더 연결 해제 오류:", error);
      alert(error.message || "연결 해제 중 오류가 발생했습니다.");
    }
  };

  if (isLoading) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="text-center">로딩 중...</div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">설정</h1>
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">로그인이 필요합니다</h2>
            <p className="text-gray-600 mb-6">
              설정을 변경하려면 로그인해주세요.
            </p>
            <button
              onClick={() => router.push("/login?redirect=/settings")}
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
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">설정</h1>

        <div className="space-y-6">
          {/* 구글 캘린더 연동 */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              구글 캘린더 연동
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              당첨 시 구글 캘린더에 자동으로 일정을 등록합니다.
            </p>
            {settings?.google_calendar_connected ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-green-600 font-medium">연결됨</span>
                </div>
                <button
                  onClick={handleDisconnectCalendar}
                  className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-200"
                >
                  연결 해제
                </button>
              </div>
            ) : (
              <button
                onClick={handleConnectCalendar}
                disabled={isConnecting}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isConnecting ? "연결 중..." : "구글 캘린더 연결"}
              </button>
            )}
          </div>


          {/* 알림 설정 */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              알림 설정
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              마감이 임박한 체험단은 마이페이지에서 자동으로 알려드립니다.
            </p>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                <div>
                  <p className="text-sm text-blue-900 font-medium mb-1">
                    마감 임박 알림 작동 방식
                  </p>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• 마이페이지 접속 시 D-3 이하인 체험단을 알림</li>
                    <li>• 구글 캘린더에도 자동으로 일정 등록</li>
                    <li>• 구글 캘린더의 알림 기능 활용</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


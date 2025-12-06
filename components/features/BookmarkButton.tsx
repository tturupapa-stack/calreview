"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";

interface BookmarkButtonProps {
  campaignId: string;
  sourceUrl: string;
}

export function BookmarkButton({ campaignId, sourceUrl }: BookmarkButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  // 북마크 상태 확인
  useEffect(() => {
    const checkBookmarkStatus = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setIsChecking(false);
          return;
        }

        const response = await fetch(`/api/applications/check?campaign_id=${campaignId}`);
        if (response.ok) {
          const { application } = await response.json();
          if (application) {
            setIsBookmarked(true);
          }
        }
      } catch (error) {
        console.error("북마크 상태 확인 오류:", error);
      } finally {
        setIsChecking(false);
      }
    };

    checkBookmarkStatus();
  }, [campaignId, supabase]);

  const handleBookmark = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login?redirect=/campaign/" + campaignId);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/applications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          campaign_id: campaignId,
          status: "bookmarked", // 북마크 상태로 저장
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "북마크 추가 중 오류가 발생했습니다.");
      }

      setIsBookmarked(true);
      
      // 성공 메시지 표시
      alert("✓ 북마크에 저장되었습니다.");
    } catch (error: any) {
      console.error("북마크 오류:", error);
      alert(error.message || "북마크 추가 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnbookmark = async () => {
    if (!confirm("정말 북마크를 해제하시겠습니까?")) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/applications/check?campaign_id=${campaignId}`);
      if (!response.ok) {
        throw new Error("북마크 정보를 불러올 수 없습니다.");
      }

      const { application } = await response.json();
      if (!application) {
        throw new Error("북마크 정보를 찾을 수 없습니다.");
      }

      const deleteResponse = await fetch(`/api/applications/${application.id}`, {
        method: "DELETE",
      });

      const data = await deleteResponse.json();

      if (!deleteResponse.ok) {
        throw new Error(data.error || "북마크 해제 중 오류가 발생했습니다.");
      }

      setIsBookmarked(false);
    } catch (error: any) {
      console.error("북마크 해제 오류:", error);
      alert(error.message || "북마크 해제 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isChecking) {
    return (
      <button
        disabled
        className="flex items-center justify-center gap-2 rounded-md bg-gray-300 px-4 py-3 text-sm font-medium text-gray-500 cursor-not-allowed"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
        확인 중...
      </button>
    );
  }

  if (isBookmarked) {
    return (
      <button
        onClick={handleUnbookmark}
        disabled={isLoading}
        className="flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-all"
      >
        <svg className="w-5 h-5 fill-current text-white" viewBox="0 0 24 24">
          <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
        {isLoading ? "처리 중..." : "북마크됨"}
      </button>
    );
  }

  return (
    <button
      onClick={handleBookmark}
      disabled={isLoading}
      className="flex items-center justify-center gap-2 rounded-md bg-gray-100 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
    >
      <svg className="w-5 h-5 stroke-current text-gray-700" fill="none" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
      </svg>
      {isLoading ? "처리 중..." : "북마크"}
    </button>
  );
}


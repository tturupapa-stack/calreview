"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

interface CheckSelectionButtonProps {
  applicationId: string;
  campaignTitle: string;
  applicationDeadline: string | null;
  onSuccess?: () => void;
}

export function CheckSelectionButton({
  applicationId,
  campaignTitle,
  applicationDeadline,
  onSuccess,
}: CheckSelectionButtonProps) {
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<{
    isSelected: boolean;
    message: string;
    autoUpdated?: boolean;
  } | null>(null);

  const handleCheck = async () => {
    // 신청 마감일 확인
    if (applicationDeadline) {
      const deadline = new Date(applicationDeadline);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (deadline >= today) {
        alert("신청 마감일이 지나지 않아 확인할 수 없습니다.");
        return;
      }
    }

    setIsChecking(true);
    setResult(null);

    try {
      const response = await fetch(`/api/applications/${applicationId}/check-selection`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "당첨 확인 중 오류가 발생했습니다.");
      }

      setResult({
        isSelected: data.isSelected,
        message: data.message,
        autoUpdated: data.autoUpdated,
      });

      if (data.isSelected && data.autoUpdated) {
        // 자동 업데이트된 경우 성공 콜백 호출
        if (onSuccess) {
          setTimeout(() => {
            onSuccess();
          }, 1000);
        }
      }
    } catch (error: any) {
      alert(error.message || "당첨 확인 중 오류가 발생했습니다.");
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="space-y-2">
      <Button
        onClick={handleCheck}
        disabled={isChecking}
        variant="outline"
        size="sm"
        className="w-full"
      >
        {isChecking ? (
          <span className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
            확인 중...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            당첨 확인
          </span>
        )}
      </Button>
      
      {result && (
        <div
          className={`text-sm p-2 rounded-md ${
            result.isSelected
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-yellow-50 text-yellow-700 border border-yellow-200"
          }`}
        >
          {result.message}
          {result.autoUpdated && (
            <div className="mt-1 text-xs text-green-600">
              ✓ 자동으로 선정 처리되었습니다.
            </div>
          )}
        </div>
      )}
    </div>
  );
}



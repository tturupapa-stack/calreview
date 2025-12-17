"use client";

interface SelectionRateBadgeProps {
  recruitCount?: number | null;
  applicantCount?: number | null;
  selectionRate?: number | null;
  showProgress?: boolean;
  size?: "sm" | "md" | "lg";
}

/**
 * 선택률 배지 컴포넌트
 * - 모집인원/신청자수를 표시
 * - 선택률(경쟁률)을 색상으로 표현
 * - 프로그레스 바 옵션
 */
export function SelectionRateBadge({
  recruitCount,
  applicantCount,
  selectionRate,
  showProgress = false,
  size = "sm",
}: SelectionRateBadgeProps) {
  // 데이터가 없으면 표시하지 않음
  if (!recruitCount || !applicantCount) {
    return null;
  }

  // 선택률 계산 (없으면 직접 계산)
  const rate = selectionRate ?? (applicantCount > 0 ? (recruitCount / applicantCount) * 100 : 0);

  // 경쟁률 (신청자수 / 모집인원)
  const competitionRatio = recruitCount > 0 ? applicantCount / recruitCount : 0;

  // 색상 결정 (선택률 기준)
  // 높은 선택률 = 좋음 (초록), 낮은 선택률 = 경쟁 치열 (빨강)
  const getColorClass = () => {
    if (rate >= 50) return "bg-green-100 text-green-700 border-green-200"; // 50% 이상: 쉬움
    if (rate >= 20) return "bg-yellow-100 text-yellow-700 border-yellow-200"; // 20-50%: 보통
    if (rate >= 10) return "bg-orange-100 text-orange-700 border-orange-200"; // 10-20%: 경쟁
    return "bg-red-100 text-red-700 border-red-200"; // 10% 미만: 치열
  };

  const getProgressColor = () => {
    if (rate >= 50) return "bg-green-500";
    if (rate >= 20) return "bg-yellow-500";
    if (rate >= 10) return "bg-orange-500";
    return "bg-red-500";
  };

  // 사이즈별 스타일
  const sizeClasses = {
    sm: "text-xs px-1.5 py-0.5",
    md: "text-sm px-2 py-1",
    lg: "text-base px-3 py-1.5",
  };

  // 프로그레스 바 높이
  const progressHeight = {
    sm: "h-1",
    md: "h-1.5",
    lg: "h-2",
  };

  // 채워진 비율 (100%를 넘지 않도록)
  const fillPercent = Math.min(100, (applicantCount / recruitCount) * 100);

  return (
    <div className="flex flex-col gap-1">
      <div className={`inline-flex items-center gap-1 ${sizeClasses[size]} rounded border ${getColorClass()} font-medium`}>
        <span>{applicantCount}</span>
        <span className="opacity-60">/</span>
        <span>{recruitCount}</span>
        <span className="opacity-60 ml-0.5">명</span>
        {rate < 100 && (
          <span className="ml-1 opacity-80">
            ({rate.toFixed(0)}%)
          </span>
        )}
      </div>

      {showProgress && (
        <div className={`w-full ${progressHeight[size]} bg-gray-200 rounded-full overflow-hidden`}>
          <div
            className={`${progressHeight[size]} ${getProgressColor()} transition-all duration-300`}
            style={{ width: `${fillPercent}%` }}
          />
        </div>
      )}
    </div>
  );
}

/**
 * 간단한 경쟁률 텍스트 표시
 */
export function CompetitionText({
  recruitCount,
  applicantCount,
}: {
  recruitCount?: number | null;
  applicantCount?: number | null;
}) {
  if (!recruitCount || !applicantCount) {
    return null;
  }

  const ratio = applicantCount / recruitCount;
  const rateText = ratio >= 1
    ? `${ratio.toFixed(1)}:1`
    : `${((recruitCount / applicantCount)).toFixed(1)}명당 1명`;

  return (
    <span className="text-xs text-gray-500">
      경쟁률 {rateText}
    </span>
  );
}

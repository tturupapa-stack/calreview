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
  // 데이터가 없으면 표시하지 않음 (0은 유효한 값이므로 null/undefined만 체크)
  if (recruitCount == null || applicantCount == null) {
    return null;
  }

  // 선택률 계산 (없으면 직접 계산)
  // applicantCount가 0이면 100% (신청자가 없으면 당첨 확정)
  const rate = selectionRate ?? (applicantCount > 0 ? Math.min(100, (recruitCount / applicantCount) * 100) : 100);

  // 색상 결정 (선택률 기준)
  const getRateClass = () => {
    if (rate >= 50) return "rate-easy";
    if (rate >= 20) return "rate-normal";
    if (rate >= 10) return "rate-competitive";
    return "rate-intense";
  };

  const getProgressColor = () => {
    if (rate >= 50) return "bg-emerald-500";
    if (rate >= 20) return "bg-amber-500";
    if (rate >= 10) return "bg-orange-500";
    return "bg-red-500";
  };

  const getRateLabel = () => {
    if (rate >= 50) return "당첨 쉬움";
    if (rate >= 20) return "보통";
    if (rate >= 10) return "경쟁 중";
    return "경쟁 치열";
  };

  // 사이즈별 스타일
  const sizeClasses = {
    sm: "text-xs px-2 py-1",
    md: "text-sm px-2.5 py-1.5",
    lg: "text-base px-3 py-2",
  };

  // 프로그레스 바 높이
  const progressHeight = {
    sm: "h-1.5",
    md: "h-2",
    lg: "h-2.5",
  };

  // 채워진 비율 (100%를 넘지 않도록)
  const fillPercent = Math.min(100, (applicantCount / recruitCount) * 100);

  return (
    <div className="flex flex-col gap-1.5">
      <div className={`inline-flex items-center gap-1.5 ${sizeClasses[size]} rounded-lg ${getRateClass()} font-semibold`}>
        <span className="font-number">{applicantCount}</span>
        <span className="opacity-50">/</span>
        <span className="font-number">{recruitCount}</span>
        <span className="opacity-50">명</span>
        <span className="mx-1 opacity-30">|</span>
        <span className="font-number">{Math.min(100, rate).toFixed(0)}%</span>
      </div>

      {showProgress && (
        <div className={`w-full ${progressHeight[size]} bg-secondary rounded-full overflow-hidden`}>
          <div
            className={`${progressHeight[size]} ${getProgressColor()} rounded-full transition-all duration-500 ease-out`}
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

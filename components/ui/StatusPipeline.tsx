"use client";

import { useEffect, useState } from "react";

interface StatusCount {
  bookmarked: number;
  applied: number;
  selected: number;
  completed: number;
}

interface StatusPipelineProps {
  counts: StatusCount;
  currentStatus: string;
  onStatusChange: (status: string) => void;
}

const statusConfig = {
  bookmarked: {
    label: "북마크",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
      </svg>
    ),
    activeColor: "bg-gradient-to-br from-slate-500 to-slate-600",
    bgColor: "bg-slate-100",
    textColor: "text-slate-600",
    borderColor: "border-slate-300",
  },
  applied: {
    label: "신청완료",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
    activeColor: "bg-gradient-to-br from-amber-400 to-amber-500",
    bgColor: "bg-amber-50",
    textColor: "text-amber-600",
    borderColor: "border-amber-300",
  },
  selected: {
    label: "선정됨",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    activeColor: "bg-gradient-to-br from-emerald-400 to-emerald-500",
    bgColor: "bg-emerald-50",
    textColor: "text-emerald-600",
    borderColor: "border-emerald-300",
  },
  completed: {
    label: "리뷰완료",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    ),
    activeColor: "bg-gradient-to-br from-violet-400 to-violet-500",
    bgColor: "bg-violet-50",
    textColor: "text-violet-600",
    borderColor: "border-violet-300",
  },
};

const statusOrder = ["bookmarked", "applied", "selected", "completed"] as const;

export function StatusPipeline({ counts, currentStatus, onStatusChange }: StatusPipelineProps) {
  const [animatedCounts, setAnimatedCounts] = useState<StatusCount>({
    bookmarked: 0,
    applied: 0,
    selected: 0,
    completed: 0,
  });

  // Count-up animation
  useEffect(() => {
    const duration = 800;
    const steps = 20;
    const interval = duration / steps;

    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      const easeOut = 1 - Math.pow(1 - progress, 3);

      setAnimatedCounts({
        bookmarked: Math.round(counts.bookmarked * easeOut),
        applied: Math.round(counts.applied * easeOut),
        selected: Math.round(counts.selected * easeOut),
        completed: Math.round(counts.completed * easeOut),
      });

      if (step >= steps) {
        clearInterval(timer);
        setAnimatedCounts(counts);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [counts]);

  return (
    <div className="w-full">
      {/* Desktop Pipeline */}
      <div className="hidden sm:flex items-center justify-between gap-2 p-4 bg-white rounded-2xl shadow-sm border border-border/50">
        {statusOrder.map((status, index) => {
          const config = statusConfig[status];
          const isActive = currentStatus === status;
          const count = animatedCounts[status];

          return (
            <div key={status} className="flex items-center flex-1">
              {/* Step */}
              <button
                onClick={() => onStatusChange(status)}
                className={`
                  relative flex-1 flex flex-col items-center p-4 rounded-xl transition-all duration-300
                  ${isActive
                    ? `${config.activeColor} text-white shadow-lg scale-105`
                    : `${config.bgColor} ${config.textColor} hover:scale-102 hover:shadow-md`
                  }
                `}
              >
                {/* Icon */}
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center mb-2
                  ${isActive ? "bg-white/20" : "bg-white shadow-sm"}
                `}>
                  <span className={isActive ? "text-white" : config.textColor}>
                    {config.icon}
                  </span>
                </div>

                {/* Label */}
                <span className="text-sm font-medium mb-1">{config.label}</span>

                {/* Count */}
                <span className={`
                  font-number text-2xl font-bold
                  ${isActive ? "text-white" : config.textColor}
                `}>
                  {count}
                </span>

                {/* Active indicator */}
                {isActive && (
                  <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce" />
                  </div>
                )}
              </button>

              {/* Connector Arrow */}
              {index < statusOrder.length - 1 && (
                <div className="flex-shrink-0 px-2">
                  <svg
                    className="w-6 h-6 text-gray-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile Pipeline */}
      <div className="sm:hidden space-y-2">
        {/* Progress bar */}
        <div className="flex gap-1 mb-4">
          {statusOrder.map((status) => {
            const config = statusConfig[status];
            const isActive = currentStatus === status;
            const currentIndex = statusOrder.indexOf(currentStatus as any);
            const thisIndex = statusOrder.indexOf(status);
            const isPast = thisIndex < currentIndex;

            return (
              <button
                key={status}
                onClick={() => onStatusChange(status)}
                className={`
                  flex-1 h-2 rounded-full transition-all duration-300
                  ${isActive
                    ? config.activeColor
                    : isPast
                      ? "bg-primary/30"
                      : "bg-gray-200"
                  }
                `}
              />
            );
          })}
        </div>

        {/* Status cards - scrollable */}
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x snap-mandatory">
          {statusOrder.map((status) => {
            const config = statusConfig[status];
            const isActive = currentStatus === status;
            const count = animatedCounts[status];

            return (
              <button
                key={status}
                onClick={() => onStatusChange(status)}
                className={`
                  flex-shrink-0 w-24 flex flex-col items-center p-3 rounded-xl transition-all duration-300 snap-center
                  ${isActive
                    ? `${config.activeColor} text-white shadow-lg`
                    : `${config.bgColor} ${config.textColor} border ${config.borderColor}`
                  }
                `}
              >
                <span className={isActive ? "text-white" : config.textColor}>
                  {config.icon}
                </span>
                <span className="text-xs font-medium mt-1">{config.label}</span>
                <span className="font-number text-xl font-bold mt-0.5">{count}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

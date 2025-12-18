"use client";

import { useEffect, useState } from "react";

interface StatCardProps {
  title: string;
  value: number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: "primary" | "success" | "warning" | "premium";
  size?: "sm" | "md" | "lg";
}

const colorClasses = {
  primary: {
    bg: "bg-gradient-to-br from-primary/10 to-primary/5",
    icon: "bg-primary/20 text-primary",
    text: "text-primary",
    trend: "text-primary",
  },
  success: {
    bg: "bg-gradient-to-br from-emerald-100/80 to-emerald-50",
    icon: "bg-emerald-200 text-emerald-600",
    text: "text-emerald-600",
    trend: "text-emerald-600",
  },
  warning: {
    bg: "bg-gradient-to-br from-amber-100/80 to-amber-50",
    icon: "bg-amber-200 text-amber-600",
    text: "text-amber-600",
    trend: "text-amber-600",
  },
  premium: {
    bg: "bg-gradient-to-br from-violet-100/80 to-violet-50",
    icon: "bg-violet-200 text-violet-600",
    text: "text-violet-600",
    trend: "text-violet-600",
  },
};

const sizeClasses = {
  sm: {
    card: "p-3",
    icon: "w-8 h-8",
    value: "text-xl",
    title: "text-xs",
    subtitle: "text-xs",
  },
  md: {
    card: "p-4",
    icon: "w-10 h-10",
    value: "text-2xl",
    title: "text-sm",
    subtitle: "text-xs",
  },
  lg: {
    card: "p-5",
    icon: "w-12 h-12",
    value: "text-3xl",
    title: "text-base",
    subtitle: "text-sm",
  },
};

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  color = "primary",
  size = "md",
}: StatCardProps) {
  const [animatedValue, setAnimatedValue] = useState(0);

  // Count-up animation
  useEffect(() => {
    const duration = 1000;
    const steps = 30;
    const interval = duration / steps;

    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setAnimatedValue(Math.round(value * easeOut));

      if (step >= steps) {
        clearInterval(timer);
        setAnimatedValue(value);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [value]);

  const colors = colorClasses[color];
  const sizes = sizeClasses[size];

  return (
    <div className={`
      ${colors.bg} ${sizes.card} rounded-xl border border-white/50 shadow-sm
      hover:shadow-md transition-all duration-300 hover:-translate-y-0.5
    `}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className={`${sizes.title} font-medium text-muted-foreground mb-1`}>
            {title}
          </p>
          <p className={`${sizes.value} font-bold font-number ${colors.text} animate-count-up`}>
            {animatedValue}
          </p>
          {subtitle && (
            <p className={`${sizes.subtitle} text-muted-foreground mt-1`}>
              {subtitle}
            </p>
          )}
          {trend && (
            <div className={`flex items-center gap-1 mt-2 ${sizes.subtitle}`}>
              {trend.isPositive ? (
                <svg className="w-3 h-3 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-3 h-3 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
              <span className={trend.isPositive ? "text-emerald-600" : "text-red-600"}>
                {trend.isPositive ? "+" : ""}{trend.value}%
              </span>
              <span className="text-muted-foreground">vs 지난달</span>
            </div>
          )}
        </div>
        {icon && (
          <div className={`${sizes.icon} ${colors.icon} rounded-xl flex items-center justify-center`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

interface StatDashboardProps {
  stats: {
    applied: number;
    selected: number;
    completed: number;
    selectionRate?: number;
  };
}

export function StatDashboard({ stats }: StatDashboardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-border/50 p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
          <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-foreground">이번 달 성과</h3>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          title="신청"
          value={stats.applied}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          }
          color="warning"
          size="sm"
        />
        <StatCard
          title="당첨"
          value={stats.selected}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          color="success"
          size="sm"
        />
        <StatCard
          title="완료"
          value={stats.completed}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          }
          color="premium"
          size="sm"
        />
        <StatCard
          title="당첨률"
          value={stats.selectionRate ?? 0}
          subtitle="%"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          }
          color="primary"
          size="sm"
        />
      </div>
    </div>
  );
}

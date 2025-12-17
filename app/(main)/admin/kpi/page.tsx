"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";

interface KPIMetrics {
  date: string;
  mau: number;
  dau: number;
  retention_rate_7d: number;
  avg_session_duration: number;
  calendar_sync_rate: number;
  avg_bookmarks_per_user: number;
  search_to_detail_ctr: number;
  detail_to_bookmark_ctr: number;
  bookmark_to_selection_ctr: number;
  original_site_click_rate: number;
}

interface KPIGoals {
  mau: number;
  retention_rate_7d: number;
  avg_session_duration: number;
  calendar_sync_rate: number;
}

export default function KPIDashboard() {
  const [kpis, setKPIs] = useState<KPIMetrics[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [goals] = useState<KPIGoals>({
    mau: 5000,
    retention_rate_7d: 0.4,
    avg_session_duration: 180,
    calendar_sync_rate: 0.3,
  });

  useEffect(() => {
    const fetchKPIs = async () => {
      try {
        // 최근 30일 데이터 가져오기
        const response = await fetch("/api/admin/kpi?days=30");
        if (response.ok) {
          const data = await response.json();
          setKPIs(data.kpis || []);
        }
      } catch (error) {
        console.error("KPI 조회 오류:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchKPIs();
  }, []);

  const latestKPI = kpis[0];
  const calculateTrend = (current: number, previous: number): number => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  const formatPercentage = (value: number): string => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}분 ${secs}초`;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-16">
          <div className="inline-block w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          <p className="mt-4 text-muted-foreground">KPI 데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!latestKPI) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-16">
          <p className="text-muted-foreground">KPI 데이터가 없습니다.</p>
        </div>
      </div>
    );
  }

  const previousKPI = kpis[1];

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold font-heading mb-2">KPI 대시보드</h1>
        <p className="text-muted-foreground">서비스 핵심 지표를 확인하세요</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">MAU</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{latestKPI.mau.toLocaleString()}</div>
            {previousKPI && (
              <div className={`text-sm mt-2 ${calculateTrend(latestKPI.mau, previousKPI.mau) >= 0 ? "text-green-600" : "text-red-600"}`}>
                {calculateTrend(latestKPI.mau, previousKPI.mau) >= 0 ? "↑" : "↓"} {Math.abs(calculateTrend(latestKPI.mau, previousKPI.mau)).toFixed(1)}%
              </div>
            )}
            <div className="text-xs text-muted-foreground mt-1">목표: {goals.mau.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">DAU</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{latestKPI.dau.toLocaleString()}</div>
            {previousKPI && (
              <div className={`text-sm mt-2 ${calculateTrend(latestKPI.dau, previousKPI.dau) >= 0 ? "text-green-600" : "text-red-600"}`}>
                {calculateTrend(latestKPI.dau, previousKPI.dau) >= 0 ? "↑" : "↓"} {Math.abs(calculateTrend(latestKPI.dau, previousKPI.dau)).toFixed(1)}%
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">재방문율 (7일)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatPercentage(latestKPI.retention_rate_7d)}</div>
            {previousKPI && (
              <div className={`text-sm mt-2 ${calculateTrend(latestKPI.retention_rate_7d, previousKPI.retention_rate_7d) >= 0 ? "text-green-600" : "text-red-600"}`}>
                {calculateTrend(latestKPI.retention_rate_7d, previousKPI.retention_rate_7d) >= 0 ? "↑" : "↓"} {Math.abs(calculateTrend(latestKPI.retention_rate_7d, previousKPI.retention_rate_7d)).toFixed(1)}%
              </div>
            )}
            <div className="text-xs text-muted-foreground mt-1">목표: {formatPercentage(goals.retention_rate_7d)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">평균 세션 시간</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatDuration(latestKPI.avg_session_duration)}</div>
            {previousKPI && (
              <div className={`text-sm mt-2 ${calculateTrend(latestKPI.avg_session_duration, previousKPI.avg_session_duration) >= 0 ? "text-green-600" : "text-red-600"}`}>
                {calculateTrend(latestKPI.avg_session_duration, previousKPI.avg_session_duration) >= 0 ? "↑" : "↓"} {Math.abs(calculateTrend(latestKPI.avg_session_duration, previousKPI.avg_session_duration)).toFixed(1)}%
              </div>
            )}
            <div className="text-xs text-muted-foreground mt-1">목표: {formatDuration(goals.avg_session_duration)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">캘린더 연동률</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatPercentage(latestKPI.calendar_sync_rate)}</div>
            <div className="text-xs text-muted-foreground mt-1">목표: {formatPercentage(goals.calendar_sync_rate)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">사용자당 평균 북마크</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{latestKPI.avg_bookmarks_per_user.toFixed(1)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">검색 → 상세 CTR</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(latestKPI.search_to_detail_ctr)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">상세 → 북마크 CTR</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(latestKPI.detail_to_bookmark_ctr)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">북마크 → 선정 CTR</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(latestKPI.bookmark_to_selection_ctr)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">원본 사이트 클릭률</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(latestKPI.original_site_click_rate)}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}



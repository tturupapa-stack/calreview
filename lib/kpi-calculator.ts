/**
 * KPI 계산 로직
 * 일별/주별/월별 KPI를 계산하고 저장합니다.
 */

import { createClient } from "@/lib/supabase-server";

export interface KPIMetrics {
  date: string;
  mau: number; // Monthly Active Users
  dau: number; // Daily Active Users
  retention_rate_7d: number; // 7일 재방문율
  avg_session_duration: number; // 평균 세션 시간 (초)
  calendar_sync_rate: number; // 캘린더 연동률
  avg_bookmarks_per_user: number; // 사용자당 평균 북마크 수
  search_to_detail_ctr: number; // 검색 → 상세 CTR
  detail_to_bookmark_ctr: number; // 상세 → 북마크 CTR
  bookmark_to_selection_ctr: number; // 북마크 → 선정 CTR
  original_site_click_rate: number; // 원본 사이트 클릭률
}

/**
 * 일별 KPI 계산
 */
export async function calculateDailyKPIs(date: Date): Promise<KPIMetrics> {
  const supabase = await createClient();
  const dateStr = date.toISOString().split("T")[0];
  const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);

  // MAU 계산 (이번 달 활성 사용자)
  const { data: mauData } = await supabase
    .from("users")
    .select("id")
    .gte("last_active_at", startOfMonth.toISOString());
  const mau = mauData?.length || 0;

  // DAU 계산 (오늘 활성 사용자)
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  const { data: dauData } = await supabase
    .from("users")
    .select("id")
    .gte("last_active_at", startOfDay.toISOString())
    .lte("last_active_at", endOfDay.toISOString());
  const dau = dauData?.length || 0;

  // 재방문율 계산 (7일 전에 방문했던 사용자 중 오늘 다시 방문한 사용자)
  const sevenDaysAgo = new Date(date);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const fourteenDaysAgo = new Date(date);
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  const { data: returningUsers } = await supabase
    .from("users")
    .select("id")
    .gte("last_active_at", sevenDaysAgo.toISOString())
    .lt("last_active_at", dateStr);

  const retention_rate_7d = mau > 0 ? (returningUsers?.length || 0) / mau : 0;

  // 평균 세션 시간 (Google Analytics에서 가져오거나, 추정값 사용)
  // TODO: 실제 세션 데이터가 있으면 계산
  const avg_session_duration = 180; // 임시값 (초)

  // 캘린더 연동률
  const { data: usersWithCalendar } = await supabase
    .from("users")
    .select("id")
    .eq("google_calendar_connected", true);
  const calendar_sync_rate = mau > 0 ? (usersWithCalendar?.length || 0) / mau : 0;

  // 사용자당 평균 북마크 수
  const { data: applications } = await supabase
    .from("applications")
    .select("user_id")
    .neq("status", "cancelled");
  
  const bookmarkCounts = new Map<string, number>();
  applications?.forEach((app) => {
    const count = bookmarkCounts.get(app.user_id) || 0;
    bookmarkCounts.set(app.user_id, count + 1);
  });
  
  const totalBookmarks = Array.from(bookmarkCounts.values()).reduce((sum, count) => sum + count, 0);
  const avg_bookmarks_per_user = mau > 0 ? totalBookmarks / mau : 0;

  // 전환율 계산 (Google Analytics 이벤트 기반)
  // TODO: 실제 이벤트 데이터가 있으면 계산
  const search_to_detail_ctr = 0.3; // 임시값
  const detail_to_bookmark_ctr = 0.2; // 임시값
  const bookmark_to_selection_ctr = 0.1; // 임시값
  const original_site_click_rate = 0.5; // 임시값

  return {
    date: dateStr,
    mau,
    dau,
    retention_rate_7d,
    avg_session_duration,
    calendar_sync_rate,
    avg_bookmarks_per_user,
    search_to_detail_ctr,
    detail_to_bookmark_ctr,
    bookmark_to_selection_ctr,
    original_site_click_rate,
  };
}

/**
 * KPI 저장
 */
export async function saveDailyKPIs(metrics: KPIMetrics) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from("kpi_metrics")
    .upsert({
      date: metrics.date,
      mau: metrics.mau,
      dau: metrics.dau,
      retention_rate_7d: metrics.retention_rate_7d,
      avg_session_duration: metrics.avg_session_duration,
      calendar_sync_rate: metrics.calendar_sync_rate,
      avg_bookmarks_per_user: metrics.avg_bookmarks_per_user,
      search_to_detail_ctr: metrics.search_to_detail_ctr,
      detail_to_bookmark_ctr: metrics.detail_to_bookmark_ctr,
      bookmark_to_selection_ctr: metrics.bookmark_to_selection_ctr,
      original_site_click_rate: metrics.original_site_click_rate,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: "date",
    });

  if (error) {
    console.error("KPI 저장 오류:", error);
    throw error;
  }
}

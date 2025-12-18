import { NextRequest, NextResponse } from "next/server";
import { calculateDailyKPIs, saveDailyKPIs } from "@/lib/kpi-calculator";

/**
 * KPI 계산 스케줄러
 * Vercel Cron 또는 외부 스케줄러에서 호출합니다.
 */
export async function GET(request: NextRequest) {
  try {
    // 인증: Vercel Cron Secret 또는 Authorization 헤더
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 어제 날짜의 KPI 계산
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const kpis = await calculateDailyKPIs(yesterday);
    await saveDailyKPIs(kpis);

    return NextResponse.json({
      success: true,
      date: kpis.date,
      kpis,
    });
  } catch (error: any) {
    console.error("KPI 계산 오류:", error);
    return NextResponse.json(
      { error: error.message || "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}




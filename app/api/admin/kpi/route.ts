import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

/**
 * KPI 조회 API
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get("days") || "30");

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from("kpi_metrics")
      .select("*")
      .gte("date", startDate.toISOString().split("T")[0])
      .order("date", { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      kpis: data || [],
    });
  } catch (error: any) {
    console.error("KPI 조회 오류:", error);
    return NextResponse.json(
      { error: error.message || "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

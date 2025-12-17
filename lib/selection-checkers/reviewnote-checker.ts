/**
 * 리뷰노트 당첨 확인 크롤러
 * 네이버 로그인 세션을 활용하여 "내 신청 내역" 페이지를 크롤링합니다.
 */

import { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase-server";
import type { SelectionChecker } from "./index";

export class ReviewNoteSelectionChecker implements SelectionChecker {
  async checkSelection(user: User, campaignUrl: string): Promise<boolean> {
    try {
      // 네이버 세션 정보 가져오기 (users 테이블에 저장된 쿠키 정보)
      const supabase = await createClient();
      const { data: userData, error } = await supabase
        .from("users")
        .select("naver_session_cookies")
        .eq("id", user.id)
        .single();

      if (error || !userData?.naver_session_cookies) {
        throw new Error("네이버 로그인 세션이 필요합니다. 네이버로 다시 로그인해주세요.");
      }

      // 네이버 세션 쿠키로 "내 신청 내역" 페이지 크롤링
      // 실제 구현은 서버 사이드에서 수행해야 하므로,
      // 여기서는 API 엔드포인트를 호출하는 방식으로 구현
      const response = await fetch("/api/crawler/check-selection", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          site: "reviewnote",
          campaignUrl,
          cookies: userData.naver_session_cookies,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "당첨 확인 중 오류가 발생했습니다.");
      }

      const data = await response.json();
      return data.isSelected === true;
    } catch (error: any) {
      console.error("리뷰노트 당첨 확인 오류:", error);
      throw error;
    }
  }
}



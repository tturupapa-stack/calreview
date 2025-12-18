/**
 * 사이트별 당첨 확인 크롤러 팩토리
 */

import { ReviewNoteSelectionChecker } from "./reviewnote-checker";
import { User } from "@supabase/supabase-js";

export interface SelectionChecker {
  checkSelection(user: User, campaignUrl: string): Promise<boolean>;
}

/**
 * 사이트별 당첨 확인 크롤러 가져오기
 */
export function getSelectionChecker(source: string): SelectionChecker | null {
  switch (source) {
    case "reviewnote":
      return new ReviewNoteSelectionChecker();
    // TODO: 다른 사이트 크롤러 추가
    // case "dinnerqueen":
    //   return new DinnerQueenSelectionChecker();
    // case "reviewplace":
    //   return new ReviewPlaceSelectionChecker();
    default:
      return null;
  }
}




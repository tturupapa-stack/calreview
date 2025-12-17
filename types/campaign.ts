export type SiteName = "reviewnote" | "revu" | "dinnerqueen" | "gangnam" | "reviewplace" | "seoulouba" | "modooexperience" | "pavlovu" | "stylec" | "modan" | "myinfluencer" | "chuble" | "real_review" | "dinodan";

export interface Campaign {
  id: string;
  source: SiteName;
  source_id: string;
  source_url: string;
  title: string;
  description?: string | null;
  thumbnail_url?: string | null;
  category?: string | null;
  region?: string | null;
  type?: "visit" | "delivery" | "reporter" | null;
  reward?: string | null;
  reward_value?: number | null;
  capacity?: number | null;
  application_deadline?: string | null;
  review_deadline_days?: number | null;
  recruit_count?: number | null;       // 모집인원
  applicant_count?: number | null;     // 신청자수
  selection_rate?: number | null;      // 선택률 (%)
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // 크롤러에서 추가하는 필드 (Supabase에 저장되지 않지만 표시용)
  deadline?: string; // D-day 형식 (표시용, application_deadline에서 계산)
  location?: string; // region과 동일
  image_url?: string; // thumbnail_url과 동일
  channel?: string; // 크롤러에서 추출한 채널 정보
}


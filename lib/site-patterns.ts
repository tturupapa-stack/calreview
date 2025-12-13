/**
 * 사이트별 선정일 및 리뷰 기간 패턴 데이터베이스
 * 실제 데이터를 기반으로 지속적으로 업데이트됩니다.
 */

export interface SitePattern {
  site_name: string;
  average_selection_delay_days: number; // 신청 마감일로부터 평균 며칠 후 선정
  review_period_days: number | null; // 기본 리뷰 기간
  last_updated: string;
  sample_size: number; // 학습 데이터 개수
}

/**
 * 사이트별 기본 패턴
 * 실제 사용자 데이터로 지속적으로 업데이트됩니다.
 */
export const SITE_PATTERNS: Record<string, SitePattern> = {
  reviewnote: {
    site_name: "reviewnote",
    average_selection_delay_days: 1.5, // 평균 1.5일 후
    review_period_days: 7, // 기본 7일
    last_updated: new Date().toISOString(),
    sample_size: 0,
  },
  dinnerqueen: {
    site_name: "dinnerqueen",
    average_selection_delay_days: 2,
    review_period_days: 10,
    last_updated: new Date().toISOString(),
    sample_size: 0,
  },
  reviewplace: {
    site_name: "reviewplace",
    average_selection_delay_days: 1,
    review_period_days: 7,
    last_updated: new Date().toISOString(),
    sample_size: 0,
  },
  seoulouba: {
    site_name: "seoulouba",
    average_selection_delay_days: 1.5,
    review_period_days: 7,
    last_updated: new Date().toISOString(),
    sample_size: 0,
  },
  modooexperience: {
    site_name: "modooexperience",
    average_selection_delay_days: 2,
    review_period_days: 7,
    last_updated: new Date().toISOString(),
    sample_size: 0,
  },
  pavlovu: {
    site_name: "pavlovu",
    average_selection_delay_days: 1,
    review_period_days: 7,
    last_updated: new Date().toISOString(),
    sample_size: 0,
  },
  gangnam: {
    site_name: "gangnam",
    average_selection_delay_days: 1.5,
    review_period_days: 7,
    last_updated: new Date().toISOString(),
    sample_size: 0,
  },
};

/**
 * 패턴 업데이트 (실제 사용자 피드백 데이터로부터)
 */
export async function updateSitePattern(siteName: string, pattern: Partial<SitePattern>) {
  // TODO: Supabase에 패턴 저장
  // 현재는 메모리상에서만 업데이트
  if (SITE_PATTERNS[siteName]) {
    SITE_PATTERNS[siteName] = {
      ...SITE_PATTERNS[siteName],
      ...pattern,
      last_updated: new Date().toISOString(),
    };
  }
}

/**
 * 패턴 조회
 */
export function getSitePattern(siteName: string): SitePattern | null {
  return SITE_PATTERNS[siteName] || null;
}


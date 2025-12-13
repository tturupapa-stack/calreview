/**
 * 리뷰 마감일 계산기
 * 사이트별 패턴과 크롤링된 정보를 활용하여 정확한 리뷰 마감일을 계산합니다.
 */

import type { Campaign } from "@/types/campaign";
import { getSitePattern } from "./site-patterns";

/**
 * 리뷰 마감일 계산
 * 
 * 우선순위:
 * 1. 크롤링된 review_deadline_days 사용
 * 2. 사이트별 기본값 사용
 * 3. 기본값 (7일)
 */
export function calculateReviewDeadline(
  campaign: Campaign,
  selectionDate?: Date
): Date {
  // 선정일이 없으면 추정
  const baseDate = selectionDate || estimateSelectionDate(campaign);

  // 1. 크롤링된 review_deadline_days 우선 사용
  if (campaign.review_deadline_days) {
    const deadline = new Date(baseDate);
    deadline.setDate(deadline.getDate() + campaign.review_deadline_days);
    return deadline;
  }

  // 2. 사이트별 기본값 사용
  const pattern = getSitePattern(campaign.source || "");
  if (pattern?.review_period_days) {
    const deadline = new Date(baseDate);
    deadline.setDate(deadline.getDate() + pattern.review_period_days);
    return deadline;
  }

  // 3. 기본값 (7일)
  const deadline = new Date(baseDate);
  deadline.setDate(deadline.getDate() + 7);
  return deadline;
}

/**
 * 선정일 추정
 * 신청 마감일과 사이트별 패턴을 기반으로 선정일을 추정합니다.
 */
export function estimateSelectionDate(campaign: Campaign): Date {
  if (!campaign.application_deadline) {
    return new Date(); // 오늘 기준
  }

  const pattern = getSitePattern(campaign.source || "");
  const deadline = new Date(campaign.application_deadline);
  const delayDays = pattern?.average_selection_delay_days || 1;

  // 마감일이 지났으면 오늘 기준으로 계산
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  deadline.setHours(0, 0, 0, 0);

  if (deadline < today) {
    // 마감일이 지났으면 오늘 + 지연일
    const selectionDate = new Date(today);
    selectionDate.setDate(selectionDate.getDate() + delayDays);
    return selectionDate;
  }

  // 마감일이 아직 안 지났으면 마감일 + 지연일
  deadline.setDate(deadline.getDate() + delayDays);
  return deadline;
}

/**
 * 리뷰 마감일을 문자열로 반환 (YYYY-MM-DD)
 */
export function calculateReviewDeadlineString(
  campaign: Campaign,
  selectionDate?: Date
): string {
  const deadline = calculateReviewDeadline(campaign, selectionDate);
  return deadline.toISOString().split("T")[0];
}

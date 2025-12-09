import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Tailwind 클래스 병합 유틸리티
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

/**
 * 날짜 포맷 함수
 */
export function formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleDateString('ko-KR')
}

/**
 * D-day 계산 (숫자 반환)
 */
export function getDday(targetDate: Date | string): number {
    const target = typeof targetDate === 'string' ? new Date(targetDate) : targetDate
    const today = new Date()
    const diff = target.getTime() - today.getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

/**
 * D-day 계산 (문자열 형식 반환: "D-0", "D-1", "D+1" 등)
 */
export function calculateDday(deadline: string): string {
  try {
    const deadlineDate = new Date(deadline);
    // Invalid date 체크
    if (isNaN(deadlineDate.getTime())) {
      return "";
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    deadlineDate.setHours(0, 0, 0, 0);

    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // NaN 체크
    if (isNaN(diffDays)) {
      return "";
    }

    if (diffDays === 0) return "D-0";
    if (diffDays > 0) return `D-${diffDays}`;
    return `D+${Math.abs(diffDays)}`;
  } catch {
    return "";
  }
}

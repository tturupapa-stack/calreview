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
 * D-day 계산
 */
export function getDday(targetDate: Date | string): number {
    const target = typeof targetDate === 'string' ? new Date(targetDate) : targetDate
    const today = new Date()
    const diff = target.getTime() - today.getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

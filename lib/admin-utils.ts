/**
 * 관리자 권한 관련 유틸리티 함수
 */

/**
 * 환경 변수에서 관리자 이메일 목록을 가져옵니다.
 * @returns 관리자 이메일 배열 (소문자로 정규화됨)
 */
export function getAdminEmails(): string[] {
  // ADMIN_EMAILS 또는 NEXT_PUBLIC_ADMIN_EMAILS 모두 확인 (하위 호환성)
  const adminEmailsRaw = process.env.ADMIN_EMAILS || process.env.NEXT_PUBLIC_ADMIN_EMAILS || "";
  
  // 여러 형태의 줄바꿈과 공백 제거
  const cleaned = adminEmailsRaw
    .replace(/\\n/g, "") // 문자열로 들어온 \n 제거
    .replace(/\n/g, "") // 실제 줄바꿈 제거
    .replace(/\r/g, "") // 캐리지 리턴 제거
    .trim();
  
  if (!cleaned) {
    return [];
  }
  
  return cleaned
    .split(",")
    .map((email) => email.trim())
    .filter((email) => email.length > 0 && email.includes("@")) // 유효한 이메일 형식만
    .map((email) => email.toLowerCase());
}

/**
 * 사용자가 관리자인지 확인합니다.
 * @param userEmail 사용자 이메일
 * @returns 관리자 여부
 */
export function isAdmin(userEmail: string | null | undefined): boolean {
  if (!userEmail) return false;
  const adminEmails = getAdminEmails();
  const normalizedEmail = userEmail.trim().toLowerCase();
  return adminEmails.includes(normalizedEmail);
}

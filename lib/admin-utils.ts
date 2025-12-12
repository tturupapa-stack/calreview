/**
 * 관리자 권한 관련 유틸리티 함수
 */

/**
 * 환경 변수에서 관리자 이메일 목록을 가져옵니다.
 * @returns 관리자 이메일 배열 (소문자로 정규화됨)
 */
export function getAdminEmails(): string[] {
  const adminEmailsRaw = process.env.ADMIN_EMAILS || "";
  return adminEmailsRaw
    .split(",")
    .map((email) => email.trim().replace(/\n/g, ""))
    .filter((email) => email.length > 0)
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

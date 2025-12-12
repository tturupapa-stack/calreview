/**
 * 파일 업로드 관련 상수
 */

// 파일 크기 제한 (바이트)
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// 허용된 MIME 타입
export const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "application/pdf",
] as const;

// 허용된 파일 확장자
export const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".pdf", ".hwp"] as const;

// 파일 타입별 MIME 타입 매핑 (확장자 → MIME 타입)
export const EXTENSION_TO_MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".pdf": "application/pdf",
  ".hwp": "application/x-hwp", // HWP는 브라우저에서 정확한 MIME 타입이 없을 수 있음
};

/**
 * 파일 확장자 추출
 */
export function getFileExtension(filename: string): string {
  const parts = filename.split(".");
  if (parts.length < 2) return "";
  return "." + parts[parts.length - 1].toLowerCase();
}

/**
 * 파일이 허용된 확장자인지 확인
 */
export function isAllowedExtension(filename: string): boolean {
  const extension = getFileExtension(filename);
  return ALLOWED_EXTENSIONS.includes(extension as any);
}

/**
 * 파일 크기가 제한 내인지 확인
 */
export function isFileSizeValid(fileSize: number): boolean {
  return fileSize <= MAX_FILE_SIZE;
}

/**
 * 파일 검증 (클라이언트 측)
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
  // 크기 검증
  if (!isFileSizeValid(file.size)) {
    return {
      valid: false,
      error: `파일 크기는 ${MAX_FILE_SIZE / (1024 * 1024)}MB 이하여야 합니다`,
    };
  }

  // 확장자 검증
  if (!isAllowedExtension(file.name)) {
    return {
      valid: false,
      error: `${ALLOWED_EXTENSIONS.join(", ")} 파일만 업로드 가능합니다`,
    };
  }

  // MIME 타입 검증 (브라우저가 제공하는 경우)
  if (file.type && !ALLOWED_MIME_TYPES.includes(file.type as any)) {
    // HWP 파일은 MIME 타입이 없을 수 있으므로 확장자로만 체크
    const extension = getFileExtension(file.name);
    if (extension !== ".hwp") {
      return {
        valid: false,
        error: "지원하지 않는 파일 형식입니다",
      };
    }
  }

  return { valid: true };
}

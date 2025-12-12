import { NextResponse } from "next/server";

/**
 * API 에러 타입
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * API 에러 응답 생성
 */
export function createErrorResponse(
  error: unknown,
  defaultMessage: string = "서버 오류가 발생했습니다."
): NextResponse {
  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
      },
      { status: error.statusCode }
    );
  }

  if (error instanceof Error) {
    console.error("API 오류:", error);
    return NextResponse.json(
      {
        error: error.message || defaultMessage,
      },
      { status: 500 }
    );
  }

  console.error("알 수 없는 오류:", error);
  return NextResponse.json(
    {
      error: defaultMessage,
    },
    { status: 500 }
  );
}

/**
 * 인증 에러 생성
 */
export function createUnauthorizedError(message: string = "인증이 필요합니다.") {
  return new ApiError(message, 401, "UNAUTHORIZED");
}

/**
 * 권한 에러 생성
 */
export function createForbiddenError(message: string = "권한이 없습니다.") {
  return new ApiError(message, 403, "FORBIDDEN");
}

/**
 * 잘못된 요청 에러 생성
 */
export function createBadRequestError(message: string = "잘못된 요청입니다.") {
  return new ApiError(message, 400, "BAD_REQUEST");
}

/**
 * 리소스 없음 에러 생성
 */
export function createNotFoundError(message: string = "리소스를 찾을 수 없습니다.") {
  return new ApiError(message, 404, "NOT_FOUND");
}

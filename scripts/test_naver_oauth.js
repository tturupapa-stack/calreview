// 네이버 OAuth URL 생성 테스트 스크립트
// 실제로 생성되는 redirect_uri를 확인하기 위한 스크립트

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const redirectUri = `${baseUrl}/api/auth/naver/callback`;

console.log("=== 네이버 OAuth 설정 확인 ===");
console.log("Base URL:", baseUrl);
console.log("Redirect URI:", redirectUri);
console.log("\n네이버 개발자 센터에 등록해야 할 Callback URL:");
console.log(redirectUri);
console.log("\n네이버 개발자 센터에 등록해야 할 서비스 URL:");
console.log(baseUrl.replace(/\/$/, "")); // 끝의 슬래시 제거

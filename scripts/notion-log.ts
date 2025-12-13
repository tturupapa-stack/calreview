#!/usr/bin/env node
/**
 * 개발 일지 Notion 자동 작성 스크립트
 * 
 * 사용법:
 *   npm run notion:log "작업 내용"
 *   npm run notion:log "버그 수정" -- --type fix
 */

import { notionCreatePages } from "@notionhq/client";

// 명령줄 인자 파싱
const args = process.argv.slice(2);
const message = args[0] || "";
const flags = args.slice(1);

const type = flags.includes("--type") 
  ? flags[flags.indexOf("--type") + 1] || "feature"
  : "feature";

const types = {
  feature: "✨ 기능 추가",
  fix: "🐛 버그 수정",
  refactor: "♻️ 리팩토링",
  docs: "📝 문서",
  style: "💄 스타일",
  perf: "⚡️ 성능",
  test: "✅ 테스트",
  chore: "🔧 설정",
};

const typeLabel = types[type as keyof typeof types] || types.feature;

if (!message) {
  console.error("사용법: npm run notion:log \"작업 내용\"");
  process.exit(1);
}

// Git 정보 가져오기
import { execSync } from "child_process";

let gitInfo = {
  branch: "unknown",
  commit: "unknown",
  author: "unknown",
};

try {
  gitInfo.branch = execSync("git rev-parse --abbrev-ref HEAD", { encoding: "utf-8" }).trim();
  gitInfo.commit = execSync("git rev-parse --short HEAD", { encoding: "utf-8" }).trim();
  gitInfo.author = execSync("git config user.name", { encoding: "utf-8" }).trim();
} catch (error) {
  console.warn("Git 정보를 가져올 수 없습니다:", error);
}

const today = new Date();
const dateStr = today.toLocaleDateString("ko-KR", {
  year: "numeric",
  month: "long",
  day: "numeric",
  weekday: "short",
});

// Notion 페이지 생성
const parentPageId = "2c850ca9-d0b5-806d-84f8-c5eee134c0e6"; // 개발일지 페이지 ID (URL에서 추출)

const content = `# ${typeLabel}: ${message}

## 날짜
${dateStr}

## 작업 내용
${message}

## Git 정보
- 브랜치: \`${gitInfo.branch}\`
- 커밋: \`${gitInfo.commit}\`
- 작성자: ${gitInfo.author}

## 변경 사항
- 

## 참고 사항
- 
`;

// TODO: MCP를 통한 Notion API 호출
// 현재는 스크립트 구조만 작성
console.log("개발 일지 내용:");
console.log(content);
console.log("\n⚠️ MCP Notion 통합 필요");

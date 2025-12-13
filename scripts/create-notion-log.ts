#!/usr/bin/env tsx
/**
 * Notion 개발 일지 자동 작성 스크립트
 * 
 * 사용법:
 *   tsx scripts/create-notion-log.ts "작업 내용"
 *   tsx scripts/create-notion-log.ts "버그 수정" --type fix
 *   tsx scripts/create-notion-log.ts "기능 추가" --type feature --details "상세 설명"
 */

import { generateLogContent, DEV_LOG_PAGE_ID, LogEntry } from "../lib/notion-logger";

// 명령줄 인자 파싱
const args = process.argv.slice(2);
const message = args.find((arg, i) => !arg.startsWith("--") && (i === 0 || args[i - 1]?.startsWith("--")));
const flags = args.filter((arg) => arg.startsWith("--"));

const getFlagValue = (flagName: string): string | undefined => {
  const index = flags.indexOf(flagName);
  if (index === -1) return undefined;
  // 다음 인자가 플래그가 아니면 값을 반환
  const nextArg = args[args.indexOf(flagName) + 1];
  return nextArg && !nextArg.startsWith("--") ? nextArg : undefined;
};

if (!message) {
  console.error("❌ 사용법: tsx scripts/create-notion-log.ts \"작업 내용\" [옵션]");
  console.error("\n옵션:");
  console.error("  --type <type>     작업 타입 (feature|fix|refactor|docs|style|perf|test|chore)");
  console.error("  --details <text>  상세 설명");
  console.error("\n예시:");
  console.error('  tsx scripts/create-notion-log.ts "로그인 기능 추가" --type feature');
  console.error('  tsx scripts/create-notion-log.ts "버그 수정" --type fix --details "관리자 권한 체크 로직 수정"');
  process.exit(1);
}

const entry: LogEntry = {
  message,
  type: (getFlagValue("--type") as LogEntry["type"]) || "feature",
  details: getFlagValue("--details"),
};

// 일지 내용 생성
const content = generateLogContent(entry);

console.log("📝 생성된 개발 일지 내용:\n");
console.log("─".repeat(50));
console.log(content);
console.log("─".repeat(50));

// MCP Notion API를 통해 페이지 생성
// 실제 호출은 별도 함수에서 처리
console.log("\n⚠️  MCP Notion API를 통한 페이지 생성은 별도로 처리해야 합니다.");
console.log(`   부모 페이지 ID: ${DEV_LOG_PAGE_ID}`);
console.log("\n다음 단계: MCP 도구를 사용하여 Notion에 페이지를 생성하세요.");

/**
 * Notion 개발 일지 자동 작성 유틸리티
 * MCP Notion API를 사용하여 개발일지 페이지 하위에 일지를 작성합니다.
 */

import { execSync } from "child_process";

export interface LogEntry {
  message: string;
  type?: "feature" | "fix" | "refactor" | "docs" | "style" | "perf" | "test" | "chore";
  details?: string;
}

const TYPE_LABELS: Record<string, string> = {
  feature: "✨ 기능 추가",
  fix: "🐛 버그 수정",
  refactor: "♻️ 리팩토링",
  docs: "📝 문서",
  style: "💄 스타일",
  perf: "⚡️ 성능",
  test: "✅ 테스트",
  chore: "🔧 설정",
};

/**
 * Git 정보를 가져옵니다.
 */
function getGitInfo() {
  try {
    const branch = execSync("git rev-parse --abbrev-ref HEAD", { encoding: "utf-8" }).trim();
    const commit = execSync("git rev-parse --short HEAD", { encoding: "utf-8" }).trim();
    const author = execSync("git config user.name", { encoding: "utf-8" }).trim();
    const email = execSync("git config user.email", { encoding: "utf-8" }).trim();
    
    // 최근 커밋 메시지 가져오기
    let lastCommitMessage = "";
    try {
      lastCommitMessage = execSync("git log -1 --pretty=%B", { encoding: "utf-8" }).trim();
    } catch (e) {
      // 커밋이 없는 경우 무시
    }
    
    return { branch, commit, author, email, lastCommitMessage };
  } catch (error) {
    console.warn("Git 정보를 가져올 수 없습니다:", error);
    return {
      branch: "unknown",
      commit: "unknown",
      author: "unknown",
      email: "unknown",
      lastCommitMessage: "",
    };
  }
}

/**
 * 날짜 문자열을 포맷팅합니다.
 */
function formatDate(): string {
  const today = new Date();
  return today.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });
}

/**
 * 개발 일지 내용을 생성합니다.
 */
export function generateLogContent(entry: LogEntry): string {
  const gitInfo = getGitInfo();
  const dateStr = formatDate();
  const typeLabel = TYPE_LABELS[entry.type || "feature"] || TYPE_LABELS.feature;

  let content = `# ${typeLabel}: ${entry.message}\n\n`;
  content += `## 날짜\n${dateStr}\n\n`;
  content += `## 작업 내용\n${entry.message}\n\n`;

  if (entry.details) {
    content += `## 상세 내용\n${entry.details}\n\n`;
  }

  content += `## Git 정보\n`;
  content += `- **브랜치**: \`${gitInfo.branch}\`\n`;
  content += `- **커밋**: \`${gitInfo.commit}\`\n`;
  content += `- **작성자**: ${gitInfo.author} (${gitInfo.email})\n\n`;

  if (gitInfo.lastCommitMessage) {
    content += `## 커밋 메시지\n\`\`\`\n${gitInfo.lastCommitMessage}\`\`\`\n\n`;
  }

  content += `## 변경 사항\n- \n\n`;
  content += `## 참고 사항\n- \n`;

  return content;
}

/**
 * 개발 일지 페이지 ID
 * https://www.notion.so/2c850ca9d0b5806d84f8c5eee134c0e6
 */
export const DEV_LOG_PAGE_ID = "2c850ca9-d0b5-806d-84f8-c5eee134c0e6";

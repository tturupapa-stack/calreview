# Notion 개발 일지 자동화 사용법

이 프로젝트에서는 개발 작업 시 Notion에 개발 일지를 자동으로 작성할 수 있습니다.

## 설정

Notion 개발일지 페이지: https://www.notion.so/2c850ca9d0b5806d84f8c5eee134c0e6

## 사용법

### 기본 사용

```bash
npm run notion:log "작업 내용"
```

### 작업 타입 지정

```bash
npm run notion:log "버그 수정" -- --type fix
npm run notion:log "기능 추가" -- --type feature
npm run notion:log "문서 업데이트" -- --type docs
```

### 상세 설명 추가

```bash
npm run notion:log "관리자 권한 체크 로직 개선" -- --type fix --details "환경 변수 파싱 로직을 개선하여 줄바꿈 문자 문제를 해결했습니다"
```

## 지원하는 작업 타입

- `feature`: ✨ 기능 추가
- `fix`: 🐛 버그 수정
- `refactor`: ♻️ 리팩토링
- `docs`: 📝 문서
- `style`: 💄 스타일
- `perf`: ⚡️ 성능
- `test`: ✅ 테스트
- `chore`: 🔧 설정

## 자동 수집 정보

스크립트는 다음 정보를 자동으로 수집합니다:

- **날짜**: 현재 날짜 (한국어 형식)
- **Git 브랜치**: 현재 작업 중인 브랜치
- **Git 커밋**: 최근 커밋 해시
- **작성자**: Git 사용자 이름 및 이메일
- **커밋 메시지**: 최근 커밋 메시지

## 워크플로우

1. 작업 완료 후:
   ```bash
   git add .
   git commit -m "작업 내용"
   ```

2. 개발 일지 작성:
   ```bash
   npm run notion:log "작업 내용" -- --type fix
   ```

3. 스크립트가 일지 내용을 생성하면, AI가 MCP를 통해 Notion에 자동으로 추가합니다.

## 예시

### 기능 추가

```bash
npm run notion:log "사용자 프로필 페이지 추가" -- --type feature
```

### 버그 수정

```bash
npm run notion:log "관리자 권한 체크 오류 수정" -- --type fix --details "환경 변수 파싱 로직 개선"
```

### 리팩토링

```bash
npm run notion:log "API 에러 핸들링 표준화" -- --type refactor
```

## 파일 구조

- `lib/notion-logger.ts`: 개발 일지 생성 유틸리티 함수
- `scripts/create-notion-log.ts`: 명령줄 스크립트

## 주의사항

- 스크립트 실행 전에 Git 커밋을 먼저 완료하는 것을 권장합니다.
- Notion 페이지 생성은 MCP를 통해 자동으로 처리됩니다.
- 스크립트만 실행하면 일지 내용이 출력되며, 실제 Notion 추가는 AI가 처리합니다.

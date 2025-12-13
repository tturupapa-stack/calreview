# Supabase 환경 변수 설정 가이드

## 문제 상황

현재 `.env.local` 파일의 Supabase 환경 변수가 placeholder 값으로 설정되어 있어 애플리케이션이 실행되지 않습니다.

## 해결 방법

### 1. Supabase Dashboard 접속

1. [Supabase Dashboard](https://supabase.com/dashboard) 접속
2. 프로젝트 선택 (또는 새 프로젝트 생성)

### 2. API 자격 증명 확인

1. 좌측 메뉴에서 **Settings** 클릭
2. **API** 섹션 선택
3. 다음 정보 확인:
   - **Project URL**: `https://xxxxx.supabase.co` 형식
   - **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` 형식 (긴 문자열)
   - **service_role key**: (선택사항, 서버 사이드 작업용)

### 3. .env.local 파일 업데이트

`.env.local` 파일을 열고 다음 값을 실제 값으로 교체:

```bash
# 기존 (placeholder)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# 실제 값으로 교체 (예시)
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYzODk2NzIwMCwiZXhwIjoxOTU0NTQzMjAwfQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 4. 터미널에서 직접 설정 (선택사항)

Supabase URL과 anon key를 알고 있다면, 다음 명령어로 자동 설정할 수 있습니다:

```bash
# Supabase URL 설정
sed -i '' 's|NEXT_PUBLIC_SUPABASE_URL=.*|NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co|' .env.local

# Supabase anon key 설정
sed -i '' 's|NEXT_PUBLIC_SUPABASE_ANON_KEY=.*|NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY|' .env.local
```

### 5. 개발 서버 재시작

환경 변수를 변경한 후 개발 서버를 재시작하세요:

```bash
# 서버 중지 (Ctrl+C)
# 서버 재시작
npm run dev
```

## 확인 방법

환경 변수가 제대로 설정되었는지 확인:

```bash
# .env.local 파일 확인
cat .env.local | grep -E "NEXT_PUBLIC_SUPABASE"

# placeholder 값이 아닌지 확인
cat .env.local | grep "your_supabase"
```

placeholder 값이 보이지 않으면 정상적으로 설정된 것입니다.

## Vercel 배포 시

Vercel에 배포할 때는 Vercel 대시보드에서 환경 변수를 설정하세요:

1. Vercel 프로젝트 > Settings > Environment Variables
2. 다음 변수 추가:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (필요한 경우)

## 문제 해결

### 에러 메시지가 계속 표시되는 경우

1. `.env.local` 파일이 프로젝트 루트에 있는지 확인
2. 파일 이름이 정확히 `.env.local`인지 확인 (`.env.local.txt` 아님)
3. 개발 서버를 완전히 재시작 (터미널에서 `Ctrl+C` 후 다시 시작)
4. 브라우저 캐시 삭제 및 하드 리프레시 (`Cmd+Shift+R` 또는 `Ctrl+Shift+R`)

### URL 형식이 올바른지 확인

- ✅ 올바른 형식: `https://abcdefghijklmnop.supabase.co`
- ❌ 잘못된 형식: `your_supabase_project_url`, `http://localhost`, 빈 값

### anon key 형식 확인

- ✅ 올바른 형식: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (매우 긴 문자열)
- ❌ 잘못된 형식: `your_supabase_anon_key`, 짧은 문자열

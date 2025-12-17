# Supabase API 키 설정 가이드

## 🔍 현재 상태 확인

크롤러가 Supabase에 연결하려면 다음 환경 변수가 필요합니다:
- `NEXT_PUBLIC_SUPABASE_URL`: ✅ 설정됨
- `SUPABASE_SERVICE_ROLE_KEY`: ❌ 설정 안됨 또는 placeholder

## 📋 Supabase API 키 확인 방법

### 1단계: Supabase Dashboard 접속

1. [Supabase Dashboard](https://supabase.com/dashboard) 접속
2. 로그인 후 프로젝트 선택

### 2단계: API 키 확인

1. 왼쪽 메뉴에서 **Settings** (⚙️) 클릭
2. **API** 메뉴 클릭
3. 다음 정보 확인:
   - **Project URL**: `https://xxxxx.supabase.co` 형식
   - **service_role key** (⚠️ 중요): `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` 형식의 긴 JWT 토큰

### 3단계: .env.local 파일 수정

프로젝트 루트의 `.env.local` 파일을 열고 다음 값을 설정:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**⚠️ 주의사항:**
- `SUPABASE_SERVICE_ROLE_KEY`는 **service_role** 키를 사용해야 합니다 (anon key가 아님)
- Service Role Key는 매우 긴 JWT 토큰입니다 (200자 이상)
- 이 키는 **절대 공개하지 마세요** (GitHub에 커밋하지 않도록 주의)

## 🔐 Service Role Key vs Anon Key

| 키 종류 | 용도 | 권한 |
|---------|------|------|
| **anon key** | 프론트엔드 (브라우저) | RLS 정책에 따라 제한된 권한 |
| **service_role key** | 백엔드/크롤러 | RLS 정책을 우회하는 전체 권한 |

크롤러는 데이터를 직접 저장해야 하므로 **service_role key**가 필요합니다.

## ✅ 설정 확인

설정 후 다음 명령어로 확인:

```bash
cd /Users/larkkim/calreview
python3 -c "
import os
from dotenv import load_dotenv
load_dotenv('.env.local')
url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
print(f'URL: {url[:50] if url else \"없음\"}...')
print(f'KEY: {\"설정됨 (길이: \" + str(len(key)) + \")\" if key and len(key) > 100 else \"설정 안됨\"}')
"
```

정상적으로 설정되었다면:
- URL: `https://xxxxx.supabase.co`
- KEY: `설정됨 (길이: 200 이상)`

## 🧪 테스트

설정 후 크롤러를 다시 실행하여 Supabase 연결을 테스트:

```bash
cd /Users/larkkim/calreview
source crawler/venv/bin/activate
python3 -m crawler.main --mode full
```

성공하면 로그에 다음과 같이 표시됩니다:
```
Supabase 저장 완료: XXX개 캠페인 upsert됨
```

## 🚨 문제 해결

### 문제 1: "Invalid API key" 오류

**원인**: 
- Service Role Key가 잘못되었거나
- Anon Key를 사용했거나
- 키가 잘못 복사되었을 수 있음

**해결**:
1. Supabase Dashboard에서 Service Role Key를 다시 복사
2. `.env.local` 파일에서 키 앞뒤 공백 제거
3. 키가 전체 복사되었는지 확인 (매우 긴 문자열)

### 문제 2: 환경 변수가 로드되지 않음

**원인**: 
- `.env.local` 파일 위치가 잘못되었거나
- 파일 이름이 틀렸을 수 있음

**해결**:
1. `.env.local` 파일이 프로젝트 루트(`/Users/larkkim/calreview/`)에 있는지 확인
2. 파일 이름이 정확히 `.env.local`인지 확인 (`.env.local.txt` 아님)

### 문제 3: 크롤러가 여전히 환경 변수를 찾지 못함

**원인**: 
- 크롤러는 `crawler/utils.py`에서 `.env.local`을 로드합니다
- 경로: `os.path.join(os.path.dirname(__file__), "..", ".env.local")`

**해결**:
1. 프로젝트 루트에 `.env.local` 파일이 있는지 확인
2. 또는 크롤러 실행 전에 환경 변수를 직접 export:
   ```bash
   export NEXT_PUBLIC_SUPABASE_URL="https://xxxxx.supabase.co"
   export SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   ```

## 📚 참고 자료

- [Supabase 공식 문서 - API Keys](https://supabase.com/docs/guides/api/api-keys)
- [Supabase 공식 문서 - Service Role Key](https://supabase.com/docs/guides/api/service-role-key)

# 데이터베이스 Source 제약 조건 업데이트 가이드

## 🔍 문제

스타일씨 크롤러가 데이터를 수집했지만, Supabase 저장 시 다음 오류가 발생했습니다:

```
new row for relation "campaigns" violates check constraint "campaigns_source_check"
```

이는 `campaigns` 테이블의 `source` 컬럼에 CHECK 제약 조건이 있어서, `stylec`가 허용된 값 목록에 없기 때문입니다.

## ✅ 해결 방법

### 방법 1: Supabase SQL Editor에서 실행 (권장)

1. [Supabase Dashboard](https://supabase.com/dashboard) 접속
2. 프로젝트 선택
3. 왼쪽 메뉴에서 **SQL Editor** 클릭
4. **New query** 클릭
5. 다음 SQL을 복사하여 붙여넣기:

```sql
-- 기존 제약 조건 제거
ALTER TABLE public.campaigns
DROP CONSTRAINT IF EXISTS campaigns_source_check;

-- 새 제약 조건 추가 (기존 사이트 + 새 사이트)
ALTER TABLE public.campaigns
ADD CONSTRAINT campaigns_source_check
CHECK (source IN (
    -- 기존 사이트
    'reviewnote', 
    'revu', 
    'dinnerqueen', 
    'gangnam', 
    'reviewplace',
    'seoulouba',
    'modooexperience',
    'pavlovu',
    -- 새 사이트 (법적 리스크 검토 완료)
    'stylec',
    'modan',
    'myinfluencer',
    'chuble',
    'real_review',
    'dinodan'
));
```

6. **Run** 버튼 클릭하여 실행

### 방법 2: SQL 파일 사용

프로젝트에 포함된 SQL 파일을 사용할 수도 있습니다:

```bash
# SQL 파일 위치
docs/supabase-add-new-sites.sql
```

이 파일의 내용을 Supabase SQL Editor에 복사하여 실행하세요.

## 🧪 확인

SQL 실행 후 다음 쿼리로 제약 조건이 올바르게 업데이트되었는지 확인:

```sql
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.campaigns'::regclass
  AND conname = 'campaigns_source_check';
```

결과에 `stylec`, `modan`, `myinfluencer`, `chuble`, `real_review`, `dinodan`이 포함되어 있어야 합니다.

## 🚀 다음 단계

제약 조건 업데이트 후 크롤러를 다시 실행:

```bash
cd /Users/larkkim/calreview
source crawler/venv/bin/activate
python3 -m crawler.main --mode full
```

이제 스타일씨 캠페인이 정상적으로 Supabase에 저장됩니다!

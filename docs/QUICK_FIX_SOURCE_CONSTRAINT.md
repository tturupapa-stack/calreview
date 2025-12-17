# ⚡ 빠른 수정: Source 제약 조건 업데이트

## 문제
스타일씨 크롤러가 데이터를 수집했지만 Supabase 저장 시 오류 발생:
```
violates check constraint "campaigns_source_check"
```

## 해결 (1분 소요)

### Supabase SQL Editor에서 실행

1. [Supabase Dashboard](https://supabase.com/dashboard) 접속
2. 프로젝트 선택
3. **SQL Editor** 클릭
4. **New query** 클릭
5. 아래 SQL 복사하여 붙여넣기:

```sql
ALTER TABLE public.campaigns
DROP CONSTRAINT IF EXISTS campaigns_source_check;

ALTER TABLE public.campaigns
ADD CONSTRAINT campaigns_source_check
CHECK (source IN (
    'reviewnote', 'revu', 'dinnerqueen', 'gangnam', 'reviewplace',
    'seoulouba', 'modooexperience', 'pavlovu',
    'stylec', 'modan', 'myinfluencer', 'chuble', 'real_review', 'dinodan'
));
```

6. **Run** 버튼 클릭

## 확인

실행 후 크롤러를 다시 실행하면 정상 작동합니다:

```bash
cd /Users/larkkim/calreview
source crawler/venv/bin/activate
python3 -m crawler.main --mode full
```

## 완료!

이제 스타일씨 캠페인이 Supabase에 정상적으로 저장됩니다! 🎉

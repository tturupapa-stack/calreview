-- 새 사이트들 추가를 위한 campaigns 테이블 source 제약 조건 업데이트
-- 실행일: 2025-01-13
-- 목적: stylec, modan, myinfluencer, chuble, real_review, dinodan 추가

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

-- 제약 조건 확인
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.campaigns'::regclass
  AND conname = 'campaigns_source_check';

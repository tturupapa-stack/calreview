-- 북마크 기능을 위한 applications 테이블 업데이트

-- status에 'bookmarked' 추가
ALTER TABLE public.applications
DROP CONSTRAINT IF EXISTS applications_status_check;

ALTER TABLE public.applications
ADD CONSTRAINT applications_status_check 
CHECK (status IN ('bookmarked', 'applied', 'selected', 'completed', 'cancelled'));

-- 기본값을 'bookmarked'로 변경 (선택사항)
-- ALTER TABLE public.applications ALTER COLUMN status SET DEFAULT 'bookmarked';


-- 당첨확률 기능을 위한 DB 마이그레이션
-- 실행 위치: Supabase SQL Editor

-- 1. campaigns 테이블에 확률 관련 컬럼 추가
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS recruit_count INTEGER;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS applicant_count INTEGER;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS selection_rate DECIMAL(5,2);
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS rate_updated_at TIMESTAMPTZ;

-- 컬럼 설명 추가
COMMENT ON COLUMN campaigns.recruit_count IS '모집인원';
COMMENT ON COLUMN campaigns.applicant_count IS '신청자수';
COMMENT ON COLUMN campaigns.selection_rate IS '당첨확률 (%)';
COMMENT ON COLUMN campaigns.rate_updated_at IS '확률 데이터 최종 업데이트 시간';

-- 2. 인덱스 생성 (확률 정렬용)
CREATE INDEX IF NOT EXISTS idx_campaigns_selection_rate
ON campaigns(selection_rate DESC NULLS LAST)
WHERE is_active = true;

-- 3. 확률 자동 계산 함수
CREATE OR REPLACE FUNCTION calculate_selection_rate()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.applicant_count IS NOT NULL AND NEW.applicant_count > 0
     AND NEW.recruit_count IS NOT NULL AND NEW.recruit_count > 0 THEN
    NEW.selection_rate := LEAST((NEW.recruit_count::DECIMAL / NEW.applicant_count) * 100, 100);
    NEW.rate_updated_at := NOW();
  ELSIF NEW.applicant_count = 0 AND NEW.recruit_count > 0 THEN
    NEW.selection_rate := 100;
    NEW.rate_updated_at := NOW();
  ELSE
    NEW.selection_rate := NULL;
    NEW.rate_updated_at := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. 트리거 생성 (INSERT/UPDATE 시 자동 계산)
DROP TRIGGER IF EXISTS trigger_calculate_selection_rate ON campaigns;
CREATE TRIGGER trigger_calculate_selection_rate
BEFORE INSERT OR UPDATE OF recruit_count, applicant_count ON campaigns
FOR EACH ROW
EXECUTE FUNCTION calculate_selection_rate();

-- 5. 확인 쿼리
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'campaigns'
AND column_name IN ('recruit_count', 'applicant_count', 'selection_rate', 'rate_updated_at');

-- KPI 측정 시스템 및 당첨 확인 기능을 위한 마이그레이션
-- 실행일: 2025-01-XX

-- 1. KPI 메트릭 테이블 생성
CREATE TABLE IF NOT EXISTS public.kpi_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date DATE NOT NULL UNIQUE,
    mau INTEGER NOT NULL DEFAULT 0,
    dau INTEGER NOT NULL DEFAULT 0,
    retention_rate_7d DECIMAL(5, 4) NOT NULL DEFAULT 0,
    avg_session_duration INTEGER NOT NULL DEFAULT 0,
    calendar_sync_rate DECIMAL(5, 4) NOT NULL DEFAULT 0,
    avg_bookmarks_per_user DECIMAL(10, 2) NOT NULL DEFAULT 0,
    search_to_detail_ctr DECIMAL(5, 4) NOT NULL DEFAULT 0,
    detail_to_bookmark_ctr DECIMAL(5, 4) NOT NULL DEFAULT 0,
    bookmark_to_selection_ctr DECIMAL(5, 4) NOT NULL DEFAULT 0,
    original_site_click_rate DECIMAL(5, 4) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_kpi_metrics_date ON public.kpi_metrics(date DESC);

-- 2. applications 테이블에 당첨 확인 관련 필드 추가
ALTER TABLE public.applications
ADD COLUMN IF NOT EXISTS auto_detected BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS detected_at TIMESTAMPTZ;

-- 3. users 테이블에 네이버 세션 쿠키 필드 추가 (당첨 확인용)
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS naver_session_cookies TEXT,
ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ DEFAULT NOW();

-- last_active_at 인덱스 생성 (KPI 계산 최적화)
CREATE INDEX IF NOT EXISTS idx_users_last_active_at ON public.users(last_active_at DESC);

-- 4. 리뷰 마감일 피드백 테이블 생성 (선택사항, 향후 패턴 학습용)
CREATE TABLE IF NOT EXISTS public.review_deadline_feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
    campaign_source TEXT NOT NULL,
    calculated_deadline DATE NOT NULL,
    actual_deadline DATE,
    was_correct BOOLEAN,
    user_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_review_deadline_feedback_campaign_source 
ON public.review_deadline_feedback(campaign_source);

CREATE INDEX IF NOT EXISTS idx_review_deadline_feedback_created_at 
ON public.review_deadline_feedback(created_at DESC);

-- 5. RLS 정책 설정
ALTER TABLE public.kpi_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_deadline_feedback ENABLE ROW LEVEL SECURITY;

-- KPI 메트릭은 관리자만 조회 가능
-- 기존 정책이 있으면 삭제 후 재생성
DROP POLICY IF EXISTS "KPI metrics are viewable by admins only" ON public.kpi_metrics;
CREATE POLICY "KPI metrics are viewable by admins only"
ON public.kpi_metrics FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid()
        AND users.email IN (
            SELECT unnest(string_to_array(current_setting('app.admin_emails', true), ','))
        )
    )
);

-- 리뷰 마감일 피드백은 본인 것만 조회/생성 가능
-- 기존 정책이 있으면 삭제 후 재생성
DROP POLICY IF EXISTS "Users can view their own feedback" ON public.review_deadline_feedback;
CREATE POLICY "Users can view their own feedback"
ON public.review_deadline_feedback FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.applications
        WHERE applications.id = review_deadline_feedback.application_id
        AND applications.user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Users can create their own feedback" ON public.review_deadline_feedback;
CREATE POLICY "Users can create their own feedback"
ON public.review_deadline_feedback FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.applications
        WHERE applications.id = review_deadline_feedback.application_id
        AND applications.user_id = auth.uid()
    )
);

-- 6. updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 기존 트리거가 있으면 삭제 후 재생성
DROP TRIGGER IF EXISTS update_kpi_metrics_updated_at ON public.kpi_metrics;
-- 기존 트리거가 있으면 삭제 후 재생성
DROP TRIGGER IF EXISTS update_kpi_metrics_updated_at ON public.kpi_metrics;
CREATE TRIGGER update_kpi_metrics_updated_at
BEFORE UPDATE ON public.kpi_metrics
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 7. last_active_at 업데이트 함수 (사용자 활동 시 자동 업데이트)
CREATE OR REPLACE FUNCTION update_user_last_active_at()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.users
    SET last_active_at = NOW()
    WHERE id = NEW.user_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- search_history 테이블에 트리거 추가 (사용자 검색 시 활동 업데이트)
-- search_history 테이블이 존재하는 경우에만 트리거 생성
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'search_history'
    ) THEN
        -- 기존 트리거가 있으면 삭제 후 재생성
        DROP TRIGGER IF EXISTS update_user_activity_on_search ON public.search_history;
        CREATE TRIGGER update_user_activity_on_search
        AFTER INSERT ON public.search_history
        FOR EACH ROW
        EXECUTE FUNCTION update_user_last_active_at();
    END IF;
END $$;

-- applications 테이블에 트리거 추가 (북마크/선정 시 활동 업데이트)
-- 기존 트리거가 있으면 삭제 후 재생성
DROP TRIGGER IF EXISTS update_user_activity_on_application ON public.applications;
CREATE TRIGGER update_user_activity_on_application
AFTER INSERT OR UPDATE ON public.applications
FOR EACH ROW
EXECUTE FUNCTION update_user_last_active_at();



-- 검색 기록 테이블 (스마트 서치 기능용)
CREATE TABLE IF NOT EXISTS public.search_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  parsed_region TEXT,
  parsed_category TEXT,
  parsed_deadline TEXT,
  parsed_type TEXT,
  parsed_channel TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, query, DATE(created_at)) -- 같은 날 같은 검색어는 중복 방지
);

CREATE INDEX IF NOT EXISTS search_history_user_id_idx ON public.search_history(user_id);
CREATE INDEX IF NOT EXISTS search_history_created_at_idx ON public.search_history(created_at DESC);

-- RLS 정책
ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 검색 기록만 조회 가능
CREATE POLICY "Users can view own search history"
  ON public.search_history FOR SELECT
  USING (auth.uid() = user_id);

-- 사용자는 자신의 검색 기록만 삽입 가능
CREATE POLICY "Users can insert own search history"
  ON public.search_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);


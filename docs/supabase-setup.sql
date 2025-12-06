-- Supabase 데이터베이스 초기 설정 SQL
-- Supabase Dashboard > SQL Editor에서 실행하세요

-- 1. users 테이블 생성 (auth.users와 동기화)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  name TEXT,
  avatar_url TEXT,
  provider TEXT,
  is_premium BOOLEAN DEFAULT false,
  premium_plan TEXT CHECK (premium_plan IN ('monthly', 'yearly')) DEFAULT NULL,
  premium_started_at TIMESTAMPTZ,
  premium_expires_at TIMESTAMPTZ,
  google_calendar_connected BOOLEAN DEFAULT false,
  google_refresh_token TEXT,
  notification_email BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. auth.users에서 public.users로 자동 동기화하는 함수
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, avatar_url, provider)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.app_metadata->>'provider'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. auth.users에 새 사용자가 생성될 때 트리거
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. users 테이블 업데이트 시 updated_at 자동 갱신
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON public.users;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 5. RLS (Row Level Security) 정책 설정
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 정보만 조회/수정 가능
CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- 6. campaigns 테이블 (Phase 4에서 사용)
CREATE TABLE IF NOT EXISTS public.campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  source TEXT NOT NULL CHECK (source IN ('reviewnote', 'revu', 'dinnerqueen', 'gangnam', 'reviewplace')),
  source_id TEXT NOT NULL,
  source_url TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  category TEXT,
  region TEXT,
  type TEXT CHECK (type IN ('visit', 'delivery', 'reporter')),
  channel TEXT,  -- 채널 정보 (예: "블로그", "인스타/릴스" 등)
  reward TEXT,
  reward_value INTEGER,
  capacity INTEGER,
  application_deadline TIMESTAMPTZ,
  review_deadline_days INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(source, source_id)
);

CREATE INDEX IF NOT EXISTS campaigns_source_idx ON public.campaigns(source);
CREATE INDEX IF NOT EXISTS campaigns_category_idx ON public.campaigns(category);
CREATE INDEX IF NOT EXISTS campaigns_region_idx ON public.campaigns(region);
CREATE INDEX IF NOT EXISTS campaigns_is_active_idx ON public.campaigns(is_active);

-- 7. applications 테이블 (Phase 5에서 사용)
CREATE TABLE IF NOT EXISTS public.applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('applied', 'selected', 'completed', 'cancelled')) DEFAULT 'applied',
  visit_date DATE,
  review_deadline DATE,
  calendar_visit_event_id TEXT,
  calendar_deadline_event_id TEXT,
  reminder_d3_sent BOOLEAN DEFAULT false,
  reminder_d1_sent BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, campaign_id)
);

CREATE INDEX IF NOT EXISTS applications_user_id_idx ON public.applications(user_id);
CREATE INDEX IF NOT EXISTS applications_campaign_id_idx ON public.applications(campaign_id);
CREATE INDEX IF NOT EXISTS applications_status_idx ON public.applications(status);

-- 8. payments 테이블 (Phase 6에서 사용)
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  plan TEXT NOT NULL CHECK (plan IN ('monthly', 'yearly')),
  amount INTEGER NOT NULL,
  payment_key TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'cancelled', 'refunded')) DEFAULT 'pending',
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS payments_user_id_idx ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS payments_status_idx ON public.payments(status);

-- 9. RLS 정책 (applications, payments)
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 신청/결제 정보만 조회/수정 가능
CREATE POLICY "Users can view own applications"
  ON public.applications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own applications"
  ON public.applications FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own payments"
  ON public.payments FOR SELECT
  USING (auth.uid() = user_id);

-- campaigns는 모든 인증된 사용자가 조회 가능
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Campaigns are viewable by everyone"
  ON public.campaigns FOR SELECT
  USING (true);


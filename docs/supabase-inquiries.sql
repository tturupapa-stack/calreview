-- 문의하기(inquiries) 테이블 생성
-- Supabase Dashboard > SQL Editor에서 실행하세요

CREATE TABLE IF NOT EXISTS public.inquiries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  inquiry_type TEXT NOT NULL CHECK (inquiry_type IN ('general', 'technical', 'partnership', 'program_request', 'other')),
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  attachment_url TEXT, -- 파일 URL (Supabase Storage에 저장)
  attachment_filename TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  admin_response TEXT,
  admin_response_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS inquiries_user_id_idx ON public.inquiries(user_id);
CREATE INDEX IF NOT EXISTS inquiries_inquiry_type_idx ON public.inquiries(inquiry_type);
CREATE INDEX IF NOT EXISTS inquiries_status_idx ON public.inquiries(status);
CREATE INDEX IF NOT EXISTS inquiries_created_at_idx ON public.inquiries(created_at DESC);

-- updated_at 자동 갱신 트리거
DROP TRIGGER IF EXISTS set_inquiries_updated_at ON public.inquiries;
CREATE TRIGGER set_inquiries_updated_at
  BEFORE UPDATE ON public.inquiries
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- RLS (Row Level Security) 정책 설정
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

-- 모든 사용자는 문의를 생성할 수 있음 (인증 불필요)
CREATE POLICY "Anyone can create inquiries"
  ON public.inquiries FOR INSERT
  WITH CHECK (true);

-- 사용자는 자신이 작성한 문의만 조회 가능
CREATE POLICY "Users can view own inquiries"
  ON public.inquiries FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

-- 관리자는 모든 문의 조회 가능 (service_role 사용)
-- 실제 관리자 권한은 애플리케이션 레벨에서 처리

-- 관리자가 문의를 업데이트할 수 있도록 정책 추가 (service_role 사용)
-- RLS는 애플리케이션 레벨에서 관리자 권한 체크 후 service_role로 접근

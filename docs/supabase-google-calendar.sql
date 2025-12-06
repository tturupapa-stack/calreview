-- Google Calendar 연동을 위한 users 테이블 컬럼 추가

-- google_calendar_refresh_token: Google OAuth refresh token
-- google_calendar_connected: 캘린더 연결 여부
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS google_calendar_refresh_token TEXT,
ADD COLUMN IF NOT EXISTS google_calendar_connected BOOLEAN DEFAULT false;

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS users_google_calendar_connected_idx 
ON public.users(google_calendar_connected) 
WHERE google_calendar_connected = true;


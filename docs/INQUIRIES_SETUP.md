# 문의하기 기능 설정 가이드

## 1. Supabase 데이터베이스 설정

### 1.1 문의 테이블 생성

Supabase Dashboard > SQL Editor에서 다음 SQL을 실행하세요:

```sql
-- 파일: docs/supabase-inquiries.sql 참고
```

또는 직접 실행:

```sql
CREATE TABLE IF NOT EXISTS public.inquiries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  inquiry_type TEXT NOT NULL CHECK (inquiry_type IN ('general', 'technical', 'partnership', 'program_request', 'other')),
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  attachment_url TEXT,
  attachment_filename TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  admin_response TEXT,
  admin_response_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS inquiries_user_id_idx ON public.inquiries(user_id);
CREATE INDEX IF NOT EXISTS inquiries_inquiry_type_idx ON public.inquiries(inquiry_type);
CREATE INDEX IF NOT EXISTS inquiries_status_idx ON public.inquiries(status);
CREATE INDEX IF NOT EXISTS inquiries_created_at_idx ON public.inquiries(created_at DESC);

-- RLS 정책
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create inquiries"
  ON public.inquiries FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view own inquiries"
  ON public.inquiries FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);
```

### 1.2 Storage 버킷 생성

Supabase Dashboard > Storage에서:

1. **새 버킷 생성**
   - 버킷 이름: `inquiries`
   - Public: `false` (비공개)
   - File size limit: `5MB`
   - Allowed MIME types: `image/jpeg, image/png, application/pdf`

2. **Storage 정책 설정**
   - Storage > Policies > `inquiries` 버킷
   - **업로드 정책**: 모든 사용자가 업로드 가능
   ```sql
   CREATE POLICY "Anyone can upload inquiry attachments"
   ON storage.objects FOR INSERT
   WITH CHECK (bucket_id = 'inquiries');
   ```

## 2. 기능 확인

### 2.1 문의하기 페이지
- URL: `/contact`
- Footer의 "문의하기" 링크 클릭 시 이동

### 2.2 문의 유형
- 일반 문의
- 기술 지원
- 파트너십 문의
- 프로그램 등록 요청
- 기타

### 2.3 필수 필드
- 이름
- 이메일 (유효성 검증)
- 문의 유형
- 제목 (최대 100자)
- 내용 (최소 10자)

### 2.4 선택 필드
- 전화번호
- 파일 첨부 (최대 5MB, jpg/png/pdf/hwp)

## 3. 관리자 대시보드

### 3.1 접근 방법
- URL: `/admin/inquiries`
- 관리자 이메일 설정 필요: `.env.local`에 `ADMIN_EMAILS` 추가
  ```
  ADMIN_EMAILS=admin@example.com,admin2@example.com
  ```
  ⚠️ **보안**: `NEXT_PUBLIC_` 접두사 없이 서버 사이드에서만 사용됩니다.

### 3.2 기능
- ✅ 문의 내역 조회 (전체)
- ✅ 필터링 (상태: 미처리/처리중/완료, 유형)
- ✅ 문의 상세 보기 (모달)
- ✅ 상태 변경 (미처리/처리중/완료)
- ✅ 답변 작성 및 저장
- ✅ 통계 대시보드 (전체/미처리/처리중/완료 건수)

### 3.3 보안
- 관리자 권한 체크 API (`/api/admin/check`)
- Service role을 사용한 안전한 데이터 접근
- RLS 정책으로 일반 사용자 접근 차단

## 4. 다음 단계 (향후 구현)

### 4.1 이메일 알림
- 사용자 자동 응답 이메일
- 관리자 알림 이메일
- 답변 작성 시 사용자에게 이메일 발송

### 4.2 추가 기능
- 문의 통계 및 분석 (유형별, 날짜별)
- 평균 응답 시간 계산
- CSV 내보내기

### 4.3 Slack 알림 연동
- 새 문의 발생 시 Slack 알림

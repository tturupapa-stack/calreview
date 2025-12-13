# Vercel 환경 변수 설정 가이드

## Google Calendar OAuth 환경 변수

다음 환경 변수를 Vercel에 설정해주세요:

### 1. Vercel 대시보드에서 설정

1. [Vercel Dashboard](https://vercel.com/dashboard) 접속
2. 프로젝트 선택
3. **Settings** → **Environment Variables** 클릭
4. 다음 변수들을 추가:

#### 변수 1: GOOGLE_CALENDAR_CLIENT_ID
- **Key:** `GOOGLE_CALENDAR_CLIENT_ID`
- **Value:** `1051917801304-437opdjtn7f151eq39573fqpstljboh8.apps.googleusercontent.com`
- **Environment:** Production, Preview, Development 모두 선택
- **Add** 클릭

#### 변수 2: GOOGLE_CALENDAR_CLIENT_SECRET
- **Key:** `GOOGLE_CALENDAR_CLIENT_SECRET`
- **Value:** `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`
- **Environment:** Production, Preview, Development 모두 선택
- **Mark as sensitive** 체크 (보안을 위해)
- **Add** 클릭

### 2. 재배포

환경 변수 추가 후:
1. **Deployments** 탭으로 이동
2. 최신 배포의 **"..." (점 3개)** 메뉴 클릭
3. **"Redeploy"** 선택
4. 재배포 완료 대기 (약 2-3분)

### 3. 확인

배포 완료 후:
1. 관리자 계정으로 로그인
2. 브라우저에서 접속: `https://cally.kr/api/admin/check-env`
3. 다음처럼 표시되면 성공:
   ```json
   {
     "status": "ok",
     "message": "모든 필수 환경 변수가 설정되어 있습니다."
   }
   ```

---

## 중요 사항

⚠️ **보안:**
- Client Secret은 민감한 정보입니다. 절대 공개 저장소에 커밋하지 마세요.
- Vercel 환경 변수는 서버 사이드에서만 접근 가능합니다.
- "Mark as sensitive" 옵션을 체크하면 Vercel 대시보드에서 값이 가려집니다.

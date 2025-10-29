# 🧪 Arune API 테스트 가이드

## 목차
1. [백엔드 서비스 테스트 (완료)](#1-백엔드-서비스-테스트-완료)
2. [실제 서버 API 테스트](#2-실제-서버-api-테스트)
3. [프론트엔드 통합 테스트](#3-프론트엔드-통합-테스트)
4. [문제 해결](#4-문제-해결)

---

## 1. 백엔드 서비스 테스트 (완료) ✅

### 실행 방법
```bash
cd C:/Users/newsh/test-project/eap-service/backend
node test-arune-api.js
```

### 테스트 결과
- ✅ 3가지 케이스 모두 정상 작동
- ✅ 거북이형(51-162점), 돼지형(350점) 정확히 분류
- ✅ 인생시계 계산 정상
- ✅ AI 추천사항 생성 정상

---

## 2. 실제 서버 API 테스트

### Step 1: 백엔드 서버 시작

```bash
cd C:/Users/newsh/test-project/eap-service/backend
npm start
```

서버가 정상 시작되면 다음과 같은 메시지가 표시됩니다:
```
🚀 서버가 http://localhost:5000 에서 실행 중입니다
✅ MongoDB 연결 성공
```

### Step 2: 테스트용 세션 생성

먼저 로그인하여 토큰을 받아야 합니다.

#### 2-1. 사용자 로그인 (토큰 받기)

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "직원이메일@회사.com",
    "password": "비밀번호"
  }'
```

**응답에서 token을 복사하세요:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { ... }
}
```

#### 2-2. 재무상담 세션 생성

```bash
# TOKEN 변수 설정 (위에서 받은 토큰을 넣으세요)
TOKEN="여기에_토큰_붙여넣기"

curl -X POST http://localhost:5000/api/financial-sessions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "scheduledDate": "2025-11-01T10:00:00Z",
    "duration": 60,
    "sessionType": "initial-consultation",
    "format": "video-call"
  }'
```

**응답에서 session._id를 복사하세요:**
```json
{
  "message": "재무상담 세션이 생성되었습니다.",
  "session": {
    "_id": "672123456789abcdef012345",
    ...
  }
}
```

### Step 3: Arune 설문 제출 및 분석

```bash
# SESSION_ID 변수 설정 (위에서 받은 _id를 넣으세요)
SESSION_ID="672123456789abcdef012345"

curl -X POST http://localhost:5000/api/financial-sessions/$SESSION_ID/arune-survey \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "answers": {
      "FB01-3": 3,
      "FB02-1": 2,
      "FB05-1": 2,
      "FB05-3": 2,
      "FB16-2": 3,
      "FB21-1": 1,
      "FB09-3": 4,
      "FB11-3": 2,
      "FB12-1": 5,
      "FB17-1": 1,
      "FB22-3": 3,
      "ST02-01": 3,
      "ST02-02": 2,
      "ST02-06": 3,
      "ST02-07": 3,
      "ST02-08": 2,
      "ST02-10": 3,
      "ST02-13": 2,
      "ST02-14": 3,
      "ST02-18": 3,
      "ST02-29": 3,
      "ST02-32": 2,
      "ST02-40": 3,
      "ST02-43": 2,
      "ST02-46": 2,
      "ST02-49": 3
    },
    "personalInfo": {
      "birthYear": 1990,
      "gender": "남성",
      "occupation": "회사원",
      "maritalStatus": "기혼"
    }
  }'
```

### Step 4: 분석 결과 조회

```bash
curl -X GET http://localhost:5000/api/financial-sessions/$SESSION_ID/arune-analysis \
  -H "Authorization: Bearer $TOKEN"
```

### 예상 응답

```json
{
  "surveyCompleted": true,
  "completedAt": "2025-10-29T13:07:38.000Z",
  "analysis": {
    "analysisId": "ARU-1761710858168-N4XU5I",
    "generatedAt": "2025-10-29T13:07:38.000Z",
    "scores": {
      "spending": 38,
      "saving": 43,
      "investment": 42,
      "riskManagement": 39,
      "total": 162
    },
    "animalType": "거북이형",
    "animalTypeDescription": "손실을 극도로 회피하며 안전한 투자만을 선호하는 유형입니다...",
    "lifeClock": {
      "age": 35,
      "timeString": "오전 10시 30분",
      "phase": "장년기 초반",
      "percentageComplete": 44
    },
    "recommendations": {
      "spending": [
        "지출 관리에 개선이 필요합니다",
        "3개월간 가계부를 작성하여 지출 패턴을 파악하세요",
        "불필요한 구독 서비스나 정기 결제를 점검하세요",
        "충동 구매를 줄이기 위해 24시간 규칙을 적용해보세요"
      ],
      "saving": [ ... ],
      "investment": [ ... ],
      "risk": [ ... ]
    }
  },
  "personalInfo": {
    "birthYear": 1990,
    "gender": "남성",
    "occupation": "회사원",
    "maritalStatus": "기혼"
  }
}
```

---

## 3. 프론트엔드 통합 테스트

### Step 1: 프론트엔드 서버 시작

```bash
cd C:/Users/newsh/test-project/eap-service/frontend
npm run dev
```

### Step 2: 브라우저에서 테스트

1. **로그인**
   - http://localhost:3000 (또는 5173, Vite 포트)
   - 직원 계정으로 로그인

2. **재무상담 세션 페이지 이동**
   - 대시보드 → 재무상담 메뉴
   - 기존 세션 선택 또는 새 세션 생성

3. **Arune 설문 시작 버튼 클릭**
   - 모달이 열리면서 설문 시작
   - 개인정보 입력 (출생연도, 성별)
   - 26개 질문에 답변

4. **분석 결과 확인**
   - 설문 완료 후 즉시 결과 표시
   - 인생시계, 재무 캐릭터, 4영역 점수
   - AI 추천사항 확인

### 통합 체크리스트

- [ ] 설문 모달이 정상적으로 열림
- [ ] 진행률 바가 정상 작동
- [ ] 26개 질문이 모두 표시됨
- [ ] 답변 선택 시 UI 변화 확인
- [ ] "분석 결과 확인" 버튼 클릭 시 제출
- [ ] 로딩 상태 표시
- [ ] 결과 화면 정상 표시
- [ ] 4영역 점수 차트 표시
- [ ] 인생시계 시각화
- [ ] AI 추천사항 목록 표시

---

## 4. 문제 해결

### 문제 1: "설문 제출 권한이 없습니다"

**원인**: 로그인한 사용자가 세션의 client가 아님

**해결**:
```bash
# 자신의 세션만 테스트하세요
# 또는 super-admin 계정으로 로그인
```

### 문제 2: "해당 세션을 찾을 수 없습니다"

**원인**: SESSION_ID가 잘못됨

**해결**:
```bash
# 세션 목록 조회
curl -X GET http://localhost:5000/api/financial-sessions \
  -H "Authorization: Bearer $TOKEN"

# 올바른 _id 사용
```

### 문제 3: "이미 설문이 완료되었습니다"

**원인**: 같은 세션에 중복 제출

**해결**:
```bash
# 새 세션 생성 또는
# MongoDB에서 aruneSurvey.completed를 false로 변경
```

### 문제 4: MongoDB 연결 실패

**원인**: MongoDB가 실행 중이 아니거나 연결 문자열 오류

**해결**:
```bash
# MongoDB 서비스 시작
# Windows: services.msc에서 MongoDB 시작
# macOS/Linux: sudo systemctl start mongod

# 또는 .env 파일의 MONGODB_URI 확인
```

### 문제 5: CORS 오류

**원인**: 프론트엔드와 백엔드 도메인 불일치

**해결**:
```javascript
// backend/server.js에서 CORS 설정 확인
app.use(cors({
  origin: 'http://localhost:3000', // 프론트엔드 주소
  credentials: true
}));
```

---

## 5. 빠른 테스트 스크립트

한 번에 모든 단계를 실행하는 스크립트:

### Windows (PowerShell)

```powershell
# test-arune-complete.ps1

# 1. 서비스 테스트
Write-Host "🧪 Arune 서비스 테스트 중..." -ForegroundColor Cyan
cd C:\Users\newsh\test-project\eap-service\backend
node test-arune-api.js

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ 서비스 테스트 성공!" -ForegroundColor Green
} else {
    Write-Host "❌ 서비스 테스트 실패" -ForegroundColor Red
    exit 1
}

Write-Host "`n다음 단계:" -ForegroundColor Yellow
Write-Host "1. 백엔드 서버 시작: npm start"
Write-Host "2. 위의 'Step 2' 부터 진행하세요"
```

### 실행

```powershell
cd C:\Users\newsh\test-project\eap-service
.\test-arune-complete.ps1
```

---

## 6. 성공 기준

### ✅ 모든 테스트 통과 조건

1. **서비스 로직 테스트**
   - [x] 3가지 케이스 모두 실행
   - [x] 캐릭터 유형 정확히 분류
   - [x] 점수 계산 정상
   - [x] 인생시계 계산 정상

2. **API 엔드포인트 테스트**
   - [ ] POST /arune-survey → 201 응답
   - [ ] GET /arune-analysis → 200 응답
   - [ ] 권한 체크 정상 작동

3. **프론트엔드 통합**
   - [ ] 설문 모달 정상 작동
   - [ ] 26개 질문 모두 표시
   - [ ] 결과 화면 정상 표시
   - [ ] UI/UX 이상 없음

---

## 7. 다음 단계 (Phase 2)

- [ ] B5 소책자 PDF 생성 구현
- [ ] Puppeteer 설치 및 설정
- [ ] Cloudinary/S3 파일 업로드
- [ ] PDF 다운로드 버튼 활성화

---

**작성일**: 2025-10-29
**버전**: 1.0.0
**개발자**: Claude Code

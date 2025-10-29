#!/bin/bash
# Arune API 전체 테스트 스크립트

echo "🧪 Arune API 전체 테스트 시작"
echo "============================================"

# 색상 코드
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 1️⃣ 테스트 사용자 등록
echo ""
echo -e "${BLUE}1️⃣ 테스트 사용자 등록${NC}"
echo "--------------------------------------------"

REGISTER_RESPONSE=$(curl -s -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Arune 테스트",
    "email": "arune.test@example.com",
    "password": "test1234",
    "role": "employee",
    "department": "IT팀",
    "position": "사원"
  }')

echo "$REGISTER_RESPONSE" | python -m json.tool 2>/dev/null || echo "$REGISTER_RESPONSE"

# 토큰 추출 (등록 성공 시)
TOKEN=$(echo "$REGISTER_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)

# 토큰이 없으면 로그인 시도
if [ -z "$TOKEN" ]; then
  echo ""
  echo -e "${BLUE}사용자가 이미 존재합니다. 로그인 시도...${NC}"

  LOGIN_RESPONSE=$(curl -s -X POST http://localhost:5000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{
      "email": "arune.test@example.com",
      "password": "test1234"
    }')

  echo "$LOGIN_RESPONSE" | python -m json.tool 2>/dev/null || echo "$LOGIN_RESPONSE"

  TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
fi

if [ -z "$TOKEN" ]; then
  echo -e "${RED}❌ 로그인 실패!${NC}"
  exit 1
fi

echo -e "${GREEN}✅ 로그인 성공! Token: ${TOKEN:0:20}...${NC}"

# 2️⃣ 재무상담 세션 생성
echo ""
echo -e "${BLUE}2️⃣ 재무상담 세션 생성${NC}"
echo "--------------------------------------------"

SESSION_RESPONSE=$(curl -s -X POST http://localhost:5000/api/financial-sessions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "scheduledDate": "2025-11-01T10:00:00Z",
    "duration": 60,
    "sessionType": "initial-consultation",
    "format": "video-call"
  }')

echo "$SESSION_RESPONSE" | python -m json.tool 2>/dev/null || echo "$SESSION_RESPONSE"

# 세션 ID 추출
SESSION_ID=$(echo "$SESSION_RESPONSE" | grep -o '"_id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -z "$SESSION_ID" ]; then
  echo -e "${RED}❌ 세션 생성 실패!${NC}"
  exit 1
fi

echo -e "${GREEN}✅ 세션 생성 성공! ID: $SESSION_ID${NC}"

# 3️⃣ Arune 설문 제출 및 분석
echo ""
echo -e "${BLUE}3️⃣ Arune 설문 제출 및 분석${NC}"
echo "--------------------------------------------"

SURVEY_RESPONSE=$(curl -s -X POST http://localhost:5000/api/financial-sessions/$SESSION_ID/arune-survey \
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
  }')

echo "$SURVEY_RESPONSE" | python -m json.tool 2>/dev/null || echo "$SURVEY_RESPONSE"

# 분석 ID 추출
ANALYSIS_ID=$(echo "$SURVEY_RESPONSE" | grep -o '"analysisId":"[^"]*' | cut -d'"' -f4)

if [ -z "$ANALYSIS_ID" ]; then
  echo -e "${RED}❌ 설문 제출 실패!${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Arune 분석 완료! ID: $ANALYSIS_ID${NC}"

# 4️⃣ 분석 결과 조회
echo ""
echo -e "${BLUE}4️⃣ Arune 분석 결과 조회${NC}"
echo "--------------------------------------------"

ANALYSIS_RESPONSE=$(curl -s -X GET http://localhost:5000/api/financial-sessions/$SESSION_ID/arune-analysis \
  -H "Authorization: Bearer $TOKEN")

echo "$ANALYSIS_RESPONSE" | python -m json.tool 2>/dev/null || echo "$ANALYSIS_RESPONSE"

echo ""
echo "============================================"
echo -e "${GREEN}✅ 모든 API 테스트 완료!${NC}"
echo ""
echo "요약:"
echo "  - 사용자: arune.test@example.com"
echo "  - 세션 ID: $SESSION_ID"
echo "  - 분석 ID: $ANALYSIS_ID"
echo ""
echo "다음 단계: 프론트엔드 통합 테스트"
echo "============================================"

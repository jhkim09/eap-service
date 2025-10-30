const axios = require('axios');

// 테스트 결과 저장
const results = {
  success: [],
  failed: [],
  missing: []
};

async function login(email, password) {
  try {
    const response = await axios.post('http://localhost:5000/api/auth/login', {
      email,
      password
    });
    return response.data.token;
  } catch (error) {
    console.error(`❌ 로그인 실패: ${email}`);
    return null;
  }
}

async function testAPI(description, url, token, expectedStatus = 200) {
  try {
    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (response.status === expectedStatus) {
      results.success.push(description);
      console.log(`✅ ${description}`);
      return { success: true, data: response.data };
    }
  } catch (error) {
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message;

    if (status === 404 || message.includes('Cannot GET')) {
      results.missing.push(`${description} - API 엔드포인트 없음`);
      console.log(`⚠️  ${description} - API 미구현`);
    } else if (status === 403) {
      results.failed.push(`${description} - 권한 없음`);
      console.log(`❌ ${description} - 권한 오류`);
    } else {
      results.failed.push(`${description} - ${message}`);
      console.log(`❌ ${description} - ${message}`);
    }
    return { success: false, error: message };
  }
}

async function runTests() {
  console.log('🔬 EAP 서비스 계정별 기능 테스트 시작\n');
  console.log('='.repeat(70) + '\n');

  // 1. 심리상담사 테스트
  console.log('📋 1. 심리상담사 (counselor1) 기능 테스트');
  console.log('-'.repeat(70));
  const counselorToken = await login('counselor1@test-psych.com', 'test1234');
  if (counselorToken) {
    await testAPI('심리상담 세션 목록 조회', 'http://localhost:5000/api/counseling-sessions', counselorToken);
    await testAPI('심리상담사 정산 내역 조회', 'http://localhost:5000/api/counselor-payments', counselorToken);
    await testAPI('심리상담사 대시보드 통계', 'http://localhost:5000/api/dashboard/counselor', counselorToken);
  }
  console.log();

  // 2. 재무상담사 테스트
  console.log('📋 2. 재무상담사 (advisor1) 기능 테스트');
  console.log('-'.repeat(70));
  const advisorToken = await login('advisor1@test-finance.com', 'test1234');
  if (advisorToken) {
    await testAPI('재무상담 세션 목록 조회', 'http://localhost:5000/api/financial-sessions', advisorToken);
    await testAPI('재무상담사 정산 내역 조회', 'http://localhost:5000/api/counselor-payments', advisorToken);
    await testAPI('담당 고객 재무 프로필 목록', 'http://localhost:5000/api/financial-profiles', advisorToken);
    await testAPI('재무상담사 대시보드 통계', 'http://localhost:5000/api/dashboard/advisor', advisorToken);
  }
  console.log();

  // 3. 심리상담 고객 테스트
  console.log('📋 3. 심리상담 고객 (client1) 기능 테스트');
  console.log('-'.repeat(70));
  const psychClientToken = await login('client1@test-company-it.com', 'test1234');
  if (psychClientToken) {
    const sessionResult = await testAPI('내 심리상담 세션 조회', 'http://localhost:5000/api/counseling-sessions', psychClientToken);

    // Tiro.ai 데이터 확인
    if (sessionResult.success && sessionResult.data) {
      const sessions = Array.isArray(sessionResult.data) ? sessionResult.data : sessionResult.data.sessions || [];
      const tiroSession = sessions.find(s => s.tiroData);
      if (tiroSession) {
        console.log('   ✓ Tiro.ai 상담 데이터 확인됨');
        console.log(`   ✓ GPT 분석 요약: ${tiroSession.tiroData?.gptAnalysis?.summary?.substring(0, 50) || '없음'}...`);
      } else {
        console.log('   ⚠️  Tiro.ai 데이터가 없습니다');
      }
    }

    await testAPI('고객 대시보드', 'http://localhost:5000/api/dashboard/employee', psychClientToken);
  }
  console.log();

  // 4. 재무상담 고객 테스트
  console.log('📋 4. 재무상담 고객 (fclient1) 기능 테스트');
  console.log('-'.repeat(70));
  const finClientToken = await login('fclient1@test-company-it.com', 'test1234');
  if (finClientToken) {
    const profileResult = await testAPI('내 재무 프로필 조회', 'http://localhost:5000/api/financial-profiles/me', finClientToken);

    // 재무 프로필 데이터 확인
    if (profileResult.success && profileResult.data) {
      console.log('   ✓ 재무 프로필 확인됨');
      console.log(`   ✓ 총 자산: ${profileResult.data.summary?.totalAssets || 0}원`);
      console.log(`   ✓ 재무 목표 수: ${profileResult.data.financialGoals?.length || 0}개`);
    }

    await testAPI('내 재무상담 세션 조회', 'http://localhost:5000/api/financial-sessions', finClientToken);
    await testAPI('고객 대시보드', 'http://localhost:5000/api/dashboard/employee', finClientToken);
  }
  console.log();

  // 5. Arune 설문 및 리포트 API 테스트
  console.log('📋 5. Arune 재무설문 API 테스트');
  console.log('-'.repeat(70));
  await testAPI('Arune 설문 API', 'http://localhost:5000/api/arune/survey', finClientToken);
  await testAPI('Arune 리포트 API', 'http://localhost:5000/api/arune/report', finClientToken);
  console.log();

  // 결과 요약
  console.log('\n' + '='.repeat(70));
  console.log('📊 테스트 결과 요약\n');
  console.log(`✅ 정상 작동: ${results.success.length}개`);
  console.log(`❌ 오류 발생: ${results.failed.length}개`);
  console.log(`⚠️  미구현: ${results.missing.length}개`);
  console.log('='.repeat(70));

  if (results.missing.length > 0) {
    console.log('\n🔧 구현 필요 API 목록:');
    results.missing.forEach((item, idx) => {
      console.log(`   ${idx + 1}. ${item}`);
    });
  }

  if (results.failed.length > 0) {
    console.log('\n⚠️  오류가 발생한 기능:');
    results.failed.forEach((item, idx) => {
      console.log(`   ${idx + 1}. ${item}`);
    });
  }

  console.log('\n='.repeat(70));
}

runTests().catch(console.error);

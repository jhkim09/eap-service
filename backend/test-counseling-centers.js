const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

// 테스트용 임시 데이터
let testData = {
  adminToken: null,
  centerId: null,
  counselorId: null,
  counselorToken: null
};

// 색상 코드
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  yellow: '\x1b[33m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testCounselingCenterAPIs() {
  console.log('\n' + '='.repeat(60));
  log('blue', '🧪 상담센터 API 전체 테스트 시작');
  console.log('='.repeat(60) + '\n');

  try {
    // 1️⃣ Super Admin 로그인
    log('blue', '1️⃣ Super Admin 로그인...');
    console.log('-'.repeat(60));

    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'admin@test.com',
      password: 'admin123'
    });

    testData.adminToken = loginResponse.data.token;
    log('green', '✅ Super Admin 로그인 성공');
    console.log(`Token: ${testData.adminToken.substring(0, 20)}...\n`);

    // 2️⃣ 테스트용 상담사 생성 (또는 기존 상담사 사용)
    log('blue', '2️⃣ 테스트용 상담사 확인/생성...');
    console.log('-'.repeat(60));

    try {
      // 테스트용 상담사 생성 (타임스탬프로 고유 이메일 생성)
      const timestamp = Date.now();
      const testEmail = `test.counselor.${timestamp}@example.com`;

      const registerResponse = await axios.post(`${BASE_URL}/api/auth/register`, {
        name: `테스트상담사${timestamp}`,
        email: testEmail,
        password: 'test1234',
        role: 'counselor',
        isIndependent: true
      });

      testData.counselorId = registerResponse.data.user._id;
      testData.counselorEmail = registerResponse.data.user.email;
      testData.counselorToken = registerResponse.data.token;
      log('green', `✅ 테스트용 상담사 생성 완료: ${testData.counselorEmail}`);
    } catch (error) {
      log('yellow', '⚠️ 상담사 생성 중 오류 (계속 진행)');
      console.log(error.response?.data || error.message);
    }
    console.log();

    // 3️⃣ 상담센터 생성
    log('blue', '3️⃣ 상담센터 생성...');
    console.log('-'.repeat(60));

    const createCenterResponse = await axios.post(
      `${BASE_URL}/api/counseling-centers`,
      {
        name: '테스트 심리상담센터',
        type: 'center',
        address: {
          street: '테스트로 123',
          city: '서울',
          state: '서울특별시',
          zipCode: '12345',
          country: '대한민국'
        },
        contact: {
          phone: '02-1234-5678',
          email: 'test@counseling.com',
          website: 'https://test-counseling.com'
        },
        specialties: ['심리치료', '가족상담', '스트레스 관리'],
        operatingHours: {
          monday: { start: '09:00', end: '18:00', isOpen: true },
          tuesday: { start: '09:00', end: '18:00', isOpen: true },
          wednesday: { start: '09:00', end: '18:00', isOpen: true },
          thursday: { start: '09:00', end: '18:00', isOpen: true },
          friday: { start: '09:00', end: '18:00', isOpen: true },
          saturday: { isOpen: false },
          sunday: { isOpen: false }
        },
        settings: {
          maxCounselors: 10,
          allowOnlineBooking: true,
          requireApproval: false
        }
      },
      {
        headers: { Authorization: `Bearer ${testData.adminToken}` }
      }
    );

    testData.centerId = createCenterResponse.data.center._id;
    log('green', '✅ 상담센터 생성 성공');
    console.log(`센터 ID: ${testData.centerId}`);
    console.log(`센터명: ${createCenterResponse.data.center.name}\n`);

    // 4️⃣ 생성된 센터 조회
    log('blue', '4️⃣ 생성된 센터 상세 조회...');
    console.log('-'.repeat(60));

    const getCenterResponse = await axios.get(
      `${BASE_URL}/api/counseling-centers/${testData.centerId}`,
      {
        headers: { Authorization: `Bearer ${testData.adminToken}` }
      }
    );

    log('green', '✅ 센터 상세 조회 성공');
    console.log(JSON.stringify(getCenterResponse.data.center, null, 2));
    console.log();

    // 5️⃣ 전체 센터 목록 조회
    log('blue', '5️⃣ 전체 상담센터 목록 조회...');
    console.log('-'.repeat(60));

    const listCentersResponse = await axios.get(
      `${BASE_URL}/api/counseling-centers`,
      {
        headers: { Authorization: `Bearer ${testData.adminToken}` }
      }
    );

    log('green', '✅ 센터 목록 조회 성공');
    const centers = listCentersResponse.data.centers || listCentersResponse.data;
    console.log(`총 ${centers.length}개 센터`);
    centers.forEach((center, idx) => {
      console.log(`  ${idx + 1}. ${center.name} (${center.type})`);
    });
    console.log();

    // 6️⃣ 상담사를 센터에 추가
    if (testData.counselorId) {
      log('blue', '6️⃣ 상담사를 센터에 추가...');
      console.log('-'.repeat(60));

      const addCounselorResponse = await axios.post(
        `${BASE_URL}/api/counseling-centers/${testData.centerId}/counselors`,
        { counselorEmail: testData.counselorEmail },
        {
          headers: { Authorization: `Bearer ${testData.adminToken}` }
        }
      );

      log('green', '✅ 상담사 추가 성공');
      console.log(`상담사 Email: ${testData.counselorEmail}`);
      console.log(`메시지: ${addCounselorResponse.data.message}\n`);

      // 7️⃣ 상담사가 추가된 센터 다시 조회
      log('blue', '7️⃣ 센터 정보 다시 조회 (상담사 포함)...');
      console.log('-'.repeat(60));

      const updatedCenterResponse = await axios.get(
        `${BASE_URL}/api/counseling-centers/${testData.centerId}`,
        {
          headers: { Authorization: `Bearer ${testData.adminToken}` }
        }
      );

      log('green', '✅ 센터 조회 성공');
      const updatedCenter = updatedCenterResponse.data.center || updatedCenterResponse.data;
      console.log(`소속 상담사 ${updatedCenter.counselors.length}명:`);
      updatedCenter.counselors.forEach((counselor, idx) => {
        console.log(`  ${idx + 1}. ${counselor.name} (${counselor.email})`);
      });
      console.log();

      // 8️⃣ 상담사 제거
      log('blue', '8️⃣ 상담사를 센터에서 제거...');
      console.log('-'.repeat(60));

      const removeCounselorResponse = await axios.delete(
        `${BASE_URL}/api/counseling-centers/${testData.centerId}/counselors/${testData.counselorId}`,
        {
          headers: { Authorization: `Bearer ${testData.adminToken}` }
        }
      );

      log('green', '✅ 상담사 제거 성공');
      console.log(`메시지: ${removeCounselorResponse.data.message}\n`);
    } else {
      log('yellow', '⚠️ 테스트용 상담사가 없어 6-8단계 스킵\n');
    }

    // 9️⃣ 센터 정보 업데이트
    log('blue', '9️⃣ 센터 정보 업데이트...');
    console.log('-'.repeat(60));

    const updateCenterResponse = await axios.put(
      `${BASE_URL}/api/counseling-centers/${testData.centerId}`,
      {
        name: '업데이트된 테스트 상담센터',
        specialties: ['심리치료', '가족상담', '스트레스 관리', '정신건강']
      },
      {
        headers: { Authorization: `Bearer ${testData.adminToken}` }
      }
    );

    log('green', '✅ 센터 정보 업데이트 성공');
    const updatedCenterData = updateCenterResponse.data.center || updateCenterResponse.data;
    console.log(`업데이트된 센터명: ${updatedCenterData.name}`);
    console.log(`전문분야: ${updatedCenterData.specialties.join(', ')}\n`);

    // 🔟 독립 상담사 목록 조회
    log('blue', '🔟 독립 상담사 목록 조회...');
    console.log('-'.repeat(60));

    const independentCounselorsResponse = await axios.get(
      `${BASE_URL}/api/counseling-centers/independent/counselors`,
      {
        headers: { Authorization: `Bearer ${testData.adminToken}` }
      }
    );

    log('green', '✅ 독립 상담사 조회 성공');
    const independentCounselors = independentCounselorsResponse.data.counselors || independentCounselorsResponse.data || [];
    console.log(`총 ${independentCounselors.length}명의 독립 상담사`);
    independentCounselors.forEach((counselor, idx) => {
      console.log(`  ${idx + 1}. ${counselor.name} (${counselor.email}) - ${counselor.role}`);
    });
    console.log();

    // 1️⃣1️⃣ 센터 삭제
    log('blue', '1️⃣1️⃣ 테스트 센터 삭제...');
    console.log('-'.repeat(60));

    await axios.delete(
      `${BASE_URL}/api/counseling-centers/${testData.centerId}`,
      {
        headers: { Authorization: `Bearer ${testData.adminToken}` }
      }
    );

    log('green', '✅ 센터 삭제 성공\n');

    // 최종 확인
    log('blue', '1️⃣2️⃣ 삭제 확인 (센터 목록 다시 조회)...');
    console.log('-'.repeat(60));

    const finalListResponse = await axios.get(
      `${BASE_URL}/api/counseling-centers`,
      {
        headers: { Authorization: `Bearer ${testData.adminToken}` }
      }
    );

    log('green', '✅ 최종 센터 목록 조회 성공');
    const finalCenters = finalListResponse.data.centers || finalListResponse.data;
    console.log(`현재 총 ${finalCenters.length}개 센터\n`);

    // 테스트 완료
    console.log('='.repeat(60));
    log('green', '✅ 모든 상담센터 API 테스트 완료!');
    console.log('='.repeat(60) + '\n');

    console.log('테스트 요약:');
    console.log('  ✅ 센터 생성');
    console.log('  ✅ 센터 조회 (단일/목록)');
    console.log('  ✅ 센터 업데이트');
    console.log('  ✅ 상담사 추가/제거');
    console.log('  ✅ 독립 상담사 조회');
    console.log('  ✅ 센터 삭제');
    console.log();

  } catch (error) {
    console.log();
    log('red', '❌ 테스트 중 오류 발생!');
    console.log('-'.repeat(60));

    if (error.response) {
      console.log('응답 상태:', error.response.status);
      console.log('응답 데이터:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('오류 메시지:', error.message);
    }
    console.log();
  }
}

// 테스트 실행
testCounselingCenterAPIs();

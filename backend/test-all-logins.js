const axios = require('axios');

const accounts = [
  { email: 'counselor1@test-psych.com', name: '김심리', type: '심리상담사' },
  { email: 'counselor2@test-psych.com', name: '이상담', type: '심리상담사' },
  { email: 'advisor1@test-finance.com', name: '박재무', type: '재무상담사' },
  { email: 'advisor2@test-finance.com', name: '최자산', type: '재무상담사' },
  { email: 'client1@test-company-it.com', name: '정직원', type: '심리상담 고객' },
  { email: 'client2@test-company-mfg.com', name: '한사원', type: '심리상담 고객' },
  { email: 'fclient1@test-company-it.com', name: '강부자', type: '재무상담 고객' },
  { email: 'fclient2@test-company-mfg.com', name: '오투자', type: '재무상담 고객' }
];

async function testAllLogins() {
  console.log('🔐 8개 테스트 계정 로그인 검증 시작...\n');

  let successCount = 0;
  let failCount = 0;

  for (const account of accounts) {
    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        email: account.email,
        password: 'test1234'
      });

      if (response.data.token && response.data.user) {
        console.log(`✅ ${account.type} - ${account.name} (${account.email})`);
        console.log(`   Role: ${response.data.user.role}, ID: ${response.data.user.id}`);
        successCount++;
      }
    } catch (error) {
      console.log(`❌ ${account.type} - ${account.name} (${account.email})`);
      console.log(`   Error: ${error.response?.data?.message || error.message}`);
      failCount++;
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`✅ 성공: ${successCount}/8`);
  console.log(`❌ 실패: ${failCount}/8`);
  console.log('='.repeat(60));
}

testAllLogins().catch(console.error);

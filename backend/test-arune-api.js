// Arune API 테스트 스크립트
// Node.js로 직접 실행하여 Arune 서비스 로직을 테스트합니다.

const AruneService = require('./services/arune/arune-service');

console.log('🧪 Arune 재무분석 서비스 테스트 시작\n');
console.log('='.repeat(60));

// 테스트 데이터 1: 균형적 투자자 (사자형 예상)
const testData1 = {
  answers: {
    // FB 질문 (11개)
    'FB01-3': 3, // 투자 민감도 - 수수료
    'FB02-1': 2, // 보험 보장 - 실손의료
    'FB05-1': 2, // 수익률 기대치 - 중간
    'FB05-3': 2, // 투자수단 - 펀드/ELS
    'FB16-2': 3, // 투자손실 대응 - 보유
    'FB21-1': 1, // 보험 vs 저축 - 보험
    'FB09-3': 4, // 정보 습득 - 인터넷
    'FB11-3': 2, // 보험료 수준 - 적당
    'FB12-1': 5, // 보험 선택 기준 - 보장내용
    'FB17-1': 1, // 질환 인지 - 없다
    'FB22-3': 3, // 투자 선호도 - 중위험 중수익

    // ST02 질문 (15개)
    'ST02-01': 3, // 소득 내 지출 - 그렇다
    'ST02-02': 2, // 저축 vs 투자 - 그렇지 않다
    'ST02-06': 3, // 상여금 활용 - 그렇다
    'ST02-07': 3, // 교육비 우선 - 그렇다
    'ST02-08': 2, // 여행비 절약 - 그렇지 않다
    'ST02-10': 3, // 정기저축 - 그렇다
    'ST02-13': 2, // 가계부 - 그렇지 않다
    'ST02-14': 3, // 은퇴준비 - 그렇다
    'ST02-18': 3, // 재무상황 인지 - 그렇다
    'ST02-29': 3, // 금융회사 수 - 그렇다
    'ST02-32': 2, // 소비 계획 - 그렇지 않다
    'ST02-40': 3, // 퇴직연금 - 그렇다
    'ST02-43': 2, // 투자 지식 - 그렇지 않다
    'ST02-46': 2, // 위험 감수 - 그렇지 않다
    'ST02-49': 3  // 재무 목표 - 그렇다
  },
  personalInfo: {
    birthYear: 1990,
    gender: '남성',
    occupation: '회사원',
    maritalStatus: '기혼'
  }
};

// 테스트 데이터 2: 보수적 투자자 (양형/거북이형 예상)
const testData2 = {
  answers: {
    'FB01-3': 1, 'FB02-1': 1, 'FB05-1': 1, 'FB05-3': 1, 'FB16-2': 1,
    'FB21-1': 1, 'FB09-3': 1, 'FB11-3': 3, 'FB12-1': 1, 'FB17-1': 1,
    'FB22-3': 1, 'ST02-01': 2, 'ST02-02': 1, 'ST02-06': 2, 'ST02-07': 2,
    'ST02-08': 2, 'ST02-10': 2, 'ST02-13': 1, 'ST02-14': 2, 'ST02-18': 2,
    'ST02-29': 2, 'ST02-32': 2, 'ST02-40': 2, 'ST02-43': 1, 'ST02-46': 1,
    'ST02-49': 2
  },
  personalInfo: {
    birthYear: 1995,
    gender: '여성',
    occupation: '공무원',
    maritalStatus: '미혼'
  }
};

// 테스트 데이터 3: 공격적 투자자 (돼지형/황소형 예상)
const testData3 = {
  answers: {
    'FB01-3': 5, 'FB02-1': 4, 'FB05-1': 4, 'FB05-3': 5, 'FB16-2': 4,
    'FB21-1': 2, 'FB09-3': 5, 'FB11-3': 5, 'FB12-1': 5, 'FB17-1': 5,
    'FB22-3': 5, 'ST02-01': 4, 'ST02-02': 4, 'ST02-06': 4, 'ST02-07': 4,
    'ST02-08': 4, 'ST02-10': 4, 'ST02-13': 4, 'ST02-14': 4, 'ST02-18': 4,
    'ST02-29': 4, 'ST02-32': 4, 'ST02-40': 4, 'ST02-43': 4, 'ST02-46': 4,
    'ST02-49': 4
  },
  personalInfo: {
    birthYear: 1985,
    gender: '남성',
    occupation: '사업가',
    maritalStatus: '기혼'
  }
};

// Arune 서비스 인스턴스 생성
const aruneService = new AruneService();

// 테스트 실행 함수
function runTest(testName, testData) {
  console.log(`\n📊 ${testName}`);
  console.log('-'.repeat(60));

  try {
    const result = aruneService.analyzeFinancialProfile(testData);

    console.log(`\n✅ 분석 ID: ${result.analysisId}`);
    console.log(`📅 생성 시간: ${result.generatedAt.toLocaleString('ko-KR')}`);

    console.log('\n📈 4영역 점수:');
    console.log(`   지출 관리: ${result.scores.spending}점`);
    console.log(`   저축 습관: ${result.scores.saving}점`);
    console.log(`   투자 성향: ${result.scores.investment}점`);
    console.log(`   위험 관리: ${result.scores.riskManagement}점`);
    console.log(`   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`   총점: ${result.scores.total}점 / 400점`);

    console.log(`\n🐾 재무 캐릭터: ${result.animalType}`);
    console.log(`   ${result.animalTypeDescription}`);

    console.log(`\n🕐 인생시계:`);
    console.log(`   현재 나이: ${result.lifeClock.age}세`);
    console.log(`   인생 시간: ${result.lifeClock.timeString}`);
    console.log(`   인생 단계: ${result.lifeClock.phase}`);
    console.log(`   진행률: ${result.lifeClock.percentageComplete}%`);

    console.log(`\n💡 AI 추천사항 (일부):`);
    console.log(`   [지출] ${result.recommendations.spending[0]}`);
    console.log(`   [저축] ${result.recommendations.saving[0]}`);
    console.log(`   [투자] ${result.recommendations.investment[0]}`);
    console.log(`   [위험] ${result.recommendations.risk[0]}`);

    return result;
  } catch (error) {
    console.error(`\n❌ 오류 발생:`, error.message);
    console.error(error.stack);
    return null;
  }
}

// 모든 테스트 실행
console.log('\n\n🎯 테스트 케이스 1: 균형적 투자자');
const result1 = runTest('케이스 1 - 균형적 투자 성향 (35세 기혼 남성)', testData1);

console.log('\n\n🎯 테스트 케이스 2: 보수적 투자자');
const result2 = runTest('케이스 2 - 보수적 투자 성향 (30세 미혼 여성)', testData2);

console.log('\n\n🎯 테스트 케이스 3: 공격적 투자자');
const result3 = runTest('케이스 3 - 공격적 투자 성향 (40세 기혼 남성)', testData3);

// 결과 비교
console.log('\n\n' + '='.repeat(60));
console.log('📊 테스트 결과 비교');
console.log('='.repeat(60));

if (result1 && result2 && result3) {
  console.log(`\n캐릭터 유형:`);
  console.log(`  케이스 1 (균형): ${result1.animalType} (${result1.scores.total}점)`);
  console.log(`  케이스 2 (보수): ${result2.animalType} (${result2.scores.total}점)`);
  console.log(`  케이스 3 (공격): ${result3.animalType} (${result3.scores.total}점)`);

  console.log(`\n투자 성향 점수 비교:`);
  console.log(`  케이스 1: ${result1.scores.investment}점`);
  console.log(`  케이스 2: ${result2.scores.investment}점`);
  console.log(`  케이스 3: ${result3.scores.investment}점`);

  console.log('\n✅ 모든 테스트가 성공적으로 완료되었습니다!');
  console.log('\n다음 단계:');
  console.log('  1. 백엔드 서버 시작: npm start');
  console.log('  2. API 엔드포인트 테스트: node test-arune-api-endpoints.js');
  console.log('  3. 프론트엔드 통합 확인');
} else {
  console.log('\n❌ 일부 테스트가 실패했습니다.');
  process.exit(1);
}

console.log('\n' + '='.repeat(60));

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// 모델 임포트
const User = require('./models/User');
const Company = require('./models/Company');
const CounselingCenter = require('./models/CounselingCenter');
const CounselingSession = require('./models/CounselingSession');
const FinancialProfile = require('./models/FinancialProfile');
const FinancialSession = require('./models/FinancialSession');

// MongoDB 연결
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/eap-service', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function createTestData() {
  try {
    console.log('🚀 테스트 데이터 생성 시작...\n');

    // 기존 테스트 데이터 삭제
    console.log('🗑️  기존 테스트 데이터 삭제 중...');
    await User.deleteMany({ email: { $regex: '@test-' } });
    await Company.deleteMany({ $or: [{ domain: { $regex: 'test-company' } }, { businessRegistrationNumber: { $in: ['123-45-67890', '234-56-78901'] } }] });
    await CounselingCenter.deleteMany({ name: { $regex: '테스트' } });
    await CounselingSession.deleteMany({ counselor: { $exists: false } }); // orphaned sessions
    await FinancialSession.deleteMany({ advisor: { $exists: false } }); // orphaned sessions
    await FinancialProfile.deleteMany({ user: { $exists: false } }); // orphaned profiles
    console.log('✅ 기존 테스트 데이터 삭제 완료\n');

    // 1. 고객 회사 2개 생성
    console.log('🏢 고객 회사 생성 중...');
    const companies = await Company.create([
      {
        name: '테스트 IT 기업',
        domain: 'test-company-it',
        industry: 'IT/소프트웨어',
        businessRegistrationNumber: '123-45-67890',
        address: '서울시 강남구 테헤란로 123',
        phone: '02-1234-5678',
        email: 'contact@test-company-it.com',
        plan: 'premium',
        balance: 10000000,
        totalSessionsUsed: 0,
        isActive: true
      },
      {
        name: '테스트 제조 기업',
        domain: 'test-company-mfg',
        industry: '제조업',
        businessRegistrationNumber: '234-56-78901',
        address: '경기도 성남시 분당구 판교로 456',
        phone: '031-9876-5432',
        email: 'contact@test-company-mfg.com',
        plan: 'standard',
        balance: 5000000,
        totalSessionsUsed: 0,
        isActive: true
      }
    ]);
    console.log(`✅ 회사 ${companies.length}개 생성 완료`);
    companies.forEach(c => console.log(`   - ${c.name} (${c.domain})`));
    console.log();

    // 2. 심리상담센터 2개 생성
    console.log('🏥 심리상담센터 생성 중...');
    const psychCenters = await CounselingCenter.create([
      {
        name: '테스트 마음건강센터',
        type: 'center',
        description: '직장인 심리상담 전문센터',
        specialties: ['스트레스 관리', '직장 내 갈등', '심리치료', '정신건강'],
        contact: {
          phone: '02-111-2222',
          email: 'info@psych-center1.com',
          website: 'https://psych-center1.com'
        },
        address: {
          street: '테스트로 100',
          city: '서울',
          state: '강남구',
          zipCode: '06000',
          country: '대한민국'
        },
        operatingHours: {
          monday: { start: '09:00', end: '18:00', isOpen: true },
          tuesday: { start: '09:00', end: '18:00', isOpen: true },
          wednesday: { start: '09:00', end: '18:00', isOpen: true },
          thursday: { start: '09:00', end: '18:00', isOpen: true },
          friday: { start: '09:00', end: '18:00', isOpen: true },
          saturday: { start: '10:00', end: '14:00', isOpen: true },
          sunday: { start: '', end: '', isOpen: false }
        },
        isActive: true
      },
      {
        name: '테스트 힐링상담센터',
        type: 'center',
        description: '기업 EAP 심리상담 전문',
        specialties: ['워라밸', '업무 효율성', '가족상담', '진로 상담'],
        contact: {
          phone: '02-333-4444',
          email: 'info@healing-center.com',
          website: 'https://healing-center.com'
        },
        address: {
          street: '힐링로 200',
          city: '서울',
          state: '서초구',
          zipCode: '06500',
          country: '대한민국'
        },
        operatingHours: {
          monday: { start: '10:00', end: '19:00', isOpen: true },
          tuesday: { start: '10:00', end: '19:00', isOpen: true },
          wednesday: { start: '10:00', end: '19:00', isOpen: true },
          thursday: { start: '10:00', end: '19:00', isOpen: true },
          friday: { start: '10:00', end: '19:00', isOpen: true },
          saturday: { start: '', end: '', isOpen: false },
          sunday: { start: '', end: '', isOpen: false }
        },
        isActive: true
      }
    ]);
    console.log(`✅ 심리상담센터 ${psychCenters.length}개 생성 완료`);
    psychCenters.forEach(c => console.log(`   - ${c.name}`));
    console.log();

    // 3. 재무상담센터 2개 생성
    console.log('💰 재무상담센터 생성 중...');
    const financialCenters = await CounselingCenter.create([
      {
        name: '테스트 재무설계센터',
        type: 'center',
        description: '직장인 재무상담 전문센터',
        specialties: ['재무상담', '법률상담'],
        contact: {
          phone: '02-555-6666',
          email: 'info@financial-center1.com',
          website: 'https://financial-center1.com'
        },
        address: {
          street: '재무로 300',
          city: '서울',
          state: '영등포구',
          zipCode: '07000',
          country: '대한민국'
        },
        operatingHours: {
          monday: { start: '09:00', end: '18:00', isOpen: true },
          tuesday: { start: '09:00', end: '18:00', isOpen: true },
          wednesday: { start: '09:00', end: '18:00', isOpen: true },
          thursday: { start: '09:00', end: '18:00', isOpen: true },
          friday: { start: '09:00', end: '18:00', isOpen: true },
          saturday: { start: '', end: '', isOpen: false },
          sunday: { start: '', end: '', isOpen: false }
        },
        isActive: true
      },
      {
        name: '테스트 자산관리센터',
        type: 'center',
        description: '기업 임직원 재무컨설팅',
        specialties: ['재무상담'],
        contact: {
          phone: '02-777-8888',
          email: 'info@wealth-center.com',
          website: 'https://wealth-center.com'
        },
        address: {
          street: '자산로 400',
          city: '서울',
          state: '마포구',
          zipCode: '04000',
          country: '대한민국'
        },
        operatingHours: {
          monday: { start: '10:00', end: '19:00', isOpen: true },
          tuesday: { start: '10:00', end: '19:00', isOpen: true },
          wednesday: { start: '10:00', end: '19:00', isOpen: true },
          thursday: { start: '10:00', end: '19:00', isOpen: true },
          friday: { start: '10:00', end: '19:00', isOpen: true },
          saturday: { start: '10:00', end: '14:00', isOpen: true },
          sunday: { start: '', end: '', isOpen: false }
        },
        isActive: true
      }
    ]);
    console.log(`✅ 재무상담센터 ${financialCenters.length}개 생성 완료`);
    financialCenters.forEach(c => console.log(`   - ${c.name}`));
    console.log();

    // 4. 심리상담사 2명 생성
    console.log('👨‍⚕️ 심리상담사 생성 중...');
    // Note: User 모델의 pre-save 훅이 자동으로 비밀번호를 해싱하므로 평문 사용

    const psychCounselors = await User.create([
      {
        email: 'counselor1@test-psych.com',
        password: 'test1234',
        name: '김심리',
        role: 'counselor',
        phone: '010-1111-2222',
        counselingCenter: psychCenters[0]._id,
        isIndependent: false,
        customRate: 80000,
        useSystemRate: true,
        taxRate: 3.3,
        experience: 5,
        specialties: ['스트레스 관리', '직장 내 갈등', '심리치료'],
        isActive: true
      },
      {
        email: 'counselor2@test-psych.com',
        password: 'test1234',
        name: '이상담',
        role: 'counselor',
        phone: '010-3333-4444',
        counselingCenter: psychCenters[1]._id,
        isIndependent: false,
        customRate: 90000,
        useSystemRate: true,
        taxRate: 3.3,
        experience: 8,
        specialties: ['워라밸', '업무 효율성', '가족상담'],
        isActive: true
      }
    ]);
    console.log(`✅ 심리상담사 ${psychCounselors.length}명 생성 완료`);
    psychCounselors.forEach(c => console.log(`   - ${c.name} (${c.email})`));
    console.log();

    // 센터에 상담사 연결
    await CounselingCenter.findByIdAndUpdate(psychCenters[0]._id, {
      $push: { counselors: psychCounselors[0]._id }
    });
    await CounselingCenter.findByIdAndUpdate(psychCenters[1]._id, {
      $push: { counselors: psychCounselors[1]._id }
    });

    // 5. 재무상담사 2명 생성
    console.log('💼 재무상담사 생성 중...');
    const financialAdvisors = await User.create([
      {
        email: 'advisor1@test-finance.com',
        password: 'test1234',
        name: '박재무',
        role: 'financial-advisor',
        phone: '010-5555-6666',
        counselingCenter: financialCenters[0]._id,
        isIndependent: false,
        customRate: 100000,
        useSystemRate: true,
        taxRate: 3.3,
        experience: 7,
        specialties: ['재무상담', '법률상담'],
        isActive: true
      },
      {
        email: 'advisor2@test-finance.com',
        password: 'test1234',
        name: '최자산',
        role: 'financial-advisor',
        phone: '010-7777-8888',
        counselingCenter: financialCenters[1]._id,
        isIndependent: false,
        customRate: 120000,
        useSystemRate: true,
        taxRate: 3.3,
        experience: 10,
        specialties: ['재무상담'],
        isActive: true
      }
    ]);
    console.log(`✅ 재무상담사 ${financialAdvisors.length}명 생성 완료`);
    financialAdvisors.forEach(a => console.log(`   - ${a.name} (${a.email})`));
    console.log();

    // 센터에 재무상담사 연결
    await CounselingCenter.findByIdAndUpdate(financialCenters[0]._id, {
      $push: { counselors: financialAdvisors[0]._id }
    });
    await CounselingCenter.findByIdAndUpdate(financialCenters[1]._id, {
      $push: { counselors: financialAdvisors[1]._id }
    });

    // 6. 심리상담 데이터가 있는 고객 2명 생성
    console.log('👤 심리상담 고객 생성 중...');
    const psychClients = await User.create([
      {
        email: 'client1@test-company-it.com',
        password: 'test1234',
        name: '정직원',
        role: 'employee',
        department: '개발팀',
        employeeId: 'EMP-IT-001',
        company: companies[0]._id,
        isActive: true
      },
      {
        email: 'client2@test-company-mfg.com',
        password: 'test1234',
        name: '한사원',
        role: 'employee',
        department: '생산팀',
        employeeId: 'EMP-MFG-001',
        company: companies[1]._id,
        isActive: true
      }
    ]);
    console.log(`✅ 심리상담 고객 ${psychClients.length}명 생성 완료`);
    psychClients.forEach(c => console.log(`   - ${c.name} (${c.email})`));
    console.log();

    // 심리상담 세션 생성
    console.log('📝 심리상담 세션 생성 중...');
    const psychSessions = await CounselingSession.create([
      {
        employee: psychClients[0]._id,
        counselor: psychCounselors[0]._id,
        company: companies[0]._id,
        appointmentDate: new Date('2024-12-15'),
        topic: '업무 스트레스 관리',
        counselingMethod: 'faceToFace',
        duration: 60,
        status: 'completed',
        counselorRate: 80000,
        isPaidToCounselor: false,
        counselingRecord: {
          summary: '고객은 최근 프로젝트 마감으로 인한 스트레스를 호소함. 업무량 조절 및 시간 관리 기법에 대해 상담함.',
          recommendations: '주 1회 명상 및 규칙적인 운동 권장. 업무 우선순위 설정 연습 필요.',
          followUpNeeded: true,
          nextSessionDate: new Date('2024-12-22')
        },
        tiroData: {
          callId: 'TIRO-TEST-001',
          callTimestamp: new Date('2024-12-15T14:00:00'),
          transcript: '상담사: 안녕하세요. 오늘 무엇을 도와드릴까요?\n고객: 최근 업무가 너무 많아서 스트레스가 심합니다...',
          callDuration: 3600,
          customerPhone: '010-1111-2222',
          gptAnalysis: {
            summary: '직장 내 과중한 업무로 인한 스트레스 호소. 시간 관리 및 우선순위 설정 필요.',
            consultationType: '스트레스 관리',
            mainIssues: ['업무 과부하', '시간 관리 어려움', '불안감'],
            emotionalState: '불안',
            actionItems: [
              { task: '주 1회 명상 실천', priority: 'high' },
              { task: '업무 우선순위 목록 작성', priority: 'high' },
              { task: '규칙적인 운동 시작', priority: 'medium' }
            ],
            tags: ['스트레스', '업무', '시간관리'],
            analyzedAt: new Date('2024-12-15T15:00:00')
          }
        }
      },
      {
        employee: psychClients[1]._id,
        counselor: psychCounselors[1]._id,
        company: companies[1]._id,
        appointmentDate: new Date('2024-12-16'),
        topic: '직장 내 인간관계 고민',
        counselingMethod: 'phoneVideo',
        duration: 50,
        status: 'completed',
        counselorRate: 90000,
        isPaidToCounselor: false,
        counselingRecord: {
          summary: '상사와의 커뮤니케이션 문제로 어려움을 겪고 있음. 효과적인 의사소통 방법에 대해 논의함.',
          recommendations: '상황별 대화 스크립트 준비. 적극적 경청 연습.',
          followUpNeeded: true,
          nextSessionDate: new Date('2024-12-23')
        }
      }
    ]);
    console.log(`✅ 심리상담 세션 ${psychSessions.length}건 생성 완료\n`);

    // 7. 재무상담 데이터가 있는 고객 2명 생성
    console.log('💵 재무상담 고객 생성 중...');
    const financialClients = await User.create([
      {
        email: 'fclient1@test-company-it.com',
        password: 'test1234',
        name: '강부자',
        role: 'employee',
        department: '마케팅팀',
        employeeId: 'EMP-IT-002',
        company: companies[0]._id,
        isActive: true
      },
      {
        email: 'fclient2@test-company-mfg.com',
        password: 'test1234',
        name: '오투자',
        role: 'employee',
        department: '관리팀',
        employeeId: 'EMP-MFG-002',
        company: companies[1]._id,
        isActive: true
      }
    ]);
    console.log(`✅ 재무상담 고객 ${financialClients.length}명 생성 완료`);
    financialClients.forEach(c => console.log(`   - ${c.name} (${c.email})`));
    console.log();

    // 재무 프로필 생성
    console.log('💰 재무 프로필 생성 중...');
    const financialProfiles = await FinancialProfile.create([
      {
        user: financialClients[0]._id,
        financialAdvisor: financialAdvisors[0]._id,
        currentAssets: {
          cash: 15000000,
          savings: 20000000,
          investments: 10000000,
          realEstate: 0,
          other: 0
        },
        currentLiabilities: {
          creditCard: 2000000,
          loans: 5000000,
          mortgage: 0,
          other: 0
        },
        monthlyIncome: {
          salary: 5000000,
          business: 0,
          investment: 0,
          other: 0
        },
        monthlyExpenses: {
          living: 1500000,
          housing: 800000,
          insurance: 150000,
          education: 0,
          other: 500000
        },
        financialGoals: [
          {
            title: '비상금 마련',
            targetAmount: 10000000,
            targetDate: new Date('2025-06-30'),
            currentAmount: 5000000,
            priority: 'high',
            status: 'in-progress'
          },
          {
            title: '결혼 자금',
            targetAmount: 50000000,
            targetDate: new Date('2026-12-31'),
            currentAmount: 10000000,
            priority: 'medium',
            status: 'planning'
          },
          {
            title: '은퇴 준비',
            targetAmount: 500000000,
            targetDate: new Date('2050-12-31'),
            currentAmount: 15000000,
            priority: 'medium',
            status: 'planning'
          }
        ],
        riskProfile: 'moderate',
        investmentExperience: 'intermediate',
        lastConsultationDate: new Date('2024-12-10'),
        nextConsultationDate: new Date('2025-01-10'),
        consultationNotes: '고객의 재무 목표 달성을 위한 저축 계획 수립',
        isActive: true
      },
      {
        user: financialClients[1]._id,
        financialAdvisor: financialAdvisors[1]._id,
        currentAssets: {
          cash: 8000000,
          savings: 30000000,
          investments: 5000000,
          realEstate: 0,
          other: 2000000
        },
        currentLiabilities: {
          creditCard: 3000000,
          loans: 10000000,
          mortgage: 0,
          other: 0
        },
        monthlyIncome: {
          salary: 4500000,
          business: 0,
          investment: 0,
          other: 0
        },
        monthlyExpenses: {
          living: 2000000,
          housing: 1200000,
          insurance: 300000,
          education: 500000,
          other: 400000
        },
        financialGoals: [
          {
            title: '자녀 교육비',
            targetAmount: 5000000,
            targetDate: new Date('2025-03-01'),
            currentAmount: 2000000,
            priority: 'high',
            status: 'in-progress'
          },
          {
            title: '주택 구입',
            targetAmount: 300000000,
            targetDate: new Date('2028-12-31'),
            currentAmount: 30000000,
            priority: 'high',
            status: 'planning'
          },
          {
            title: '자녀 대학 등록금',
            targetAmount: 100000000,
            targetDate: new Date('2036-03-01'),
            currentAmount: 5000000,
            priority: 'high',
            status: 'planning'
          }
        ],
        riskProfile: 'conservative',
        investmentExperience: 'beginner',
        lastConsultationDate: new Date('2024-12-12'),
        nextConsultationDate: new Date('2025-02-12'),
        consultationNotes: '주택 구입 및 자녀 교육비 마련을 위한 장기 계획 수립',
        isActive: true
      }
    ]);
    console.log(`✅ 재무 프로필 ${financialProfiles.length}개 생성 완료\n`);

    // 재무상담 세션 생성
    console.log('📊 재무상담 세션 생성 중...');
    const financialSessions = await FinancialSession.create([
      {
        client: financialClients[0]._id,
        financialAdvisor: financialAdvisors[0]._id,
        scheduledDate: new Date('2024-12-10T10:00:00'),
        duration: 90,
        sessionType: 'initial-consultation',
        format: 'video-call',
        status: 'completed',
        sessionRecord: {
          sharedContent: {
            mainTopics: ['재무 목표 설정', '예산 분석', '저축 계획'],
            currentSituation: '월 소득 500만원, 저축 100만원, 신용카드 빚 200만원',
            clientConcerns: ['비상금 부족', '신용카드 빚 상환', '결혼 자금 마련'],
            generalRecommendations: [
              '비상금 우선 확보 (월 저축 120만원)',
              '신용카드 빚 6개월 내 상환',
              '주식 투자 비중 점진적 확대'
            ],
            actionItems: ['월 저축액 120만원으로 증액', '신용카드 빚 상환 계획 실행'],
            followUpNeeded: true,
            nextSessionDate: new Date('2025-01-10'),
            sessionSummary: '고객의 재무 상황을 분석하고 단기/중기/장기 목표를 설정함. 월 저축액 증액 권장.'
          },
          advisorOnlyContent: {
            professionalAssessment: '재무 기초가 양호하나 비상금 부족. 체계적인 저축 계획 필요.',
            riskAnalysis: '단기 유동성 리스크 중간 수준',
            concernLevel: 'medium'
          }
        },
        fee: {
          amount: 100000,
          paymentStatus: 'paid'
        }
      },
      {
        client: financialClients[1]._id,
        financialAdvisor: financialAdvisors[1]._id,
        scheduledDate: new Date('2024-12-12T14:00:00'),
        duration: 60,
        sessionType: 'goal-planning',
        format: 'in-person',
        status: 'completed',
        sessionRecord: {
          sharedContent: {
            mainTopics: ['주택 구입 계획', '대출 상담', '교육비 준비'],
            currentSituation: '월 소득 600만원, 2자녀, 전세 거주',
            clientConcerns: ['주택 구입 자금', '자녀 교육비', '노후 준비'],
            generalRecommendations: [
              '주택청약종합저축 가입',
              '교육비 적립식 펀드 월 30만원 투자',
              '자동차 할부 조기 상환 검토'
            ],
            actionItems: ['주택청약 가입', '교육비 펀드 개설', '보험 상품 정리'],
            followUpNeeded: true,
            nextSessionDate: new Date('2025-02-12'),
            sessionSummary: '자녀 교육비와 주택 구입 자금 마련을 위한 장기 계획 수립. 월 40만원 추가 저축 가능.'
          },
          advisorOnlyContent: {
            professionalAssessment: '장기 목표 설정 양호. 지출 관리 개선으로 저축 여력 확보 가능.',
            riskAnalysis: '중기 목표 달성을 위한 투자 다각화 필요',
            concernLevel: 'low'
          }
        },
        fee: {
          amount: 120000,
          paymentStatus: 'paid'
        }
      }
    ]);
    console.log(`✅ 재무상담 세션 ${financialSessions.length}건 생성 완료\n`);

    // 최종 요약
    console.log('\n' + '='.repeat(60));
    console.log('🎉 테스트 데이터 생성 완료!\n');
    console.log('📋 생성된 데이터 요약:');
    console.log(`   • 고객 회사: ${companies.length}개`);
    console.log(`   • 심리상담센터: ${psychCenters.length}개`);
    console.log(`   • 재무상담센터: ${financialCenters.length}개`);
    console.log(`   • 심리상담사: ${psychCounselors.length}명`);
    console.log(`   • 재무상담사: ${financialAdvisors.length}명`);
    console.log(`   • 심리상담 고객: ${psychClients.length}명`);
    console.log(`   • 재무상담 고객: ${financialClients.length}명`);
    console.log(`   • 심리상담 세션: ${psychSessions.length}건`);
    console.log(`   • 재무상담 세션: ${financialSessions.length}건`);
    console.log(`   • 재무 프로필: ${financialProfiles.length}개`);
    console.log('\n' + '='.repeat(60));

    console.log('\n🔑 테스트 계정 정보:');
    console.log('\n심리상담사:');
    console.log('  - counselor1@test-psych.com / test1234 (김심리)');
    console.log('  - counselor2@test-psych.com / test1234 (이상담)');
    console.log('\n재무상담사:');
    console.log('  - advisor1@test-finance.com / test1234 (박재무)');
    console.log('  - advisor2@test-finance.com / test1234 (최자산)');
    console.log('\n심리상담 고객:');
    console.log('  - client1@test-company-it.com / test1234 (정직원)');
    console.log('  - client2@test-company-mfg.com / test1234 (한사원)');
    console.log('\n재무상담 고객:');
    console.log('  - fclient1@test-company-it.com / test1234 (강부자)');
    console.log('  - fclient2@test-company-mfg.com / test1234 (오투자)');
    console.log('\n' + '='.repeat(60) + '\n');

  } catch (error) {
    console.error('❌ 에러 발생:', error);
  } finally {
    mongoose.connection.close();
    console.log('📡 MongoDB 연결 종료');
  }
}

// 스크립트 실행
createTestData();

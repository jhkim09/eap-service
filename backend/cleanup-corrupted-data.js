const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');
const Company = require('./models/Company');
const CounselingSession = require('./models/CounselingSession');

// 한글 깨진 문자 패턴 감지 (UTF-8 인코딩 실패)
function hasCorruptedText(text) {
  if (!text || typeof text !== 'string') return false;

  // 유니코드 replacement character (�) 또는 깨진 한글 패턴
  const patterns = [
    /\uFFFD/,           // Unicode replacement character �
    /[\x80-\xFF]{3,}/,  // 연속된 바이트 문자 (깨진 UTF-8)
    /���/,              // 깨진 한글 패턴
  ];

  return patterns.some(pattern => pattern.test(text));
}

async function cleanupCorruptedData() {
  try {
    console.log('🔌 MongoDB 연결 중...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/eap-service');
    console.log('✅ MongoDB 연결 성공\n');

    // ============================================
    // 1. 깨진 고객(User) 데이터 찾기
    // ============================================
    console.log('📊 Step 1: 깨진 고객 데이터 확인 중...');
    const allUsers = await User.find({ role: 'employee' });
    const corruptedUsers = [];

    for (const user of allUsers) {
      if (hasCorruptedText(user.name) || hasCorruptedText(user.email)) {
        corruptedUsers.push(user);
        console.log(`   ❌ 깨진 고객 발견: ${user.name} (${user.email})`);
      }
    }

    console.log(`\n   발견된 깨진 고객: ${corruptedUsers.length}명\n`);

    // ============================================
    // 2. 깨진 회사(Company) 데이터 찾기
    // ============================================
    console.log('📊 Step 2: 깨진 회사 데이터 확인 중...');
    const allCompanies = await Company.find({});
    const corruptedCompanies = [];

    for (const company of allCompanies) {
      if (hasCorruptedText(company.name)) {
        corruptedCompanies.push(company);
        console.log(`   ❌ 깨진 회사 발견: ${company.name}`);
      }
    }

    console.log(`\n   발견된 깨진 회사: ${corruptedCompanies.length}개\n`);

    // ============================================
    // 3. 깨진 데이터와 연결된 세션 찾기
    // ============================================
    console.log('📊 Step 3: 깨진 데이터와 연결된 상담 세션 확인 중...');
    const corruptedUserIds = corruptedUsers.map(u => u._id);
    const corruptedCompanyNames = corruptedCompanies.map(c => c.name);

    const sessionsToDelete = await CounselingSession.find({
      $or: [
        { employee: { $in: corruptedUserIds } },
        { company: { $in: corruptedCompanyNames } }
      ]
    });

    console.log(`   발견된 상담 세션: ${sessionsToDelete.length}건\n`);

    // ============================================
    // 4. 삭제 요약 출력
    // ============================================
    console.log('📋 삭제 대상 요약:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`   고객 (User):         ${corruptedUsers.length}명`);
    console.log(`   회사 (Company):      ${corruptedCompanies.length}개`);
    console.log(`   상담 세션 (Session): ${sessionsToDelete.length}건`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (corruptedUsers.length === 0 && corruptedCompanies.length === 0) {
      console.log('✅ 깨진 데이터가 없습니다. 종료합니다.');
      await mongoose.disconnect();
      return;
    }

    // ============================================
    // 5. 삭제 실행
    // ============================================
    console.log('🗑️  삭제 실행 중...\n');

    // 5-1. 상담 세션 삭제
    if (sessionsToDelete.length > 0) {
      const sessionResult = await CounselingSession.deleteMany({
        _id: { $in: sessionsToDelete.map(s => s._id) }
      });
      console.log(`   ✅ 상담 세션 ${sessionResult.deletedCount}건 삭제 완료`);
    }

    // 5-2. 고객(User) 삭제
    if (corruptedUsers.length > 0) {
      const userResult = await User.deleteMany({
        _id: { $in: corruptedUserIds }
      });
      console.log(`   ✅ 고객 ${userResult.deletedCount}명 삭제 완료`);
    }

    // 5-3. 회사(Company) 삭제
    if (corruptedCompanies.length > 0) {
      const companyResult = await Company.deleteMany({
        _id: { $in: corruptedCompanies.map(c => c._id) }
      });
      console.log(`   ✅ 회사 ${companyResult.deletedCount}개 삭제 완료`);
    }

    console.log('\n🎉 깨진 데이터 정리 완료!\n');

    // ============================================
    // 6. 정리 후 통계
    // ============================================
    const remainingUsers = await User.countDocuments({ role: 'employee' });
    const remainingCompanies = await Company.countDocuments({});
    const remainingSessions = await CounselingSession.countDocuments({});

    console.log('📊 정리 후 데이터베이스 상태:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`   남은 고객:       ${remainingUsers}명`);
    console.log(`   남은 회사:       ${remainingCompanies}개`);
    console.log(`   남은 상담 세션:  ${remainingSessions}건`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ 에러 발생:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 MongoDB 연결 종료');
  }
}

// 스크립트 실행
cleanupCorruptedData();

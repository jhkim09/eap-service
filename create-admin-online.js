const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Render 환경변수와 같은 설정
const MONGODB_URI = 'mongodb+srv://newsh12:Rlawlgns1!1!@cluster0.senfzzl.mongodb.net/eap-service?retryWrites=true&w=majority&appName=Cluster0';

async function createOnlineAdmin() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB Atlas 연결 성공!');

    const db = mongoose.connection.db;
    
    // 기존 계정 삭제
    await db.collection('users').deleteMany({
      email: { $in: ['admin@test.com', 'counselor@test.com', 'financial@test.com', 'employee@test.com'] }
    });

    // 계정들 생성
    const accounts = [
      {
        name: '관리자',
        email: 'admin@test.com', 
        password: await bcrypt.hash('admin123', 10),
        role: 'super-admin',
        isActive: true,
        createdAt: new Date()
      },
      {
        name: '김상담',
        email: 'counselor@test.com',
        password: await bcrypt.hash('password123', 10), 
        role: 'counselor',
        phone: '010-1234-5678',
        isActive: true,
        customRate: 50000,
        useSystemRate: false,
        createdAt: new Date()
      },
      {
        name: '박재무', 
        email: 'financial@test.com',
        password: await bcrypt.hash('password123', 10),
        role: 'financial-advisor',
        phone: '010-2345-6789', 
        isActive: true,
        customRate: 80000,
        useSystemRate: false,
        createdAt: new Date()
      },
      {
        name: '홍직원',
        email: 'employee@test.com',
        password: await bcrypt.hash('password123', 10),
        role: 'employee', 
        department: 'IT개발팀',
        employeeId: 'EMP001',
        isActive: true,
        createdAt: new Date()
      }
    ];

    await db.collection('users').insertMany(accounts);
    
    console.log('✅ 온라인 테스트 계정 생성 완료:');
    console.log('관리자: admin@test.com / admin123');
    console.log('심리상담사: counselor@test.com / password123'); 
    console.log('재무상담사: financial@test.com / password123');
    console.log('직원: employee@test.com / password123');

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ 오류:', error.message);
  }
}

createOnlineAdmin();
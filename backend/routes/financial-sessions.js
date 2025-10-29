const express = require('express');
const router = express.Router();
const FinancialSession = require('../models/FinancialSession');
const FinancialProfile = require('../models/FinancialProfile');
const { auth } = require('../middleware/auth');
const AruneService = require('../services/arune/arune-service');

// 재무상담 세션 목록 조회
router.get('/', auth, async (req, res) => {
  try {
    const { status, date, page = 1, limit = 10 } = req.query;
    const query = {};
    
    // 역할에 따른 필터링
    if (req.user.role === 'financial-advisor') {
      query.financialAdvisor = req.user._id;
    } else if (req.user.role === 'employee') {
      query.client = req.user._id;
    } else if (req.user.role === 'company-admin') {
      // 회사 관리자는 소속 직원들의 세션만 조회
      // TODO: 회사 소속 직원 필터링 로직 추가
    }
    
    // 상태 필터
    if (status) {
      query.status = status;
    }
    
    // 날짜 필터
    if (date) {
      const targetDate = new Date(date);
      const nextDate = new Date(targetDate);
      nextDate.setDate(nextDate.getDate() + 1);
      
      query.scheduledDate = {
        $gte: targetDate,
        $lt: nextDate
      };
    }
    
    const sessions = await FinancialSession.find(query)
      .populate('client', 'name email department')
      .populate('financialAdvisor', 'name email')
      .sort({ scheduledDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await FinancialSession.countDocuments(query);
    
    res.json({
      sessions,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('재무상담 세션 조회 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 새로운 재무상담 세션 생성
router.post('/', auth, async (req, res) => {
  try {
    console.log('=== 재무상담 예약 요청 ===');
    console.log('사용자:', req.user.name, '(', req.user.email, ')');
    console.log('요청 데이터:', req.body);
    
    const {
      clientId,
      financialAdvisorId,
      scheduledDate,
      duration,
      sessionType,
      format,
      preparation
    } = req.body;
    
    // 권한 확인 - 직원도 재무상담 예약 가능하도록 수정
    if (req.user.role !== 'employee' && req.user.role !== 'financial-advisor' && req.user.role !== 'company-admin' && req.user.role !== 'super-admin') {
      return res.status(403).json({ message: '재무상담 세션 생성 권한이 없습니다.' });
    }
    
    // 재무상담사 ID 검증
    if (req.user.role === 'employee' && !financialAdvisorId) {
      return res.status(400).json({ message: '재무상담사를 선택해주세요.' });
    }
    
    // 시간 충돌 검사
    const conflictSession = await FinancialSession.findOne({
      financialAdvisor: financialAdvisorId || req.user._id,
      scheduledDate: new Date(scheduledDate),
      status: { $in: ['scheduled', 'in-progress'] }
    });
    
    if (conflictSession) {
      return res.status(400).json({ message: '해당 시간에 이미 예약된 상담이 있습니다.' });
    }
    
    const session = new FinancialSession({
      client: req.user.role === 'employee' ? req.user._id : clientId,
      financialAdvisor: financialAdvisorId || (req.user.role === 'financial-advisor' ? req.user._id : null),
      scheduledDate: new Date(scheduledDate),
      duration: duration || 60,
      sessionType,
      format: format || 'video-call',
      preparation: preparation || {}
    });
    
    await session.save();
    console.log('재무상담 세션 저장 완료:', session._id);
    
    const populatedSession = await FinancialSession.findById(session._id)
      .populate('client', 'name email department')
      .populate('financialAdvisor', 'name email');
    
    console.log('✅ 재무상담 예약 성공');
    res.status(201).json({
      message: '재무상담 세션이 생성되었습니다.',
      session: populatedSession
    });
  } catch (error) {
    console.error('재무상담 세션 생성 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 재무상담사 대시보드 통계 (이 라우트는 /:id 보다 먼저 위치해야 함)
router.get('/advisor/stats', auth, async (req, res) => {
  try {
    if (req.user.role !== 'financial-advisor') {
      return res.status(403).json({ message: '재무상담사 통계 조회 권한이 없습니다.' });
    }
    
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
    
    // 이번 달 통계
    const monthlyStats = await FinancialSession.aggregate([
      {
        $match: {
          financialAdvisor: req.user._id,
          scheduledDate: { $gte: startOfMonth }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // 이번 주 예정된 상담
    const weeklyScheduled = await FinancialSession.countDocuments({
      financialAdvisor: req.user._id,
      status: 'scheduled',
      scheduledDate: { $gte: startOfWeek }
    });
    
    // 전체 고객 수
    const totalClients = await FinancialProfile.countDocuments({
      financialAdvisor: req.user._id,
      isActive: true
    });
    
    // 평균 만족도
    const satisfactionData = await FinancialSession.aggregate([
      {
        $match: {
          financialAdvisor: req.user._id,
          'clientFeedback.rating': { $exists: true }
        }
      },
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$clientFeedback.rating' },
          totalFeedbacks: { $sum: 1 }
        }
      }
    ]);
    
    res.json({
      monthlyStats,
      weeklyScheduled,
      totalClients,
      satisfaction: satisfactionData[0] || { avgRating: 0, totalFeedbacks: 0 }
    });
  } catch (error) {
    console.error('재무상담사 통계 조회 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 특정 재무상담 세션 조회
router.get('/:id', auth, async (req, res) => {
  try {
    const session = await FinancialSession.findById(req.params.id)
      .populate('client', 'name email department position')
      .populate('financialAdvisor', 'name email');
    
    if (!session) {
      return res.status(404).json({ message: '해당 세션을 찾을 수 없습니다.' });
    }
    
    // 권한 확인
    const hasAccess = 
      req.user.role === 'super-admin' ||
      req.user.role === 'company-admin' ||
      session.client.toString() === req.user._id.toString() ||
      session.financialAdvisor.toString() === req.user._id.toString();
    
    if (!hasAccess) {
      return res.status(403).json({ message: '해당 세션에 접근할 권한이 없습니다.' });
    }
    
    res.json(session);
  } catch (error) {
    console.error('재무상담 세션 조회 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 재무상담 세션 상태 업데이트
router.put('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    
    const session = await FinancialSession.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ message: '해당 세션을 찾을 수 없습니다.' });
    }
    
    // 권한 확인 (상담사만 상태 변경 가능)
    if (session.financialAdvisor.toString() !== req.user._id.toString() && 
        req.user.role !== 'super-admin') {
      return res.status(403).json({ message: '세션 상태 변경 권한이 없습니다.' });
    }
    
    session.status = status;
    await session.save();
    
    res.json({ message: '세션 상태가 업데이트되었습니다.', session });
  } catch (error) {
    console.error('재무상담 세션 상태 업데이트 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 재무상담 세션 기록 작성
router.put('/:id/record', auth, async (req, res) => {
  try {
    const { sessionRecord, materialsProvided } = req.body;
    
    const session = await FinancialSession.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ message: '해당 세션을 찾을 수 없습니다.' });
    }
    
    // 권한 확인 (담당 상담사만)
    if (session.financialAdvisor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: '세션 기록 작성 권한이 없습니다.' });
    }
    
    session.sessionRecord = sessionRecord;
    if (materialsProvided) {
      session.materialsProvided = materialsProvided;
    }
    
    // 상담 완료 시 상태 자동 업데이트
    if (sessionRecord && session.status === 'in-progress') {
      session.status = 'completed';
    }
    
    await session.save();
    
    res.json({ message: '세션 기록이 저장되었습니다.', session });
  } catch (error) {
    console.error('재무상담 세션 기록 저장 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 고객 피드백 등록
router.put('/:id/feedback', auth, async (req, res) => {
  try {
    const { rating, comments, wouldRecommend } = req.body;

    const session = await FinancialSession.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ message: '해당 세션을 찾을 수 없습니다.' });
    }

    // 권한 확인 (해당 고객만)
    if (session.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: '피드백 등록 권한이 없습니다.' });
    }

    session.clientFeedback = {
      rating,
      comments,
      wouldRecommend
    };

    await session.save();

    res.json({ message: '피드백이 등록되었습니다.', session });
  } catch (error) {
    console.error('고객 피드백 등록 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 🆕 Arune 재무분석 설문 제출 및 분석 (Phase 1)
router.post('/:id/arune-survey', auth, async (req, res) => {
  try {
    console.log('=== Arune 설문 제출 ===');
    console.log('세션 ID:', req.params.id);
    console.log('사용자:', req.user.name);

    const { answers, personalInfo } = req.body;

    // 입력 검증
    if (!answers || Object.keys(answers).length === 0) {
      return res.status(400).json({ message: '설문 답변이 필요합니다.' });
    }

    if (!personalInfo || !personalInfo.birthYear) {
      return res.status(400).json({ message: '개인정보(출생연도)가 필요합니다.' });
    }

    // 세션 조회
    const session = await FinancialSession.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ message: '해당 세션을 찾을 수 없습니다.' });
    }

    // 권한 확인 (고객 본인만 설문 제출 가능)
    if (session.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: '설문 제출 권한이 없습니다.' });
    }

    // 이미 설문이 완료되었는지 확인
    if (session.aruneSurvey && session.aruneSurvey.completed) {
      return res.status(400).json({
        message: '이미 설문이 완료되었습니다.',
        existingAnalysis: session.aruneReportData
      });
    }

    // Arune 서비스를 통한 분석
    const aruneService = new AruneService();
    const analysisResult = aruneService.analyzeFinancialProfile({
      answers,
      personalInfo
    });

    console.log('✅ Arune 분석 완료:', analysisResult.analysisId);

    // 세션 업데이트
    session.aruneSurvey = {
      completed: true,
      completedAt: new Date(),
      answers,
      personalInfo
    };

    session.aruneReportData = analysisResult;

    await session.save();

    res.status(201).json({
      message: 'Arune 재무분석이 완료되었습니다.',
      analysis: analysisResult
    });

  } catch (error) {
    console.error('Arune 설문 처리 오류:', error);
    res.status(500).json({
      message: '서버 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// 🆕 Arune 분석 결과 조회
router.get('/:id/arune-analysis', auth, async (req, res) => {
  try {
    const session = await FinancialSession.findById(req.params.id);

    if (!session) {
      return res.status(404).json({ message: '해당 세션을 찾을 수 없습니다.' });
    }

    // 권한 확인
    if (!session.canViewDetails(req.user._id, req.user.role)) {
      return res.status(403).json({ message: '분석 결과 조회 권한이 없습니다.' });
    }

    // 설문이 완료되지 않았을 경우
    if (!session.aruneSurvey || !session.aruneSurvey.completed) {
      return res.status(404).json({
        message: '아직 설문이 완료되지 않았습니다.',
        surveyCompleted: false
      });
    }

    res.json({
      surveyCompleted: true,
      completedAt: session.aruneSurvey.completedAt,
      analysis: session.aruneReportData,
      personalInfo: session.aruneSurvey.personalInfo
    });

  } catch (error) {
    console.error('Arune 분석 결과 조회 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 🆕 Arune B5 소책자 생성 (Phase 2 - 플레이스홀더)
router.post('/:id/generate-booklet', auth, async (req, res) => {
  try {
    const session = await FinancialSession.findById(req.params.id);

    if (!session) {
      return res.status(404).json({ message: '해당 세션을 찾을 수 없습니다.' });
    }

    // 권한 확인
    if (!session.canViewDetails(req.user._id, req.user.role)) {
      return res.status(403).json({ message: '소책자 생성 권한이 없습니다.' });
    }

    // 분석이 완료되지 않았을 경우
    if (!session.aruneReportData) {
      return res.status(400).json({
        message: '먼저 Arune 설문을 완료해주세요.'
      });
    }

    // 이미 소책자가 생성되었는지 확인
    if (session.aruneReportData.bookletUrl) {
      return res.json({
        message: '소책자가 이미 생성되어 있습니다.',
        bookletUrl: session.aruneReportData.bookletUrl,
        generatedAt: session.aruneReportData.bookletGeneratedAt
      });
    }

    // TODO: Phase 2 - PDF 생성 로직 구현
    // 1. puppeteer로 HTML → PDF 변환
    // 2. Cloudinary 또는 S3에 업로드
    // 3. URL 저장

    res.status(501).json({
      message: 'B5 소책자 생성 기능은 Phase 2에서 구현 예정입니다.',
      analysisId: session.aruneReportData.analysisId
    });

  } catch (error) {
    console.error('소책자 생성 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

module.exports = router;
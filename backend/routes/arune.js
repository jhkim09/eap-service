const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const FinancialSession = require('../models/FinancialSession');

/**
 * GET /api/arune/survey
 * 로그인한 사용자의 모든 Arune 설문 조회
 */
router.get('/survey', auth, async (req, res) => {
  try {
    // 본인의 재무상담 세션 조회 (고객 또는 재무상담사)
    let query = {};
    if (req.user.role === 'financial-advisor') {
      query = { financialAdvisor: req.user.id };
    } else {
      query = { client: req.user.id };
    }

    const sessions = await FinancialSession.find(query)
      .populate('client', 'name email')
      .populate('financialAdvisor', 'name')
      .select('aruneSurvey scheduledDate status')
      .sort({ scheduledDate: -1 });

    // 설문 완료된 세션만 필터링
    const surveys = sessions
      .filter(s => s.aruneSurvey && s.aruneSurvey.completed)
      .map(s => ({
        sessionId: s._id,
        client: s.client ? { name: s.client.name, email: s.client.email } : null,
        advisor: s.financialAdvisor ? { name: s.financialAdvisor.name } : null,
        completedAt: s.aruneSurvey.completedAt,
        scheduledDate: s.scheduledDate,
        status: s.status
      }));

    res.json({ surveys, total: surveys.length });
  } catch (error) {
    console.error('Arune 설문 목록 조회 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

/**
 * GET /api/arune/report
 * 로그인한 사용자의 모든 Arune 리포트 조회
 */
router.get('/report', auth, async (req, res) => {
  try {
    // 본인의 재무상담 세션 조회 (고객 또는 재무상담사)
    let query = {};
    if (req.user.role === 'financial-advisor') {
      query = { financialAdvisor: req.user.id };
    } else {
      query = { client: req.user.id };
    }

    const sessions = await FinancialSession.find(query)
      .populate('client', 'name email')
      .populate('financialAdvisor', 'name')
      .select('aruneReportData scheduledDate status')
      .sort({ scheduledDate: -1 });

    // 리포트가 생성된 세션만 필터링
    const reports = sessions
      .filter(s => s.aruneReportData && s.aruneReportData.generatedAt)
      .map(s => ({
        sessionId: s._id,
        client: s.client ? { name: s.client.name, email: s.client.email } : null,
        advisor: s.financialAdvisor ? { name: s.financialAdvisor.name } : null,
        analysisId: s.aruneReportData.analysisId,
        generatedAt: s.aruneReportData.generatedAt,
        animalType: s.aruneReportData.animalType,
        scheduledDate: s.scheduledDate,
        status: s.status
      }));

    res.json({ reports, total: reports.length });
  } catch (error) {
    console.error('Arune 리포트 목록 조회 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

/**
 * POST /api/arune/survey
 * Arune 26개 질문 설문 제출
 */
router.post('/survey', auth, async (req, res) => {
  try {
    const { sessionId, answers } = req.body;

    if (!sessionId || !answers) {
      return res.status(400).json({ message: '세션 ID와 설문 답변이 필요합니다.' });
    }

    // 세션 조회
    const session = await FinancialSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: '재무상담 세션을 찾을 수 없습니다.' });
    }

    // 권한 확인: 본인의 세션만 설문 제출 가능
    if (session.client.toString() !== req.user.id && req.user.role !== 'financial-advisor' && req.user.role !== 'super-admin') {
      return res.status(403).json({ message: '접근 권한이 없습니다.' });
    }

    // 설문 답변 저장
    session.aruneSurvey.answers = answers;
    session.aruneSurvey.completed = true;
    session.aruneSurvey.completedAt = new Date();

    await session.save();

    res.json({
      message: 'Arune 설문이 성공적으로 제출되었습니다.',
      sessionId: session._id,
      completed: true,
      completedAt: session.aruneSurvey.completedAt
    });
  } catch (error) {
    console.error('Arune 설문 제출 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

/**
 * GET /api/arune/survey/:sessionId
 * 특정 세션의 Arune 설문 결과 조회
 */
router.get('/survey/:sessionId', auth, async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await FinancialSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: '재무상담 세션을 찾을 수 없습니다.' });
    }

    // 권한 확인: 본인이거나 담당 재무상담사만 조회 가능
    if (session.client.toString() !== req.user.id &&
        session.financialAdvisor.toString() !== req.user.id &&
        req.user.role !== 'super-admin') {
      return res.status(403).json({ message: '접근 권한이 없습니다.' });
    }

    // 설문 완료되지 않은 경우
    if (!session.aruneSurvey.completed) {
      return res.status(404).json({
        message: '아직 설문이 완료되지 않았습니다.',
        completed: false
      });
    }

    res.json({
      sessionId: session._id,
      survey: {
        completed: session.aruneSurvey.completed,
        completedAt: session.aruneSurvey.completedAt,
        answers: session.aruneSurvey.answers
      }
    });
  } catch (error) {
    console.error('Arune 설문 조회 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

/**
 * GET /api/arune/report/:sessionId
 * Arune 분석 리포트 조회
 */
router.get('/report/:sessionId', auth, async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await FinancialSession.findById(sessionId)
      .populate('client', 'name email')
      .populate('financialAdvisor', 'name');

    if (!session) {
      return res.status(404).json({ message: '재무상담 세션을 찾을 수 없습니다.' });
    }

    // 권한 확인: 본인이거나 담당 재무상담사만 조회 가능
    if (session.client._id.toString() !== req.user.id &&
        session.financialAdvisor._id.toString() !== req.user.id &&
        req.user.role !== 'super-admin') {
      return res.status(403).json({ message: '접근 권한이 없습니다.' });
    }

    // 리포트가 아직 생성되지 않은 경우
    if (!session.aruneReportData || !session.aruneReportData.generatedAt) {
      return res.status(404).json({
        message: '아직 리포트가 생성되지 않았습니다. /api/arune/report/:sessionId/generate 를 통해 리포트를 생성해주세요.',
        generated: false
      });
    }

    res.json({
      sessionId: session._id,
      client: {
        name: session.client.name,
        email: session.client.email
      },
      advisor: {
        name: session.financialAdvisor.name
      },
      report: {
        analysisId: session.aruneReportData.analysisId,
        generatedAt: session.aruneReportData.generatedAt,
        scores: session.aruneReportData.scores,
        animalType: session.aruneReportData.animalType,
        animalTypeDescription: session.aruneReportData.animalTypeDescription,
        lifeClock: session.aruneReportData.lifeClock,
        recommendations: session.aruneReportData.recommendations
      }
    });
  } catch (error) {
    console.error('Arune 리포트 조회 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

/**
 * POST /api/arune/report/:sessionId/generate
 * Arune 리포트 생성 (외부 API 호출 또는 내부 로직)
 */
router.post('/report/:sessionId/generate', auth, async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await FinancialSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: '재무상담 세션을 찾을 수 없습니다.' });
    }

    // 권한 확인: 재무상담사만 리포트 생성 가능
    if (req.user.role !== 'financial-advisor' && req.user.role !== 'super-admin') {
      return res.status(403).json({ message: '재무상담사만 리포트를 생성할 수 있습니다.' });
    }

    // 설문이 완료되었는지 확인
    if (!session.aruneSurvey.completed) {
      return res.status(400).json({
        message: '설문이 완료되지 않았습니다. 먼저 설문을 완료해주세요.',
        surveyCompleted: false
      });
    }

    // 간단한 더미 분석 생성 (실제로는 외부 Arune API를 호출하거나 복잡한 분석 로직 실행)
    const analysisId = `ARUNE-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    // 더미 점수 계산 (실제로는 설문 답변을 기반으로 계산)
    const scores = {
      spending: Math.floor(Math.random() * 50) + 50,        // 50-100
      saving: Math.floor(Math.random() * 50) + 50,          // 50-100
      investment: Math.floor(Math.random() * 50) + 30,      // 30-80
      riskManagement: Math.floor(Math.random() * 50) + 40,  // 40-90
    };
    scores.total = scores.spending + scores.saving + scores.investment + scores.riskManagement;

    // 동물형 결정 (총점 기준)
    let animalType;
    let animalTypeDescription;
    if (scores.total >= 320) {
      animalType = '사자형';
      animalTypeDescription = '재무관리에 매우 적극적이고 체계적입니다. 투자와 저축의 균형이 우수합니다.';
    } else if (scores.total >= 280) {
      animalType = '황소형';
      animalTypeDescription = '안정적인 재무관리를 선호하며 꾸준한 저축 습관이 있습니다.';
    } else if (scores.total >= 240) {
      animalType = '돼지형';
      animalTypeDescription = '지출 관리가 필요하지만 저축 의지가 있습니다. 계획적인 소비가 필요합니다.';
    } else if (scores.total >= 200) {
      animalType = '양형';
      animalTypeDescription = '재무관리에 관심은 있으나 실천이 부족합니다. 목표 설정이 필요합니다.';
    } else {
      animalType = '거북이형';
      animalTypeDescription = '재무관리에 소극적입니다. 기본적인 재무 습관부터 시작하세요.';
    }

    // 인생시계 계산 (현재 나이 기반, 더미 데이터)
    const currentAge = 35; // 실제로는 사용자 프로필에서 가져와야 함
    const lifeClock = {
      age: currentAge,
      timeString: '오후 2시 30분',
      phase: '중년기 진입',
      percentageComplete: Math.round((currentAge / 85) * 100)
    };

    // 추천사항 생성
    const recommendations = [
      {
        category: '지출관리',
        priority: 'high',
        title: '고정지출 최적화',
        description: '고정지출을 전체 소득의 50% 이내로 유지하세요.',
        actionItems: ['불필요한 구독 서비스 정리', '통신비 요금제 재검토']
      },
      {
        category: '저축',
        priority: 'high',
        title: '비상금 마련',
        description: '월 소득의 3-6개월치 비상금을 준비하세요.',
        actionItems: ['자동이체로 매월 저축', 'CMA 계좌 활용']
      },
      {
        category: '투자',
        priority: 'medium',
        title: '장기 투자 시작',
        description: '은퇴를 대비한 장기 투자를 시작하세요.',
        actionItems: ['연금저축 가입', '인덱스 펀드 투자 시작']
      }
    ];

    // 리포트 데이터 저장
    session.aruneReportData = {
      analysisId,
      generatedAt: new Date(),
      scores,
      animalType,
      animalTypeDescription,
      lifeClock,
      recommendations
    };

    await session.save();

    res.json({
      message: 'Arune 리포트가 성공적으로 생성되었습니다.',
      sessionId: session._id,
      analysisId,
      generated: true,
      generatedAt: session.aruneReportData.generatedAt
    });
  } catch (error) {
    console.error('Arune 리포트 생성 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

module.exports = router;

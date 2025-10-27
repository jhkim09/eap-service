const express = require('express');
const router = express.Router();
const CounselingSession = require('../models/CounselingSession');
const User = require('../models/User');

/**
 * GET /api/dashboard/summary
 * 대시보드 요약 정보 조회
 */
router.get('/summary', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // 오늘 Tiro 상담 수
    const tiroSessionsToday = await CounselingSession.countDocuments({
      'tiroData.callTimestamp': {
        $gte: today,
        $lt: tomorrow
      }
    });

    // 긴급 케이스 (riskLevel이 critical 또는 high)
    const urgentCases = await CounselingSession.countDocuments({
      'tiroData.gptAnalysis.riskLevel': { $in: ['critical', 'high'] },
      'tiroData.callTimestamp': { $exists: true },
      status: { $ne: 'completed' }
    });

    // 대기 중인 상담 (scheduled 상태)
    const pendingSessions = await CounselingSession.countDocuments({
      status: 'scheduled',
      appointmentDate: { $gte: today }
    });

    // 오늘 완료된 상담
    const completedToday = await CounselingSession.countDocuments({
      status: 'completed',
      updatedAt: {
        $gte: today,
        $lt: tomorrow
      }
    });

    // EAP 추천 필요 건수
    const eapNeeded = await CounselingSession.countDocuments({
      'tiroData.gptAnalysis.recommendedServices.eap.needed': true,
      status: { $ne: 'completed' }
    });

    // 재무상담 추천 필요 건수
    const financialNeeded = await CounselingSession.countDocuments({
      'tiroData.gptAnalysis.recommendedServices.financial.needed': true,
      status: { $ne: 'completed' }
    });

    // 우선순위별 추천 건수
    const urgentPriority = await CounselingSession.countDocuments({
      $or: [
        { 'tiroData.gptAnalysis.recommendedServices.eap.priority': 'urgent' },
        { 'tiroData.gptAnalysis.recommendedServices.financial.priority': 'urgent' }
      ],
      status: { $ne: 'completed' }
    });

    const highPriority = await CounselingSession.countDocuments({
      $or: [
        { 'tiroData.gptAnalysis.recommendedServices.eap.priority': 'high' },
        { 'tiroData.gptAnalysis.recommendedServices.financial.priority': 'high' }
      ],
      status: { $ne: 'completed' }
    });

    const mediumPriority = await CounselingSession.countDocuments({
      $or: [
        { 'tiroData.gptAnalysis.recommendedServices.eap.priority': 'medium' },
        { 'tiroData.gptAnalysis.recommendedServices.financial.priority': 'medium' }
      ],
      status: { $ne: 'completed' }
    });

    // 주간 트렌드 (최근 7일)
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const weeklyTiroSessions = await CounselingSession.aggregate([
      {
        $match: {
          'tiroData.callTimestamp': { $gte: weekAgo, $lt: tomorrow }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$tiroData.callTimestamp' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const weeklyEapSessions = await CounselingSession.aggregate([
      {
        $match: {
          createdAt: { $gte: weekAgo, $lt: tomorrow },
          sessionType: 'individual',
          'tiroData.callTimestamp': { $exists: false } // Tiro가 아닌 일반 EAP 세션
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      data: {
        today: {
          tiroSessions: tiroSessionsToday,
          urgentCases: urgentCases,
          pendingSessions: pendingSessions,
          completedToday: completedToday
        },
        recommendations: {
          eapNeeded: eapNeeded,
          financialNeeded: financialNeeded,
          byPriority: {
            urgent: urgentPriority,
            high: highPriority,
            medium: mediumPriority,
            low: 0 // 나중에 추가 가능
          }
        },
        weeklyTrend: {
          tiroSessions: weeklyTiroSessions.map(d => d.count),
          eapSessions: weeklyEapSessions.map(d => d.count)
        }
      }
    });

  } catch (error) {
    console.error('❌ Dashboard summary error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard summary',
      message: error.message
    });
  }
});

/**
 * GET /api/dashboard/recommendations
 * 서비스 추천 목록 조회 (필터링 지원)
 *
 * Query Parameters:
 * - priority: urgent,high,medium,low (comma-separated)
 * - service: eap,financial (comma-separated)
 * - status: unassigned,assigned,completed
 * - dateFrom: YYYY-MM-DD
 * - dateTo: YYYY-MM-DD
 * - search: 고객명/회사명
 * - page: 페이지 번호 (default: 1)
 * - limit: 페이지당 항목 수 (default: 20)
 */
router.get('/recommendations', async (req, res) => {
  try {
    const {
      priority,
      service,
      status,
      dateFrom,
      dateTo,
      search,
      page = 1,
      limit = 20
    } = req.query;

    // 기본 쿼리: Tiro 데이터가 있는 세션만
    const query = {
      'tiroData.callTimestamp': { $exists: true }
    };

    // 우선순위 필터
    if (priority) {
      const priorities = priority.split(',');
      query.$or = [
        { 'tiroData.gptAnalysis.recommendedServices.eap.priority': { $in: priorities } },
        { 'tiroData.gptAnalysis.recommendedServices.financial.priority': { $in: priorities } }
      ];
    }

    // 서비스 필터
    if (service) {
      const services = service.split(',');
      const serviceFilters = [];

      if (services.includes('eap')) {
        serviceFilters.push({ 'tiroData.gptAnalysis.recommendedServices.eap.needed': true });
      }
      if (services.includes('financial')) {
        serviceFilters.push({ 'tiroData.gptAnalysis.recommendedServices.financial.needed': true });
      }

      if (serviceFilters.length > 0) {
        query.$and = query.$and || [];
        query.$and.push({ $or: serviceFilters });
      }
    }

    // 상태 필터 (나중에 구현)
    // if (status === 'unassigned') {
    //   query.hasEapSession = false;
    // }

    // 날짜 필터
    if (dateFrom || dateTo) {
      query['tiroData.callTimestamp'] = {};
      if (dateFrom) {
        query['tiroData.callTimestamp'].$gte = new Date(dateFrom);
      }
      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setDate(endDate.getDate() + 1); // 해당 날짜 포함
        query['tiroData.callTimestamp'].$lt = endDate;
      }
    }

    // 검색 (고객명/회사명)
    if (search) {
      query.$or = [
        { company: { $regex: search, $options: 'i' } }
        // employee.name 검색은 populate 후에 필터링
      ];
    }

    // 페이지네이션
    const skip = (page - 1) * limit;
    const total = await CounselingSession.countDocuments(query);

    // 데이터 조회
    const sessions = await CounselingSession.find(query)
      .populate('employee', 'name phone email')
      .sort({
        'tiroData.gptAnalysis.riskLevel': -1, // critical > high > medium > low
        'tiroData.callTimestamp': -1
      })
      .skip(skip)
      .limit(parseInt(limit));

    // 추천 데이터 정리
    const recommendations = sessions
      .filter(session => {
        // employee.name 검색 필터링
        if (search && session.employee) {
          const nameMatch = session.employee.name &&
            session.employee.name.toLowerCase().includes(search.toLowerCase());
          const companyMatch = session.company &&
            session.company.toLowerCase().includes(search.toLowerCase());
          return nameMatch || companyMatch;
        }
        return true;
      })
      .map(session => {
        const eapNeeded = session.tiroData?.gptAnalysis?.recommendedServices?.eap?.needed || false;
        const financialNeeded = session.tiroData?.gptAnalysis?.recommendedServices?.financial?.needed || false;

        return {
          sessionId: session._id,
          employee: session.employee ? {
            _id: session.employee._id,
            name: session.employee.name,
            company: session.company,
            phone: session.employee.phone,
            email: session.employee.email
          } : null,
          tiroDate: session.tiroData?.callTimestamp,
          emotionalState: session.tiroData?.gptAnalysis?.emotionalState,
          riskLevel: session.tiroData?.gptAnalysis?.riskLevel,
          recommendedServices: session.tiroData?.gptAnalysis?.recommendedServices || {},
          mainIssues: session.tiroData?.gptAnalysis?.mainIssues || [],
          financialMentions: session.tiroData?.gptAnalysis?.financialMentions || [],
          hasEapSession: false, // TODO: 실제 EAP 세션 연결 확인
          hasFinancialSession: false, // TODO: 실제 재무상담 세션 연결 확인
          eapSessionId: null,
          financialSessionId: null
        };
      });

    res.json({
      success: true,
      data: {
        recommendations: recommendations,
        pagination: {
          total: total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('❌ Dashboard recommendations error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recommendations',
      message: error.message
    });
  }
});

/**
 * GET /api/dashboard/customer/:employeeId
 * 고객 통합 뷰 (Tiro + EAP + 재무상담)
 */
router.get('/customer/:employeeId', async (req, res) => {
  try {
    const { employeeId } = req.params;

    // 고객 정보 조회
    const employee = await User.findById(employeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found'
      });
    }

    // Tiro 세션 조회
    const tiroSessions = await CounselingSession.find({
      employee: employeeId,
      'tiroData.callTimestamp': { $exists: true }
    })
    .sort({ 'tiroData.callTimestamp': -1 })
    .limit(10);

    // EAP 세션 조회 (Tiro가 아닌 일반 상담)
    const eapSessions = await CounselingSession.find({
      employee: employeeId,
      'tiroData.callTimestamp': { $exists: false },
      sessionType: 'individual'
    })
    .populate('counselor', 'name')
    .sort({ appointmentDate: -1 })
    .limit(10);

    // 재무상담 세션 (나중에 별도 모델로 분리 가능)
    const financialSessions = [];

    // 최근 추천 정보
    const latestTiroSession = tiroSessions[0];
    const recommendations = latestTiroSession ? {
      latest: {
        from: latestTiroSession._id,
        date: latestTiroSession.tiroData.callTimestamp,
        eap: latestTiroSession.tiroData?.gptAnalysis?.recommendedServices?.eap || {},
        financial: latestTiroSession.tiroData?.gptAnalysis?.recommendedServices?.financial || {}
      }
    } : null;

    // 타임라인 생성 (시간순 정렬)
    const timeline = [];

    tiroSessions.forEach(session => {
      timeline.push({
        type: 'tiro',
        date: session.tiroData.callTimestamp,
        title: 'Tiro 상담',
        summary: session.tiroData?.gptAnalysis?.summary || '상담 내용'
      });
    });

    eapSessions.forEach(session => {
      timeline.push({
        type: 'eap',
        date: session.appointmentDate,
        title: 'EAP 심리상담',
        summary: session.topic,
        counselor: session.counselor?.name
      });
    });

    timeline.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({
      success: true,
      data: {
        employee: {
          _id: employee._id,
          name: employee.name,
          company: employee.company,
          phone: employee.phone,
          email: employee.email,
          department: employee.department
        },
        tiroSessions: tiroSessions.map(s => ({
          sessionId: s._id,
          callId: s.tiroData?.callId,
          date: s.tiroData?.callTimestamp,
          duration: s.tiroData?.callDuration,
          transcript: s.tiroData?.transcript,
          gptAnalysis: s.tiroData?.gptAnalysis
        })),
        eapSessions: eapSessions.map(s => ({
          sessionId: s._id,
          date: s.appointmentDate,
          topic: s.topic,
          status: s.status,
          counselor: s.counselor,
          duration: s.duration
        })),
        financialSessions: financialSessions,
        recommendations: recommendations,
        timeline: timeline
      }
    });

  } catch (error) {
    console.error('❌ Customer detail error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch customer details',
      message: error.message
    });
  }
});

/**
 * POST /api/counseling-sessions/assign-from-tiro
 * Tiro 세션에서 EAP 또는 재무상담 배정
 */
router.post('/assign-from-tiro', async (req, res) => {
  try {
    const {
      tiroSessionId,
      serviceType, // 'eap' or 'financial'
      counselorId,
      appointmentDate,
      counselingMethod = 'phoneVideo',
      assignmentNotes
    } = req.body;

    // Validation
    if (!tiroSessionId || !serviceType || !counselorId || !appointmentDate) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: tiroSessionId, serviceType, counselorId, appointmentDate'
      });
    }

    // Tiro 세션 조회
    const tiroSession = await CounselingSession.findById(tiroSessionId).populate('employee');
    if (!tiroSession) {
      return res.status(404).json({
        success: false,
        error: 'Tiro session not found'
      });
    }

    if (!tiroSession.tiroData) {
      return res.status(400).json({
        success: false,
        error: 'This is not a Tiro session'
      });
    }

    // 추천 정보 가져오기
    const recommendation = serviceType === 'eap'
      ? tiroSession.tiroData.gptAnalysis?.recommendedServices?.eap
      : tiroSession.tiroData.gptAnalysis?.recommendedServices?.financial;

    if (!recommendation || !recommendation.needed) {
      return res.status(400).json({
        success: false,
        error: `${serviceType.toUpperCase()} service is not recommended for this customer`
      });
    }

    // 새 상담 세션 생성
    const newSession = new CounselingSession({
      employee: tiroSession.employee._id,
      counselor: counselorId,
      company: tiroSession.company,
      appointmentDate: new Date(appointmentDate),
      duration: 50,
      status: 'scheduled',
      sessionType: 'individual',
      counselingMethod: counselingMethod,
      topic: recommendation.reason || `${serviceType === 'eap' ? 'EAP 상담' : '재무상담'} (Tiro 추천)`,
      urgencyLevel: recommendation.priority === 'urgent' ? 'critical' :
                     recommendation.priority === 'high' ? 'high' : 'medium',
      assignmentStatus: 'assigned',
      assignmentNotes: assignmentNotes || `Tiro 세션에서 ${serviceType === 'eap' ? 'EAP' : '재무상담'} 추천: ${recommendation.reason}`,
      counselorRate: 50000 // 기본값, 나중에 상담사별로 설정 가능
    });

    await newSession.save();

    // TODO: Tiro 세션에 연결 정보 저장 (sourceSessionId 필드 추가 필요)

    res.status(201).json({
      success: true,
      data: {
        sessionId: newSession._id,
        message: `${serviceType === 'eap' ? 'EAP 상담' : '재무상담'}이 성공적으로 배정되었습니다.`,
        appointmentDate: newSession.appointmentDate,
        topic: newSession.topic
      }
    });

  } catch (error) {
    console.error('❌ Assignment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to assign counseling session',
      message: error.message
    });
  }
});

module.exports = router;

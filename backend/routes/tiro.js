const express = require('express');
const router = express.Router();
const CounselingSession = require('../models/CounselingSession');
const User = require('../models/User');
const Company = require('../models/Company');

/**
 * POST /api/tiro/sessions
 * Tiro.ai 음성 상담 기록 저장
 *
 * Request Body:
 * {
 *   "tiroCallId": "TIRO-CALL-20241027-001",
 *   "timestamp": "2024-10-27T10:30:00Z",
 *   "transcript": "원본 상담 스크립트...",
 *   "duration": 45,
 *   "customerPhone": "010-1234-5678",
 *   "analysis": {
 *     "customerName": "홍길동",
 *     "consultationType": "business",
 *     "summary": "요약...",
 *     "mainIssues": [...],
 *     "actionItems": [...],
 *     "riskLevel": "medium",
 *     "tags": [...]
 *   }
 * }
 */
router.post('/sessions', async (req, res) => {
  try {
    const {
      tiroCallId,
      timestamp,
      transcript,
      duration,
      customerPhone,
      analysis
    } = req.body;

    // 필수 필드 검증
    if (!tiroCallId || !transcript || !analysis) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: tiroCallId, transcript, analysis'
      });
    }

    // 1. 고객 정보 찾기 또는 생성
    let employee = null;
    let company = null;

    if (analysis.customerName) {
      // 고객 찾기 우선순위: 1) 전화번호 2) 이름+회사명 3) 이름만
      let searchQuery;

      if (customerPhone) {
        // 1순위: 전화번호로 검색 (가장 확실한 식별자)
        searchQuery = {
          $or: [
            { phone: customerPhone },
            { phone: customerPhone.replace(/[^0-9]/g, '') }
          ]
        };
      } else if (analysis.companyName) {
        // 2순위: 이름 + 회사명으로 검색 (동명이인 방지)
        // 먼저 회사 찾기
        const targetCompany = await Company.findOne({ name: analysis.companyName });
        if (targetCompany) {
          searchQuery = {
            name: analysis.customerName,
            company: targetCompany._id
          };
        } else {
          // 회사가 없으면 고객 검색 안 함 (나중에 회사+고객 자동 생성)
          searchQuery = null;
        }
      } else {
        // 3순위: 이름만으로 검색 (동명이인 위험 있음)
        searchQuery = { name: analysis.customerName };
      }

      employee = searchQuery ? await User.findOne(searchQuery) : null;

      // 고객이 없으면 새로 생성 (회사 배정)
      if (!employee) {
        // 1. GPT가 추출한 회사명으로 찾기
        if (analysis.companyName) {
          company = await Company.findOne({ name: analysis.companyName });

          // 회사가 없으면 자동 생성 (Tiro.ai 고객용)
          if (!company) {
            console.log(`📝 Creating new company from Tiro.ai: ${analysis.companyName}`);
            company = await Company.create({
              name: analysis.companyName,
              domain: `${analysis.companyName.toLowerCase().replace(/\s+/g, '')}.tiro.auto`,
              industry: 'Tiro.ai 고객',
              businessRegistrationNumber: `TIRO-${Date.now()}`,
              address: '주소 미등록',
              phone: '전화번호 미등록',
              email: `contact@${analysis.companyName.toLowerCase().replace(/\s+/g, '')}.tiro.auto`,
              plan: 'basic',
              balance: 10000000, // 초기 1000만원
              isActive: true,
              settings: {
                maxEmployees: 100,
                allowSelfRegistration: false,
                annualCounselingLimit: 12
              }
            });
            console.log(`✅ New company created: ${company.name} (ID: ${company._id})`);
          }
        }

        // 2. companyName이 없거나 생성 실패 시 'Tiro.ai 임시' 회사 사용
        if (!company) {
          company = await Company.findOne({ name: 'Tiro.ai 임시' });

          // 'Tiro.ai 임시' 회사도 없으면 생성
          if (!company) {
            console.log(`📝 Creating 'Tiro.ai 임시' company`);
            company = await Company.create({
              name: 'Tiro.ai 임시',
              domain: 'tiro-temp.auto',
              industry: 'Tiro.ai 임시',
              businessRegistrationNumber: 'TIRO-TEMP-000',
              address: '주소 미등록',
              phone: '전화번호 미등록',
              email: 'temp@tiro.auto',
              plan: 'basic',
              balance: 10000000,
              isActive: true,
              settings: {
                maxEmployees: 1000,
                allowSelfRegistration: false,
                annualCounselingLimit: 12
              }
            });
            console.log(`✅ Tiro.ai 임시 company created`);
          }
        }

        if (!company) {
          return res.status(500).json({
            success: false,
            error: 'Failed to create or find company for Tiro.ai customer'
          });
        }

        employee = await User.create({
          name: analysis.customerName,
          email: `${analysis.customerName.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}@tiro.temp`,
          password: Math.random().toString(36).slice(-8), // 임시 비밀번호
          phone: customerPhone,
          company: company._id, // ObjectId 사용
          department: '미배정',
          role: 'employee',
          isActive: true
        });

        console.log(`✅ New employee created from Tiro.ai: ${employee.name}`);
      } else {
        company = await Company.findById(employee.company);
      }
    } else {
      return res.status(400).json({
        success: false,
        error: 'Customer name is required in analysis'
      });
    }

    // 2. 상담 세션 생성
    const sessionData = {
      employee: employee._id,
      company: company.name, // CounselingSession의 company는 String 타입
      appointmentDate: timestamp || new Date(),
      duration: duration || 50,
      status: 'completed', // Tiro.ai 기록은 이미 완료된 상담
      sessionType: 'individual',
      counselingMethod: 'phoneVideo', // Tiro.ai는 음성 상담
      topic: analysis.summary || '음성 상담',
      urgencyLevel: mapRiskLevelToUrgency(analysis.riskLevel),

      // 상담 기록 (공유 데이터에 저장)
      sessionRecord: {
        sharedContent: {
          sessionSummary: analysis.summary,
          generalTopics: analysis.tags || [],
          nextSteps: analysis.actionItems?.map(item => item.task) || [],
          followUpNeeded: (analysis.actionItems && analysis.actionItems.length > 0),
          progressNotes: `Tiro.ai 자동 분석: ${analysis.consultationType} 상담`
        }
      },

     // Tiro.ai 원본 데이터
      tiroData: {
        callId: tiroCallId,
        callTimestamp: timestamp,
        transcript: transcript,
        callDuration: duration,
        customerPhone: customerPhone,
        gptAnalysis: {
          summary: analysis.summary,
          consultationType: analysis.consultationType,
          mainIssues: analysis.mainIssues || [],
          emotionalState: analysis.emotionalState,
          financialMentions: analysis.financialMentions || [],
          recommendedServices: analysis.recommendedServices || {
            eap: { needed: false, priority: 'low', reason: '' },
            financial: { needed: false, priority: 'low', reason: '' }
          },
          futureTopics: analysis.futureTopics || [],
          actionItems: analysis.actionItems || [],
          riskLevel: analysis.riskLevel,
          tags: analysis.tags || [],
          analyzedAt: new Date()
        }
      },


      // 기본 정산 정보
      counselorRate: 50000, // 기본 상담료 (추후 조정 가능)
      isCharged: false,
      isPaidToCounselor: false
    };

    const session = await CounselingSession.create(sessionData);

    // 3. 회사 통계 업데이트
    if (company) {
      company.totalSessionsUsed = (company.totalSessionsUsed || 0) + 1;
      await company.save();
    }

    console.log(`✅ Tiro.ai session saved: ${session._id}`);

    res.status(201).json({
      success: true,
      message: 'Tiro.ai consultation session saved successfully',
      data: {
        sessionId: session._id,
        employeeId: employee._id,
        employeeName: employee.name,
        company: company.name, // 회사 이름 반환
        tiroCallId: tiroCallId,
        consultationType: analysis.consultationType,
        timestamp: timestamp
      }
    });

  } catch (error) {
    console.error('❌ Error saving Tiro.ai session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save Tiro.ai session',
      message: error.message
    });
  }
});

/**
 * GET /api/tiro/sessions
 * Tiro.ai 상담 기록 조회
 */
router.get('/sessions', async (req, res) => {
  try {
    const { limit = 50, page = 1 } = req.query;

    const sessions = await CounselingSession.find({
      'tiroData.callId': { $exists: true }
    })
      .populate('employee', 'name email phone')
      .sort({ 'tiroData.callTimestamp': -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await CounselingSession.countDocuments({
      'tiroData.callId': { $exists: true }
    });

    res.json({
      success: true,
      data: sessions,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('❌ Error fetching Tiro.ai sessions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch Tiro.ai sessions',
      message: error.message
    });
  }
});

/**
 * GET /api/tiro/sessions/:id
 * Tiro.ai 상담 기록 상세 조회
 */
router.get('/sessions/:id', async (req, res) => {
  try {
    const session = await CounselingSession.findById(req.params.id)
      .populate('employee', 'name email phone company department')
      .populate('counselor', 'name email specialization');

    if (!session || !session.tiroData?.callId) {
      return res.status(404).json({
        success: false,
        error: 'Tiro.ai session not found'
      });
    }

    res.json({
      success: true,
      data: session
    });
  } catch (error) {
    console.error('❌ Error fetching Tiro.ai session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch Tiro.ai session',
      message: error.message
    });
  }
});

/**
 * Helper function: Risk level to urgency mapping
 */
function mapRiskLevelToUrgency(riskLevel) {
  const mapping = {
    'low': 'low',
    'medium': 'medium',
    'high': 'high',
    'critical': 'critical'
  };
  return mapping[riskLevel] || 'medium';
}

module.exports = router;

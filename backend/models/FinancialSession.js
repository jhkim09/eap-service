const mongoose = require('mongoose');

// 재무상담 세션 스키마
const financialSessionSchema = new mongoose.Schema({
  // 기본 정보
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  financialAdvisor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false  // 초기 생성 시에는 필요 없음, 배정 시 설정
  },
  
  // 일정 정보
  scheduledDate: {
    type: Date,
    required: true
  },
  duration: {
    type: Number, // 분 단위
    default: 60
  },
  
  // 상담 유형
  sessionType: {
    type: String,
    enum: ['initial-consultation', 'portfolio-review', 'goal-planning', 'investment-advice', 'retirement-planning', 'insurance-planning', 'tax-planning'],
    required: true
  },
  
  // 상담 방식
  format: {
    type: String,
    enum: ['in-person', 'video-call', 'phone-call'],
    default: 'video-call'
  },
  
  // 상담 상태
  status: {
    type: String,
    enum: ['scheduled', 'in-progress', 'completed', 'cancelled', 'no-show'],
    default: 'scheduled'
  },
  
  // 상담 전 준비사항
  preparation: {
    documentsRequested: [String], // 요청 서류
    questionsToDiscuss: [String], // 논의할 질문들
    clientPreparation: { type: String } // 고객 준비사항
  },

  // 🆕 Arune 설문 데이터 (Phase 1)
  aruneSurvey: {
    completed: {
      type: Boolean,
      default: false
    },
    completedAt: Date,

    // 26개 질문 답변
    answers: {
      // FB (파인북) 11개
      'FB01-3': { type: Number, min: 1, max: 5 },  // 투자 민감도
      'FB02-1': { type: Number, min: 1, max: 4 },  // 보험 보장
      'FB05-1': { type: Number, min: 1, max: 4 },  // 수익률 기대치
      'FB05-3': { type: Number, min: 1, max: 5 },  // 투자수단 선호
      'FB16-2': { type: Number, min: 1, max: 4 },  // 투자손실 대응
      'FB21-1': { type: Number, min: 1, max: 2 },  // 보험 vs 저축
      'FB09-3': { type: Number, min: 1, max: 5 },  // 정보 습득
      'FB11-3': { type: Number, min: 1, max: 5 },  // 보험료 수준
      'FB12-1': { type: Number, min: 1, max: 5 },  // 보험 선택 기준
      'FB17-1': { type: Number, min: 1, max: 5 },  // 질환 인지
      'FB22-3': { type: Number, min: 1, max: 5 },  // 투자 선호도

      // ST02 (STEP02 확장) 15개
      'ST02-01': { type: Number, min: 1, max: 4 },  // 소득 내 지출
      'ST02-02': { type: Number, min: 1, max: 4 },  // 저축 vs 투자
      'ST02-06': { type: Number, min: 1, max: 4 },  // 상여금 활용
      'ST02-07': { type: Number, min: 1, max: 4 },  // 교육비 우선
      'ST02-08': { type: Number, min: 1, max: 4 },  // 여행비 절약
      'ST02-10': { type: Number, min: 1, max: 4 },  // 정기저축
      'ST02-13': { type: Number, min: 1, max: 4 },  // 가계부
      'ST02-14': { type: Number, min: 1, max: 4 },  // 은퇴준비
      'ST02-18': { type: Number, min: 1, max: 4 },  // 재무상황 인지
      'ST02-29': { type: Number, min: 1, max: 4 },  // 금융회사 수
      'ST02-32': { type: Number, min: 1, max: 4 },  // 소비 계획
      'ST02-40': { type: Number, min: 1, max: 4 },  // 퇴직연금
      'ST02-43': { type: Number, min: 1, max: 4 },  // 투자 지식
      'ST02-46': { type: Number, min: 1, max: 4 },  // 위험 감수
      'ST02-49': { type: Number, min: 1, max: 4 }   // 재무 목표
    },

    // 개인정보
    personalInfo: {
      birthYear: Number,
      gender: {
        type: String,
        enum: ['남성', '여성', '기타']
      },
      occupation: String,
      maritalStatus: {
        type: String,
        enum: ['미혼', '기혼', '이혼', '사별']
      }
    }
  },

  // 🆕 Arune 분석 결과 (Phase 1)
  aruneReportData: {
    analysisId: {
      type: String,
      unique: true,
      sparse: true
    },
    generatedAt: Date,

    // 4영역 점수
    scores: {
      spending: {
        type: Number,
        min: 0,
        max: 100
      },
      saving: {
        type: Number,
        min: 0,
        max: 100
      },
      investment: {
        type: Number,
        min: 0,
        max: 100
      },
      riskManagement: {
        type: Number,
        min: 0,
        max: 100
      },
      total: {
        type: Number,
        min: 0,
        max: 400
      }
    },

    // 동물형 캐릭터
    animalType: {
      type: String,
      enum: ['사자형', '황소형', '돼지형', '양형', '거북이형']
    },
    animalTypeDescription: String,

    // 인생시계
    lifeClock: {
      age: Number,
      timeString: String,      // "오후 3시 30분"
      phase: String,            // "중년기 진입"
      percentageComplete: Number // 0-100
    },

    // AI 추천사항
    recommendations: [{
      category: String,
      priority: {
        type: String,
        enum: ['high', 'medium', 'low']
      },
      title: String,
      description: String,
      actionItems: [String]
    }],

    // 원본 분석 데이터
    rawAnalysis: mongoose.Schema.Types.Mixed,

    // 🆕 B5 소책자 URL (Phase 2)
    bookletUrl: String,
    bookletGeneratedAt: Date
  },

  // 상담 내용 (완료 후 작성)
  sessionRecord: {
    // 🔓 공유 데이터 (직원과 상담사 모두 볼 수 있음)
    sharedContent: {
      mainTopics: [String], // 주요 논의사항
      currentSituation: { type: String }, // 현재 상황
      clientConcerns: [String], // 고객 우려사항
      generalRecommendations: [String], // 일반적인 권고사항
      actionItems: [String], // 실행 항목
      followUpNeeded: { type: Boolean, default: false },
      nextSessionDate: { type: Date },
      sessionSummary: { type: String } // 세션 요약
    },
    
    // 🔒 상담사 전용 데이터 (상담사만 볼 수 있음)
    advisorOnlyContent: {
      professionalAssessment: { type: String }, // 전문가 평가
      riskAnalysis: { type: String }, // 위험 분석
      confidentialNotes: { type: String }, // 기밀 메모
      advisorRecommendations: [String], // 전문가 권고사항
      clientPsychologicalState: { type: String }, // 고객 심리상태
      concernLevel: { 
        type: String, 
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'low'
      }
    }
  },
  
  // 제공된 자료
  materialsProvided: [{
    title: { type: String, required: true },
    type: { 
      type: String, 
      enum: ['report', 'presentation', 'calculator', 'guide', 'form'], 
      required: true 
    },
    description: { type: String },
    fileUrl: { type: String } // 파일 URL (선택사항)
  }],
  
  // 고객 만족도 (선택사항)
  clientFeedback: {
    rating: { 
      type: Number, 
      min: 1, 
      max: 5 
    },
    comments: { type: String },
    wouldRecommend: { type: Boolean }
  },
  
  // 비용 정보
  fee: {
    amount: { type: Number, default: 0 },
    currency: { type: String, default: 'KRW' },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'waived'],
      default: 'pending'
    }
  }
}, {
  timestamps: true
});

// 인덱스 설정 - 효율적인 조회를 위해
financialSessionSchema.index({ client: 1, scheduledDate: -1 });
financialSessionSchema.index({ financialAdvisor: 1, scheduledDate: -1 });
financialSessionSchema.index({ status: 1, scheduledDate: 1 });

// 가상 필드 - 상담 완료 여부
financialSessionSchema.virtual('isCompleted').get(function() {
  return this.status === 'completed';
});

// 가상 필드 - 예정된 상담인지
financialSessionSchema.virtual('isUpcoming').get(function() {
  return this.status === 'scheduled' && new Date(this.scheduledDate) > new Date();
});

// 🆕 권한 체크 메서드 (Phase 1)
financialSessionSchema.methods.canViewDetails = function(userId, userRole) {
  return (
    this.client.toString() === userId.toString() ||
    (this.financialAdvisor && this.financialAdvisor.toString() === userId.toString()) ||
    userRole === 'super-admin'
  );
};

financialSessionSchema.methods.canModifyRecord = function(userId, userRole) {
  if (userRole === 'super-admin') return true;
  if (this.financialAdvisor && this.financialAdvisor.toString() === userId.toString()) return true;
  return false;
};

module.exports = mongoose.model('FinancialSession', financialSessionSchema);
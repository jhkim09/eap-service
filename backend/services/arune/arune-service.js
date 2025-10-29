// Arune Financial Analysis Service
// 재무상담 세션의 설문 데이터를 분석하여 Arune 리포트 생성

const ScoreCalculator = require('./score-calculator');

class AruneService {
  constructor() {
    this.calculator = new ScoreCalculator();
  }

  /**
   * 설문 답변을 분석하여 완전한 Arune 리포트 데이터 생성
   * @param {Object} surveyData - 설문 답변 및 개인정보
   * @param {Object} surveyData.answers - 26개 질문 답변 (FB01-3, FB02-1, ..., ST02-49)
   * @param {Object} surveyData.personalInfo - 개인정보 (birthYear, gender, occupation, maritalStatus)
   * @returns {Object} - aruneReportData 형식의 분석 결과
   */
  analyzeFinancialProfile(surveyData) {
    const { answers, personalInfo } = surveyData;

    // 1️⃣ 4영역 점수 계산
    const scores = this.calculateAreaScores(answers);

    // 2️⃣ 동물형 캐릭터 결정
    const animalType = this.determineAnimalType(scores);

    // 3️⃣ 인생시계 계산
    const lifeClock = this.calculateLifeClock(personalInfo.birthYear);

    // 4️⃣ AI 추천사항 생성
    const recommendations = this.generateRecommendations(scores, animalType);

    // 5️⃣ 분석 ID 생성 (타임스탬프 기반)
    const analysisId = this.generateAnalysisId();

    return {
      analysisId,
      generatedAt: new Date(),
      scores,
      animalType: `${animalType}형`,
      animalTypeDescription: this.getAnimalDescription(animalType),
      lifeClock,
      recommendations,
      rawAnalysis: {
        detailedScores: this.getDetailedScores(answers),
        personalInfo
      }
    };
  }

  /**
   * 4영역 점수 계산 (지출, 저축, 투자, 위험관리)
   */
  calculateAreaScores(answers) {
    // FB 질문 → 투자, 위험관리
    // ST02 질문 → 지출, 저축

    const spending = this.calculateSpendingScore(answers);
    const saving = this.calculateSavingScore(answers);
    const investment = this.calculateInvestmentScore(answers);
    const riskManagement = this.calculateRiskManagementScore(answers);

    return {
      spending,
      saving,
      investment,
      riskManagement,
      total: spending + saving + investment + riskManagement
    };
  }

  /**
   * 지출 영역 점수 (0-100)
   * ST02-01, ST02-06, ST02-08, ST02-32 질문 기반
   */
  calculateSpendingScore(answers) {
    const spendingQuestions = ['ST02-01', 'ST02-06', 'ST02-08', 'ST02-32'];
    let totalScore = 0;
    let count = 0;

    spendingQuestions.forEach(qId => {
      if (answers[qId]) {
        // 1-4 점수 → 0-25 점수로 변환
        totalScore += (answers[qId] - 1) * 25;
        count++;
      }
    });

    return count > 0 ? Math.round(totalScore / count) : 50; // 기본값 50
  }

  /**
   * 저축 영역 점수 (0-100)
   * ST02-02, ST02-07, ST02-10, ST02-13, ST02-14, ST02-18, ST02-40 질문 기반
   */
  calculateSavingScore(answers) {
    const savingQuestions = ['ST02-02', 'ST02-07', 'ST02-10', 'ST02-13', 'ST02-14', 'ST02-18', 'ST02-40'];
    let totalScore = 0;
    let count = 0;

    savingQuestions.forEach(qId => {
      if (answers[qId]) {
        totalScore += (answers[qId] - 1) * 25;
        count++;
      }
    });

    return count > 0 ? Math.round(totalScore / count) : 50;
  }

  /**
   * 투자 영역 점수 (0-100)
   * FB01-3, FB05-1, FB05-3, FB16-2, FB22-3, ST02-43, ST02-46 질문 기반
   */
  calculateInvestmentScore(answers) {
    const investmentQuestions = [
      { id: 'FB01-3', max: 5 },
      { id: 'FB05-1', max: 4 },
      { id: 'FB05-3', max: 5 },
      { id: 'FB16-2', max: 4 },
      { id: 'FB22-3', max: 5 },
      { id: 'ST02-43', max: 4 },
      { id: 'ST02-46', max: 4 }
    ];

    let totalScore = 0;
    let count = 0;

    investmentQuestions.forEach(q => {
      if (answers[q.id]) {
        // 정규화: (value - 1) / (max - 1) * 100
        totalScore += ((answers[q.id] - 1) / (q.max - 1)) * 100;
        count++;
      }
    });

    return count > 0 ? Math.round(totalScore / count) : 50;
  }

  /**
   * 위험관리 영역 점수 (0-100)
   * FB02-1, FB09-3, FB11-3, FB12-1, FB17-1, FB21-1 질문 기반
   */
  calculateRiskManagementScore(answers) {
    const riskQuestions = [
      { id: 'FB02-1', max: 4 },
      { id: 'FB09-3', max: 5 },
      { id: 'FB11-3', max: 5 },
      { id: 'FB12-1', max: 5 },
      { id: 'FB17-1', max: 5 },
      { id: 'FB21-1', max: 2 }
    ];

    let totalScore = 0;
    let count = 0;

    riskQuestions.forEach(q => {
      if (answers[q.id]) {
        totalScore += ((answers[q.id] - 1) / (q.max - 1)) * 100;
        count++;
      }
    });

    return count > 0 ? Math.round(totalScore / count) : 50;
  }

  /**
   * 총점 기반 동물형 캐릭터 결정
   * 총점 = spending + saving + investment + riskManagement (0-400)
   */
  determineAnimalType(scores) {
    const total = scores.total;

    // 파인애플북 기준
    if (total >= 320) return '돼지';      // 80% 이상 - 공격적
    if (total >= 280) return '황소';      // 70-80% - 적극적
    if (total >= 240) return '사자';      // 60-70% - 균형적
    if (total >= 200) return '양';        // 50-60% - 보수적
    return '거북이';                      // 50% 미만 - 매우 보수적
  }

  /**
   * 동물형 캐릭터 설명
   */
  getAnimalDescription(animalType) {
    const descriptions = {
      '돼지': '탐욕에 따라 이리저리 움직이며 자신이 감당하기 힘든 위험을 짊어지는 유형입니다. 고위험 투자 전 충분한 학습과 위험 관리가 필요합니다.',
      '황소': '상승장에서 적극적으로 투자하여 수익을 추구하는 유형입니다. 주식형 펀드나 ETF 투자에 적합하며, 장기 투자 관점이 중요합니다.',
      '사자': '균형잡힌 투자로 안정적인 수익을 추구하는 유형입니다. 위험과 수익의 균형을 맞추며 체계적인 자산 배분을 추천합니다.',
      '양': '시장 변화에 수동적이고 두려움에 따라 보수적으로 투자하는 유형입니다. 원금보장형 상품 위주로 포트폴리오를 구성하는 것이 좋습니다.',
      '거북이': '손실을 극도로 회피하며 안전한 투자만을 선호하는 유형입니다. 정기예금, 적금 등 안전자산 중심의 자산 관리가 적합합니다.'
    };

    return descriptions[animalType] || '균형잡힌 투자성향을 보입니다.';
  }

  /**
   * 인생시계 계산 (파인애플북 공식)
   * 출생연도 기반으로 현재 나이와 인생 진행률 계산
   */
  calculateLifeClock(birthYear) {
    const currentYear = new Date().getFullYear();
    const age = currentYear - birthYear;

    // 기대수명 80세 기준
    const lifeExpectancy = 80;
    const percentageComplete = Math.min(Math.round((age / lifeExpectancy) * 100), 100);

    // 24시간 시계로 변환
    const totalMinutes = Math.round((age / lifeExpectancy) * 24 * 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    // 오전/오후 결정
    const period = hours < 12 ? '오전' : '오후';
    const displayHours = hours === 0 ? 12 : (hours > 12 ? hours - 12 : hours);
    const timeString = `${period} ${displayHours}시 ${minutes}분`;

    // 인생 단계 결정
    let phase;
    if (age < 20) phase = '청소년기';
    else if (age < 30) phase = '청년기';
    else if (age < 40) phase = '장년기 초반';
    else if (age < 50) phase = '중년기 진입';
    else if (age < 60) phase = '중년기';
    else if (age < 70) phase = '노년기 초반';
    else phase = '노년기';

    return {
      age,
      timeString,
      phase,
      percentageComplete
    };
  }

  /**
   * 4영역별 AI 추천사항 생성
   */
  generateRecommendations(scores, animalType) {
    return {
      spending: this.generateSpendingRecommendations(scores.spending),
      saving: this.generateSavingRecommendations(scores.saving),
      investment: this.generateInvestmentRecommendations(scores.investment, animalType),
      risk: this.generateRiskRecommendations(scores.riskManagement)
    };
  }

  generateSpendingRecommendations(score) {
    if (score >= 75) {
      return [
        '지출 관리가 매우 우수합니다',
        '현재 수준을 유지하되, 가끔 자신에게 보상하는 지출도 고려하세요',
        '장기 목표를 위한 지출 계획을 세워보세요'
      ];
    } else if (score >= 50) {
      return [
        '지출 관리가 양호한 편입니다',
        '고정비와 변동비를 명확히 구분하여 관리하세요',
        '월별 지출 예산을 설정하고 추적해보세요'
      ];
    } else {
      return [
        '지출 관리에 개선이 필요합니다',
        '3개월간 가계부를 작성하여 지출 패턴을 파악하세요',
        '불필요한 구독 서비스나 정기 결제를 점검하세요',
        '충동 구매를 줄이기 위해 24시간 규칙을 적용해보세요'
      ];
    }
  }

  generateSavingRecommendations(score) {
    if (score >= 75) {
      return [
        '저축 습관이 매우 좋습니다',
        '비상금은 충분히 확보되어 있는지 점검하세요',
        '여유 자금의 일부는 투자로 전환을 고려해보세요'
      ];
    } else if (score >= 50) {
      return [
        '저축 습관이 양호합니다',
        '월 소득의 20-30%를 저축 목표로 설정하세요',
        '자동이체를 활용하여 저축을 자동화하세요'
      ];
    } else {
      return [
        '저축 습관을 개선할 필요가 있습니다',
        '월급의 10%부터 시작하여 점진적으로 비율을 높이세요',
        '비상금 3-6개월치를 우선 목표로 설정하세요',
        '저축 전용 계좌를 개설하여 분리 관리하세요'
      ];
    }
  }

  generateInvestmentRecommendations(score, animalType) {
    const baseRecommendations = [];

    // 점수 기반 권장사항
    if (score >= 75) {
      baseRecommendations.push('투자에 대한 이해도가 높습니다');
      baseRecommendations.push('포트폴리오 분산을 통해 위험을 관리하세요');
    } else if (score >= 50) {
      baseRecommendations.push('투자 경험을 쌓아가는 단계입니다');
      baseRecommendations.push('소액으로 다양한 투자 경험을 쌓으세요');
    } else {
      baseRecommendations.push('투자 학습이 필요합니다');
      baseRecommendations.push('재무 서적이나 강의로 기초 지식을 쌓으세요');
    }

    // 동물형별 추가 권장사항
    switch (animalType) {
      case '돼지':
        baseRecommendations.push('고위험 투자 비중을 50% 이하로 제한하세요');
        baseRecommendations.push('레버리지 상품은 신중하게 접근하세요');
        break;
      case '황소':
        baseRecommendations.push('주식형 펀드나 ETF 투자가 적합합니다');
        baseRecommendations.push('시장 변동성에 대비한 장기 투자 전략을 세우세요');
        break;
      case '사자':
        baseRecommendations.push('주식 60% / 채권 40% 비율로 시작해보세요');
        baseRecommendations.push('정기적인 리밸런싱으로 균형을 유지하세요');
        break;
      case '양':
        baseRecommendations.push('채권형 펀드나 배당주 중심으로 구성하세요');
        baseRecommendations.push('원금보장형 ELS 상품도 고려해보세요');
        break;
      case '거북이':
        baseRecommendations.push('정기예금, 적금으로 안전하게 시작하세요');
        baseRecommendations.push('CMA 등 단기 금융상품 활용을 권장합니다');
        break;
    }

    return baseRecommendations;
  }

  generateRiskRecommendations(score) {
    if (score >= 75) {
      return [
        '위험 관리 의식이 매우 높습니다',
        '보험 포트폴리오를 정기적으로 점검하세요',
        '과도한 보장은 오히려 비효율적일 수 있으니 적정 수준을 유지하세요'
      ];
    } else if (score >= 50) {
      return [
        '위험 관리가 양호합니다',
        '실손보험, 종신보험, 연금보험의 3대 보험을 점검하세요',
        '중복 보장은 없는지 확인하고 정리하세요'
      ];
    } else {
      return [
        '위험 관리를 강화할 필요가 있습니다',
        '우선 실손의료보험부터 가입하세요',
        '가족의 생계를 책임진다면 정기보험을 고려하세요',
        '보험료는 월 소득의 10%를 초과하지 않도록 하세요'
      ];
    }
  }

  /**
   * 상세 점수 (디버깅용)
   */
  getDetailedScores(answers) {
    const detailed = {};
    Object.keys(answers).forEach(qId => {
      detailed[qId] = this.calculator.calculateQuestionScore(qId, answers[qId]);
    });
    return detailed;
  }

  /**
   * 분석 ID 생성 (타임스탬프 + 랜덤)
   */
  generateAnalysisId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `ARU-${timestamp}-${random}`.toUpperCase();
  }
}

module.exports = AruneService;

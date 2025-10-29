// 에이룬레포트 점수 계산 엔진
// Excel 분석 결과를 바탕으로 구현

class ScoreCalculator {
  constructor() {
    // Excel에서 추출한 질문별 점수 매핑 테이블
    this.questionMappings = {
      // FB01-3: 투자 민감도 (1=손실가능성, 2=유동성제약, 3=수수료, 4=세금, 5=물가상승률)
      'FB01-3': {
        question: '당신이 투자관련 의사결정을 할 때, 가장 민감하게 생각하는 것은 무엇인가요?',
        options: {
          1: { text: '손실가능성', score: 1, type: '손실' },
          2: { text: '유동성 제약', score: 2, type: '유동성' },
          3: { text: '수수료(비용)', score: 3, type: '비용' },
          4: { text: '세금', score: 4, type: '세금' },
          5: { text: '물가상승률', score: 5, type: '물가' }
        }
      },

      // FB02-1: 보험 보장 위험 (1=사망, 2=실손의료, 3=간병치료, 4=3대질환)
      'FB02-1': {
        question: '내가 보험으로 보장받고 싶은 위험요소는 무엇인가요?',
        options: {
          1: { text: '사망위험', score: 1, type: '사망' },
          2: { text: '실손의료비', score: 2, type: '의료' },
          3: { text: '간병치료', score: 3, type: '간병' },
          4: { text: '3대질환', score: 4, type: '큰병' }
        }
      },

      // FB05-1: 수익률 기대치 (1=1-4%, 2=-5~8%, 3=-10~15%, 4=-30~50%)
      'FB05-1': {
        question: '1년 후 다음과 같은 손실-수익 가능성을 가진 투자가 있다면, 당신의 선택은?',
        options: {
          1: { text: '최소1% 최대4%', score: 1, type: '안전' },
          2: { text: '최소-5% 최대8%', score: 2, type: '보통' },
          3: { text: '최소-10% 최대15%', score: 3, type: '적극' },
          4: { text: '최소-30% 최대50%', score: 4, type: '고위험' }
        }
      },

      // FB05-3: 투자수단 선호 (1=주식/채권, 2=펀드/ELS, 3=변액보험, etc)
      'FB05-3': {
        question: '목표 수익을 얻기 위해 가장 선호하는 투자수단은 무엇인가요?',
        options: {
          1: { text: '주식/채권', score: 1, type: '직접투자' },
          2: { text: '펀드/ELS', score: 2, type: '간접투자' },
          3: { text: '변액보험', score: 3, type: '보험형' },
          4: { text: '파생상품', score: 4, type: '파생' },
          5: { text: '대안투자', score: 5, type: '대안' }
        }
      },

      // FB16-2: 투자손실 대응 (1=전량매도, 2=일부매도, 3=보유, 4=추매)
      'FB16-2': {
        question: '증시가 하락해 투자의 가치가 20% 하락했다면 어떻게 할 것인가요?',
        options: {
          1: { text: '모든 주식을 판 뒤 MMF로 옮긴다', score: 1, type: '회피' },
          2: { text: '일부를 팔아 추가 손실을 피한다', score: 2, type: '방어' },
          3: { text: '추가 자금 없이 시장 반등을 기다린다', score: 3, type: '보유' },
          4: { text: '현 가격이 매력적이라 보고 주식을 더 산다', score: 4, type: '공격' }
        }
      },

      // FB21-1: 보험 vs 저축 선호 (1=보험, 2=저축)
      'FB21-1': {
        question: '위험을 회피하는 수단으로 보험과 저축 중 어느 것을 더 선호하십니까?',
        options: {
          1: { text: '보험', score: 1, type: '보험' },
          2: { text: '저축(충당금)', score: 2, type: '저축' }
        }
      },

      // FB09-3: 정보 습득 경로 (1=지인, 2=광고, 3=언론, 4=인터넷, 5=전문가)
      'FB09-3': {
        question: '투자 관련 정보를 얻는 주된 경로나 수단은 무엇인가요?',
        options: {
          1: { text: '주변지인', score: 1, type: '주변지인' },
          2: { text: '광고', score: 2, type: '광고' },
          3: { text: '언론매체', score: 3, type: '언론매체' },
          4: { text: '인터넷', score: 4, type: '인터넷' },
          5: { text: '금융전문가', score: 5, type: '전문가' },
          6: { text: '금융서적', score: 4, type: '서적' },
          7: { text: '재테크강의', score: 4, type: '강의' }
        }
      },

      // FB11-3: 현재 보험 적정성 (1=과도, 2=적당, 3=부족)
      'FB11-3': {
        question: '현재 보유하고 있는 보험상품에 대하여 당신은 어떻게 생각하세요?',
        options: {
          1: { text: '과도하다', score: 1, type: '과도' },
          2: { text: '적당하다', score: 2, type: '적정' },
          3: { text: '부족하다', score: 3, type: '부족' }
        }
      },

      // FB12-1: 보험 선택 기준 (1=보험료, 2=납입기간, 3=보장기간, 4=환급금, 5=보장내용)
      'FB12-1': {
        question: '보장성 보험 가입 시 고려하는 우선 순위는 무엇인가요?',
        options: {
          1: { text: '보험료', score: 1, type: '보험료' },
          2: { text: '납입기간', score: 2, type: '납입기간' },
          3: { text: '보장기간', score: 3, type: '보장기간' },
          4: { text: '환급금', score: 4, type: '환급금' },
          5: { text: '보장내용', score: 5, type: '보장내용' },
          6: { text: '보험금', score: 4, type: '보험금' },
          7: { text: '브랜드(안정성)', score: 3, type: '브랜드' }
        }
      },

      // FB17-1: 가족력 질병 (1=암, 2=뇌심장, 3=당뇨고혈압, 4=치매, 5=없음)
      'FB17-1': {
        question: '다음 중 가족력이 의심되는 질병이 있습니까?',
        options: {
          1: { text: '암', score: 4, type: '암가족력' },
          2: { text: '뇌/심장혈관', score: 3, type: '뇌심장가족력' },
          3: { text: '당뇨/고혈압', score: 3, type: '당뇨고혈압가족력' },
          4: { text: '치매', score: 2, type: '치매가족력' },
          5: { text: '없다', score: 1, type: '가족력없음' },
          6: { text: '기타', score: 2, type: '기타가족력' }
        }
      },

      // FB22-3: 투자상품 기대 수익 (1=주식/채권, 2=펀드/ELS, 3=변액보험, 4=파생상품, 7=없음)
      'FB22-3': {
        question: '현재 가입 중이거나 가입하려는 투자상품 중 가장 높은 수익이 기대되는 것은 무엇인가요?',
        options: {
          1: { text: '주식/채권', score: 4, type: '직접투자기대' },
          2: { text: '펀드/ELS', score: 3, type: '간접투자기대' },
          3: { text: '변액보험', score: 2, type: '보험투자기대' },
          4: { text: '파생상품(선물/옵션)', score: 5, type: '파생투자기대' },
          5: { text: '대안투자', score: 4, type: '대안투자기대' },
          6: { text: '계', score: 1, type: '저축기대' },
          7: { text: '없음', score: 1, type: '투자없음' }
        }
      },

      // === STEP 02 추가 질문들 (핵심 15개) ===

      // ST02-01: 소득 내 지출 관리
      'ST02-01': {
        question: '소득안에서 지출하는 편인가요?',
        options: {
          1: { text: '그렇다', score: 1, type: '절약형' },
          2: { text: '거의그렇다', score: 2, type: '보통관리' },
          3: { text: '아니다', score: 3, type: '소비형' },
          4: { text: '전혀아니다', score: 4, type: '과소비형' }
        }
      },

      // ST02-02: 저축 방법 선호도
      'ST02-02': {
        question: '돈을 모으는 방법으로 가장 선호하는 것은 무엇인가요?',
        options: {
          1: { text: '예적금', score: 1, type: '안전저축' },
          2: { text: '투자상품', score: 4, type: '적극투자' },
          3: { text: '보험상품', score: 2, type: '보험저축' },
          4: { text: '부동산', score: 3, type: '실물투자' }
        }
      },

      // ST02-06: 지출 초과시 대처법
      'ST02-06': {
        question: '지출이 소득을 초과하게 되면 어떻게 대처를 하실건가요?',
        options: {
          1: { text: '마이너스통장', score: 2, type: '단기대출' },
          2: { text: '대출활용', score: 4, type: '적극대출' },
          3: { text: '상여금활용', score: 1, type: '계획적관리' },
          4: { text: '지출줄이기', score: 1, type: '절약형' }
        }
      },

      // ST02-07: 지출 우선순위 (긍정적)
      'ST02-07': {
        question: '다음 중 가장 아낌없이 쓸 수 있는 지출항목은 무엇인가요?',
        options: {
          1: { text: '여행', score: 3, type: '경험소비' },
          2: { text: '외식', score: 2, type: '일상소비' },
          3: { text: '문화생활비', score: 3, type: '문화소비' },
          4: { text: '교육비', score: 1, type: '투자소비' }
        }
      },

      // ST02-08: 지출 절약 우선순위 (부정적)
      'ST02-08': {
        question: '가계형편이 어려워지면 가장 먼저 줄이고 싶은 지출항목은 무엇인가요?',
        options: {
          1: { text: '여행', score: 1, type: '합리적절약' },
          2: { text: '외식', score: 1, type: '합리적절약' },
          3: { text: '문화생활비', score: 2, type: '선택적절약' },
          4: { text: '교육비', score: 4, type: '과도한절약' }
        }
      },

      // ST02-10: 정기저축 선호도
      'ST02-10': {
        question: '정기적으로 저축하는 것을 선호하는 편인가요?',
        options: {
          1: { text: '그렇다', score: 1, type: '계획저축' },
          2: { text: '아니다', score: 3, type: '자유저축' }
        }
      },

      // ST02-13: 가계부 관리
      'ST02-13': {
        question: '가계부를 적으시나요?',
        options: {
          1: { text: '그렇다', score: 1, type: '체계적관리' },
          2: { text: '아니다', score: 3, type: '자유관리' }
        }
      },

      // ST02-14: 은퇴준비 의식
      'ST02-14': {
        question: '지금 당장 은퇴 준비가 필요하다고 생각합니까?',
        options: {
          1: { text: '예', score: 1, type: '미래계획형' },
          2: { text: '아니오', score: 3, type: '현재중심형' }
        }
      },

      // ST02-18: 정기지출 파악도
      'ST02-18': {
        question: '매월 정기적으로 지출되는 생활비, 교육비, 용돈, 보험료, 이자 등이 얼마인지 알고 있습니까?',
        options: {
          1: { text: '정확히 안다', score: 1, type: '정확관리' },
          2: { text: '대략 안다', score: 2, type: '대략관리' },
          3: { text: '잘 모른다', score: 4, type: '무관리' }
        }
      },

      // ST02-29: 금융회사 거래 수
      'ST02-29': {
        question: '내가 거래하는 금융회사(은행, 증권, 보험)의 수는 몇 개인가요?',
        options: {
          1: { text: '1-2개', score: 1, type: '단순관리' },
          2: { text: '3-5개', score: 2, type: '보통관리' },
          3: { text: '6-10개', score: 3, type: '다양관리' },
          4: { text: '10개 이상', score: 4, type: '복잡관리' }
        }
      },

      // ST02-32: 계획적 소비
      'ST02-32': {
        question: '장보러 갈 때 미리 세운 계획에 따라 구입하는 편인가요?',
        options: {
          1: { text: '그렇다', score: 1, type: '계획소비' },
          2: { text: '아니다', score: 3, type: '충동소비' }
        }
      },

      // ST02-40: 퇴직연금 가입 여부
      'ST02-40': {
        question: '현재 퇴직금 또는 퇴직연금에 가입되어 있습니까?',
        options: {
          1: { text: '퇴직금', score: 2, type: '기본보장' },
          2: { text: '퇴직연금(DC형)', score: 1, type: '적극연금' },
          3: { text: '퇴직연금(DB형)', score: 1, type: '안정연금' },
          4: { text: '해당없음', score: 4, type: '무보장' }
        }
      },

      // ST02-42: 금융정보 관심도
      'ST02-42': {
        question: '금융, 재테크 관련 정보에 관심이 많은 편인가요?',
        options: {
          1: { text: '매우 그렇다', score: 1, type: '적극관심' },
          2: { text: '그렇다', score: 2, type: '보통관심' },
          3: { text: '보통이다', score: 3, type: '소극관심' },
          4: { text: '관심없다', score: 4, type: '무관심' }
        }
      },

      // ST02-51: 가족력 질병 (당뇨고혈압 외)
      'ST02-51': {
        question: '본인이나 가족 중에 암, 뇌졸중, 심근경색 등 중대질병 병력이 있습니까?',
        options: {
          1: { text: '본인', score: 5, type: '본인병력' },
          2: { text: '가족', score: 3, type: '가족병력' },
          3: { text: '둘다', score: 4, type: '높은위험' },
          4: { text: '없음', score: 1, type: '낮은위험' }
        }
      },

      // ST02-56: 재무목표 우선순위
      'ST02-56': {
        question: '앞으로 가장 중요하게 생각하는 재무목표는 무엇인가요?',
        options: {
          1: { text: '내집마련', score: 3, type: '주택목표' },
          2: { text: '자녀교육', score: 2, type: '교육목표' },
          3: { text: '은퇴준비', score: 1, type: '은퇴목표' },
          4: { text: '여가생활', score: 4, type: '여가목표' }
        }
      }
    };
  }

  // 개별 질문 점수 계산
  calculateQuestionScore(questionId, answerValue) {
    const mapping = this.questionMappings[questionId];
    
    if (!mapping) {
      console.warn(`⚠️ 질문 ${questionId}에 대한 매핑 정보가 없습니다.`);
      return { score: 0, type: 'unknown', text: '' };
    }

    const answer = mapping.options[answerValue];
    
    if (!answer) {
      console.warn(`⚠️ 질문 ${questionId}의 답변 ${answerValue}이 유효하지 않습니다.`);
      return { score: 0, type: 'unknown', text: '' };
    }

    return {
      questionId,
      question: mapping.question,
      score: answer.score,
      type: answer.type,
      text: answer.text
    };
  }

  // 전체 답변 점수 계산
  calculateTotalScores(answers) {
    console.log('📊 점수 계산 시작...');
    
    const results = {
      individual: {},  // 개별 질문 점수
      categories: {},  // 카테고리별 점수
      total: 0,       // 총점
      profile: null   // 최종 프로필
    };

    // 개별 질문 점수 계산
    Object.keys(answers).forEach(questionId => {
      const answerValue = answers[questionId];
      const scoreResult = this.calculateQuestionScore(questionId, answerValue);
      
      results.individual[questionId] = scoreResult;
      
      // 카테고리별 점수 집계
      if (!results.categories[scoreResult.type]) {
        results.categories[scoreResult.type] = {
          score: 0,
          count: 0,
          questions: []
        };
      }
      
      results.categories[scoreResult.type].score += scoreResult.score;
      results.categories[scoreResult.type].count += 1;
      results.categories[scoreResult.type].questions.push(questionId);
      
      results.total += scoreResult.score;
    });

    // 프로필 생성
    results.profile = this.generateProfile(results);
    
    console.log('✅ 점수 계산 완료!');
    return results;
  }

  // 프로필 생성 (Excel의 "돼지형" 등 캐릭터 로직)
  generateProfile(results) {
    const categories = results.categories;
    const total = results.total;
    
    // 투자 성향 분석
    let investmentStyle = '보수형';
    let riskProfile = '안전형';
    let animalType = '양';  // 기본값

    // 점수 기반 투자 성향 결정
    if (total >= 25) {
      investmentStyle = '공격투자형';
      riskProfile = '고위험';
      animalType = '돼지';
    } else if (total >= 20) {
      investmentStyle = '적극투자형';  
      riskProfile = '중고위험';
      animalType = '황소';
    } else if (total >= 15) {
      investmentStyle = '균형투자형';
      riskProfile = '중위험'; 
      animalType = '사자';
    } else {
      investmentStyle = '보수투자형';
      riskProfile = '저위험';
      animalType = '양';
    }

    // 특별 케이스 처리
    if (categories['손실'] && categories['손실'].score >= 3) {
      riskProfile = '손실회피형';
      animalType = '거북이';
    }
    
    if (categories['물가'] && categories['물가'].score >= 4) {
      investmentStyle = '인플레이션헤지형';
    }

    return {
      investmentStyle,
      riskProfile,
      animalType,
      totalScore: total,
      dominantCategories: this.getDominantCategories(categories),
      description: this.generateDescription(investmentStyle, riskProfile, animalType)
    };
  }

  // 주요 카테고리 추출
  getDominantCategories(categories) {
    return Object.keys(categories)
      .map(type => ({
        type,
        score: categories[type].score,
        count: categories[type].count,
        average: categories[type].score / categories[type].count
      }))
      .sort((a, b) => b.average - a.average)
      .slice(0, 3);
  }

  // 개인화된 설명 생성
  generateDescription(investmentStyle, riskProfile, animalType) {
    const descriptions = {
      '돼지': '탐욕에 따라 이리저리 움직이며 자신이 감당하기 힘든 위험을 짊어지는 유형입니다.',
      '황소': '상승장에서 적극적으로 투자하여 수익을 추구하는 유형입니다.',
      '사자': '균형잡힌 투자로 안정적인 수익을 추구하는 유형입니다.',
      '양': '시장 변화에 수동적이고 두려움에 따라 보수적으로 투자하는 유형입니다.',
      '거북이': '손실을 극도로 회피하며 안전한 투자만을 선호하는 유형입니다.'
    };

    return descriptions[animalType] || '균형잡힌 투자성향을 보입니다.';
  }

  // 추천 상품 생성 (간단한 버전)
  generateRecommendations(profile) {
    const recommendations = [];
    
    switch(profile.animalType) {
      case '돼지':
        recommendations.push('고위험 투자 전 충분한 학습이 필요합니다');
        recommendations.push('분산투자를 통한 위험 관리를 권장합니다');
        break;
      case '황소':
        recommendations.push('주식형 펀드 또는 ETF 투자 적합');
        recommendations.push('장기투자 관점에서 접근하세요');
        break;
      case '양':
        recommendations.push('원금보장형 상품 위주로 구성');
        recommendations.push('정기예금, 적금 등 안전자산 활용');
        break;
      default:
        recommendations.push('균형잡힌 포트폴리오 구성을 권장합니다');
    }
    
    return recommendations;
  }
}

module.exports = ScoreCalculator;
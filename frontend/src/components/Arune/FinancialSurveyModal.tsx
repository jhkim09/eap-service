import React, { useState } from 'react';
import { MomentumTheme } from '../../styles/MomentumTheme';
import { ChevronLeft, ChevronRight, Send } from 'lucide-react';

// 26개 질문 데이터 구조
const SURVEY_QUESTIONS = {
  // FB 질문 (11개) - 파인북 재무설계
  FB: [
    {
      id: 'FB01-3',
      question: '투자 관련 의사결정을 할 때, 가장 민감하게 생각하는 것은?',
      options: [
        { value: 1, label: '손실 가능성' },
        { value: 2, label: '유동성 제약' },
        { value: 3, label: '수수료(비용)' },
        { value: 4, label: '세금' },
        { value: 5, label: '물가상승률' }
      ]
    },
    {
      id: 'FB02-1',
      question: '보험으로 보장받고 싶은 위험요소는?',
      options: [
        { value: 1, label: '사망위험' },
        { value: 2, label: '실손의료비' },
        { value: 3, label: '간병치료' },
        { value: 4, label: '3대질환' }
      ]
    },
    {
      id: 'FB05-1',
      question: '1년 후 다음과 같은 손실-수익 가능성을 가진 투자가 있다면?',
      options: [
        { value: 1, label: '최소 1% ~ 최대 4%' },
        { value: 2, label: '최소 -5% ~ 최대 8%' },
        { value: 3, label: '최소 -10% ~ 최대 15%' },
        { value: 4, label: '최소 -30% ~ 최대 50%' }
      ]
    },
    {
      id: 'FB05-3',
      question: '목표 수익을 얻기 위해 가장 선호하는 투자수단은?',
      options: [
        { value: 1, label: '주식/채권' },
        { value: 2, label: '펀드/ELS' },
        { value: 3, label: '변액보험' },
        { value: 4, label: '파생상품' },
        { value: 5, label: '대안투자' }
      ]
    },
    {
      id: 'FB16-2',
      question: '증시가 하락해 투자의 가치가 20% 하락했다면?',
      options: [
        { value: 1, label: '모든 주식을 팔고 MMF로 옮긴다' },
        { value: 2, label: '일부를 팔아 추가 손실을 피한다' },
        { value: 3, label: '추가 자금 없이 시장 반등을 기다린다' },
        { value: 4, label: '현 가격이 매력적이라 보고 주식을 더 산다' }
      ]
    },
    {
      id: 'FB21-1',
      question: '위험을 회피하는 수단으로 보험과 저축 중 어느 것을 선호하십니까?',
      options: [
        { value: 1, label: '보험' },
        { value: 2, label: '저축(충당금)' }
      ]
    },
    {
      id: 'FB09-3',
      question: '투자 관련 정보를 얻는 주된 경로나 수단은?',
      options: [
        { value: 1, label: '주변 지인' },
        { value: 2, label: '광고' },
        { value: 3, label: '언론매체' },
        { value: 4, label: '인터넷' },
        { value: 5, label: '금융전문가' }
      ]
    },
    {
      id: 'FB11-3',
      question: '현재 보유하고 있는 보험상품에 대하여 어떻게 생각하세요?',
      options: [
        { value: 1, label: '과도하다' },
        { value: 2, label: '적당하다' },
        { value: 3, label: '부족하다' },
        { value: 4, label: '없다' },
        { value: 5, label: '모르겠다' }
      ]
    },
    {
      id: 'FB12-1',
      question: '보장성 보험 가입 시 고려하는 우선 순위는?',
      options: [
        { value: 1, label: '보험료' },
        { value: 2, label: '납입기간' },
        { value: 3, label: '보장기간' },
        { value: 4, label: '환급금' },
        { value: 5, label: '보장내용' }
      ]
    },
    {
      id: 'FB17-1',
      question: '본인이나 가족 중 보험가입에 영향을 줄 수 있는 질환이나 병력이 있습니까?',
      options: [
        { value: 1, label: '없다' },
        { value: 2, label: '고혈압' },
        { value: 3, label: '당뇨' },
        { value: 4, label: '암' },
        { value: 5, label: '기타 질환' }
      ]
    },
    {
      id: 'FB22-3',
      question: '다음 중 가장 선호하는 투자 방식은?',
      options: [
        { value: 1, label: '원금보장형' },
        { value: 2, label: '저위험 저수익' },
        { value: 3, label: '중위험 중수익' },
        { value: 4, label: '고위험 고수익' },
        { value: 5, label: '초고위험 초고수익' }
      ]
    }
  ],

  // ST02 질문 (15개) - STEP02 재무태도
  ST02: [
    {
      id: 'ST02-01',
      question: '소득 범위 내에서 지출하려고 노력한다',
      options: [
        { value: 1, label: '전혀 그렇지 않다' },
        { value: 2, label: '그렇지 않다' },
        { value: 3, label: '그렇다' },
        { value: 4, label: '매우 그렇다' }
      ]
    },
    {
      id: 'ST02-02',
      question: '저축보다 투자에 더 관심이 많다',
      options: [
        { value: 1, label: '전혀 그렇지 않다' },
        { value: 2, label: '그렇지 않다' },
        { value: 3, label: '그렇다' },
        { value: 4, label: '매우 그렇다' }
      ]
    },
    {
      id: 'ST02-06',
      question: '상여금이나 보너스는 저축하거나 투자한다',
      options: [
        { value: 1, label: '전혀 그렇지 않다' },
        { value: 2, label: '그렇지 않다' },
        { value: 3, label: '그렇다' },
        { value: 4, label: '매우 그렇다' }
      ]
    },
    {
      id: 'ST02-07',
      question: '자녀 교육비를 최우선으로 생각한다',
      options: [
        { value: 1, label: '전혀 그렇지 않다' },
        { value: 2, label: '그렇지 않다' },
        { value: 3, label: '그렇다' },
        { value: 4, label: '매우 그렇다' }
      ]
    },
    {
      id: 'ST02-08',
      question: '여행이나 여가 활동비를 절약하려고 노력한다',
      options: [
        { value: 1, label: '전혀 그렇지 않다' },
        { value: 2, label: '그렇지 않다' },
        { value: 3, label: '그렇다' },
        { value: 4, label: '매우 그렇다' }
      ]
    },
    {
      id: 'ST02-10',
      question: '정기적으로 저축을 하고 있다',
      options: [
        { value: 1, label: '전혀 그렇지 않다' },
        { value: 2, label: '그렇지 않다' },
        { value: 3, label: '그렇다' },
        { value: 4, label: '매우 그렇다' }
      ]
    },
    {
      id: 'ST02-13',
      question: '가계부를 작성하거나 지출을 기록한다',
      options: [
        { value: 1, label: '전혀 그렇지 않다' },
        { value: 2, label: '그렇지 않다' },
        { value: 3, label: '그렇다' },
        { value: 4, label: '매우 그렇다' }
      ]
    },
    {
      id: 'ST02-14',
      question: '은퇴 후를 위한 준비를 하고 있다',
      options: [
        { value: 1, label: '전혀 그렇지 않다' },
        { value: 2, label: '그렇지 않다' },
        { value: 3, label: '그렇다' },
        { value: 4, label: '매우 그렇다' }
      ]
    },
    {
      id: 'ST02-18',
      question: '나의 재무 상황을 잘 알고 있다',
      options: [
        { value: 1, label: '전혀 그렇지 않다' },
        { value: 2, label: '그렇지 않다' },
        { value: 3, label: '그렇다' },
        { value: 4, label: '매우 그렇다' }
      ]
    },
    {
      id: 'ST02-29',
      question: '3개 이상의 금융회사를 이용하고 있다',
      options: [
        { value: 1, label: '전혀 그렇지 않다' },
        { value: 2, label: '그렇지 않다' },
        { value: 3, label: '그렇다' },
        { value: 4, label: '매우 그렇다' }
      ]
    },
    {
      id: 'ST02-32',
      question: '소비를 미리 계획하고 실행한다',
      options: [
        { value: 1, label: '전혀 그렇지 않다' },
        { value: 2, label: '그렇지 않다' },
        { value: 3, label: '그렇다' },
        { value: 4, label: '매우 그렇다' }
      ]
    },
    {
      id: 'ST02-40',
      question: '퇴직연금에 가입하고 있다',
      options: [
        { value: 1, label: '전혀 그렇지 않다' },
        { value: 2, label: '그렇지 않다' },
        { value: 3, label: '그렇다' },
        { value: 4, label: '매우 그렇다' }
      ]
    },
    {
      id: 'ST02-43',
      question: '투자에 대한 지식과 경험이 있다',
      options: [
        { value: 1, label: '전혀 그렇지 않다' },
        { value: 2, label: '그렇지 않다' },
        { value: 3, label: '그렇다' },
        { value: 4, label: '매우 그렇다' }
      ]
    },
    {
      id: 'ST02-46',
      question: '높은 수익을 위해 위험을 감수할 수 있다',
      options: [
        { value: 1, label: '전혀 그렇지 않다' },
        { value: 2, label: '그렇지 않다' },
        { value: 3, label: '그렇다' },
        { value: 4, label: '매우 그렇다' }
      ]
    },
    {
      id: 'ST02-49',
      question: '명확한 재무 목표를 가지고 있다',
      options: [
        { value: 1, label: '전혀 그렇지 않다' },
        { value: 2, label: '그렇지 않다' },
        { value: 3, label: '그렇다' },
        { value: 4, label: '매우 그렇다' }
      ]
    }
  ]
};

interface FinancialSurveyModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  onSurveyComplete: (analysis: any) => void;
}

const FinancialSurveyModal: React.FC<FinancialSurveyModalProps> = ({
  isOpen,
  onClose,
  sessionId,
  onSurveyComplete
}) => {
  const [currentSection, setCurrentSection] = useState<'info' | 'FB' | 'ST02'>('info');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [personalInfo, setPersonalInfo] = useState({
    birthYear: '',
    gender: '',
    occupation: '',
    maritalStatus: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // 전체 질문 수 계산
  const totalQuestions = SURVEY_QUESTIONS.FB.length + SURVEY_QUESTIONS.ST02.length;
  const answeredQuestions = Object.keys(answers).length;
  const progressPercentage = (answeredQuestions / totalQuestions) * 100;

  // 현재 섹션의 질문들
  const getCurrentQuestions = () => {
    if (currentSection === 'FB') return SURVEY_QUESTIONS.FB;
    if (currentSection === 'ST02') return SURVEY_QUESTIONS.ST02;
    return [];
  };

  const currentQuestions = getCurrentQuestions();
  const currentQuestion = currentQuestions[currentQuestionIndex];

  // 답변 선택
  const handleAnswerSelect = (questionId: string, value: number) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  // 다음 질문
  const handleNext = () => {
    if (currentQuestionIndex < currentQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // 섹션 완료 → 다음 섹션으로
      if (currentSection === 'FB') {
        setCurrentSection('ST02');
        setCurrentQuestionIndex(0);
      }
    }
  };

  // 이전 질문
  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    } else {
      // 섹션의 첫 질문 → 이전 섹션으로
      if (currentSection === 'ST02') {
        setCurrentSection('FB');
        setCurrentQuestionIndex(SURVEY_QUESTIONS.FB.length - 1);
      } else if (currentSection === 'FB') {
        setCurrentSection('info');
      }
    }
  };

  // 설문 제출
  const handleSubmit = async () => {
    // 검증
    if (!personalInfo.birthYear || !personalInfo.gender) {
      setError('개인정보(출생연도, 성별)를 입력해주세요.');
      return;
    }

    if (answeredQuestions < totalQuestions) {
      setError(`모든 질문에 답변해주세요. (${answeredQuestions}/${totalQuestions})`);
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch(`/api/financial-sessions/${sessionId}/arune-survey`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          answers,
          personalInfo: {
            ...personalInfo,
            birthYear: parseInt(personalInfo.birthYear)
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '설문 제출 실패');
      }

      const data = await response.json();
      onSurveyComplete(data.analysis);
      onClose();
    } catch (err: any) {
      setError(err.message || '설문 제출 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 개인정보 입력 화면
  const renderPersonalInfoSection = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          Arune 재무분석 설문
        </h3>
        <p className="text-gray-600">
          개인 맞춤형 재무 분석을 위해 기본 정보를 입력해주세요
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            출생연도 *
          </label>
          <input
            type="number"
            placeholder="예: 1990"
            value={personalInfo.birthYear}
            onChange={(e) => setPersonalInfo({ ...personalInfo, birthYear: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            min="1940"
            max={new Date().getFullYear()}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            성별 *
          </label>
          <select
            value={personalInfo.gender}
            onChange={(e) => setPersonalInfo({ ...personalInfo, gender: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">선택해주세요</option>
            <option value="남성">남성</option>
            <option value="여성">여성</option>
            <option value="기타">기타</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            직업 (선택)
          </label>
          <input
            type="text"
            placeholder="예: 회사원"
            value={personalInfo.occupation}
            onChange={(e) => setPersonalInfo({ ...personalInfo, occupation: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            결혼 상태 (선택)
          </label>
          <select
            value={personalInfo.maritalStatus}
            onChange={(e) => setPersonalInfo({ ...personalInfo, maritalStatus: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">선택해주세요</option>
            <option value="미혼">미혼</option>
            <option value="기혼">기혼</option>
            <option value="이혼">이혼</option>
            <option value="사별">사별</option>
          </select>
        </div>
      </div>

      <button
        onClick={() => {
          if (personalInfo.birthYear && personalInfo.gender) {
            setCurrentSection('FB');
          } else {
            setError('출생연도와 성별은 필수 항목입니다.');
          }
        }}
        className="w-full px-6 py-3 text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          background: personalInfo.birthYear && personalInfo.gender
            ? MomentumTheme.button.primary.background
            : '#9ca3af',
          boxShadow: personalInfo.birthYear && personalInfo.gender
            ? MomentumTheme.button.primary.boxShadow
            : 'none'
        }}
        disabled={!personalInfo.birthYear || !personalInfo.gender}
      >
        설문 시작하기
      </button>
    </div>
  );

  // 질문 화면
  const renderQuestionSection = () => {
    if (!currentQuestion) return null;

    const isAnswered = answers[currentQuestion.id] !== undefined;
    const canGoNext = isAnswered;
    const isLastQuestion =
      currentSection === 'ST02' &&
      currentQuestionIndex === SURVEY_QUESTIONS.ST02.length - 1;

    return (
      <div className="space-y-6">
        {/* 진행률 */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>
              {currentSection === 'FB' ? 'Part 1: 투자 성향' : 'Part 2: 재무 태도'}
            </span>
            <span>
              {answeredQuestions} / {totalQuestions} 완료
            </span>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-blue-600 h-2 transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* 질문 */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="mb-6">
            <div className="text-sm text-gray-500 mb-2">
              질문 {answeredQuestions + 1} / {totalQuestions}
            </div>
            <h4 className="text-lg font-semibold text-gray-900">
              {currentQuestion.question}
            </h4>
          </div>

          {/* 선택지 */}
          <div className="space-y-3">
            {currentQuestion.options.map((option) => (
              <button
                key={option.value}
                onClick={() => handleAnswerSelect(currentQuestion.id, option.value)}
                className={`w-full px-4 py-3 text-left rounded-lg border-2 transition-all ${
                  answers[currentQuestion.id] === option.value
                    ? 'border-blue-500 bg-blue-50 text-blue-900'
                    : 'border-gray-200 hover:border-gray-300 bg-white text-gray-700'
                }`}
              >
                <div className="flex items-center">
                  <div
                    className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                      answers[currentQuestion.id] === option.value
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300'
                    }`}
                  >
                    {answers[currentQuestion.id] === option.value && (
                      <div className="w-2 h-2 bg-white rounded-full" />
                    )}
                  </div>
                  <span className="font-medium">{option.label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 네비게이션 버튼 */}
        <div className="flex justify-between gap-4">
          <button
            onClick={handlePrevious}
            disabled={currentSection === 'FB' && currentQuestionIndex === 0}
            className="px-6 py-3 rounded-lg border-2 border-gray-300 bg-white text-gray-700 font-semibold transition-all hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            이전
          </button>

          {isLastQuestion ? (
            <button
              onClick={handleSubmit}
              disabled={!canGoNext || isSubmitting}
              className="flex-1 px-6 py-3 text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              style={{
                background: canGoNext && !isSubmitting
                  ? MomentumTheme.button.primary.background
                  : '#9ca3af',
                boxShadow: canGoNext && !isSubmitting
                  ? MomentumTheme.button.primary.boxShadow
                  : 'none'
              }}
            >
              {isSubmitting ? (
                '제출 중...'
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  분석 결과 확인
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleNext}
              disabled={!canGoNext}
              className="flex-1 px-6 py-3 text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              style={{
                background: canGoNext
                  ? MomentumTheme.button.primary.background
                  : '#9ca3af',
                boxShadow: canGoNext
                  ? MomentumTheme.button.primary.boxShadow
                  : 'none'
              }}
            >
              다음
              <ChevronRight className="w-4 h-4 ml-2" />
            </button>
          )}
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto mx-4">
        <div className="p-6">
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              {currentSection === 'info' && '개인정보 입력'}
              {currentSection === 'FB' && 'Part 1: 투자 성향 분석'}
              {currentSection === 'ST02' && 'Part 2: 재무 태도 분석'}
            </h2>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          {/* Content */}
          {currentSection === 'info' && renderPersonalInfoSection()}
          {(currentSection === 'FB' || currentSection === 'ST02') && renderQuestionSection()}
        </div>
      </div>
    </div>
  );
};

export default FinancialSurveyModal;

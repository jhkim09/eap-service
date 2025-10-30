import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface AruneAnalysisProps {
  user: any;
}

interface AruneReport {
  sessionId: string;
  analysisId: string;
  generatedAt: string;
  scores: {
    spending: number;
    saving: number;
    investment: number;
    riskManagement: number;
    total: number;
  };
  animalType: string;
  animalTypeDescription: string;
  lifeClock: {
    age: number;
    timeString: string;
    phase: string;
    percentageComplete: number;
  };
  recommendations: Array<{
    category: string;
    priority: string;
    title: string;
    description: string;
    actionItems: string[];
  }>;
}

// 26개 설문 질문 (간단한 버전 - 실제로는 더 상세할 수 있음)
const SURVEY_QUESTIONS = [
  { id: 1, text: '한 달 평균 지출 금액은 얼마인가요?', type: 'number', category: 'spending' },
  { id: 2, text: '계획 없는 충동 구매를 자주 하나요?', type: 'scale', category: 'spending' },
  { id: 3, text: '가계부를 작성하고 있나요?', type: 'scale', category: 'spending' },
  { id: 4, text: '고정 지출을 파악하고 있나요?', type: 'scale', category: 'spending' },
  { id: 5, text: '불필요한 구독 서비스가 있나요?', type: 'scale', category: 'spending' },
  { id: 6, text: '한 달 평균 저축 금액은 얼마인가요?', type: 'number', category: 'saving' },
  { id: 7, text: '매월 정기적으로 저축하고 있나요?', type: 'scale', category: 'saving' },
  { id: 8, text: '비상금이 마련되어 있나요?', type: 'scale', category: 'saving' },
  { id: 9, text: '저축 목표가 명확한가요?', type: 'scale', category: 'saving' },
  { id: 10, text: '자동이체로 저축하고 있나요?', type: 'scale', category: 'saving' },
  { id: 11, text: '현재 투자 금액은 얼마인가요?', type: 'number', category: 'investment' },
  { id: 12, text: '투자 경험이 있나요?', type: 'scale', category: 'investment' },
  { id: 13, text: '투자 상품에 대해 이해하고 있나요?', type: 'scale', category: 'investment' },
  { id: 14, text: '장기 투자 계획이 있나요?', type: 'scale', category: 'investment' },
  { id: 15, text: '분산 투자를 하고 있나요?', type: 'scale', category: 'investment' },
  { id: 16, text: '은퇴 자금 계획이 있나요?', type: 'scale', category: 'investment' },
  { id: 17, text: '보험에 가입되어 있나요?', type: 'scale', category: 'riskManagement' },
  { id: 18, text: '건강보험이 충분한가요?', type: 'scale', category: 'riskManagement' },
  { id: 19, text: '재산 보험에 가입되어 있나요?', type: 'scale', category: 'riskManagement' },
  { id: 20, text: '긴급 상황에 대한 대비책이 있나요?', type: 'scale', category: 'riskManagement' },
  { id: 21, text: '부채가 있나요?', type: 'scale', category: 'riskManagement' },
  { id: 22, text: '신용 점수를 관리하고 있나요?', type: 'scale', category: 'riskManagement' },
  { id: 23, text: '재무 목표가 명확한가요?', type: 'scale', category: 'general' },
  { id: 24, text: '재무 관련 공부를 하고 있나요?', type: 'scale', category: 'general' },
  { id: 25, text: '전문가의 조언을 받고 있나요?', type: 'scale', category: 'general' },
  { id: 26, text: '재무 상태에 만족하나요?', type: 'scale', category: 'general' }
];

const AruneAnalysis: React.FC<AruneAnalysisProps> = ({ user }) => {
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<'list' | 'survey' | 'report'>('list');
  const [reports, setReports] = useState<AruneReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<AruneReport | null>(null);
  const [surveyAnswers, setSurveyAnswers] = useState<{ [key: number]: any }>({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');

  useEffect(() => {
    loadReports();
    loadSessions();
  }, []);

  const loadReports = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/arune/report', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReports(response.data.reports || []);
    } catch (error) {
      console.error('리포트 조회 실패:', error);
    }
  };

  const loadSessions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/financial-sessions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSessions(response.data.sessions || []);
    } catch (error) {
      console.error('세션 조회 실패:', error);
    }
  };

  const handleStartSurvey = () => {
    if (!selectedSessionId) {
      alert('재무상담 세션을 선택해주세요.');
      return;
    }
    setSurveyAnswers({});
    setCurrentQuestion(0);
    setCurrentStep('survey');
  };

  const handleAnswerChange = (questionId: number, value: any) => {
    setSurveyAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleNext = () => {
    if (currentQuestion < SURVEY_QUESTIONS.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      submitSurvey();
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const submitSurvey = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      // 설문 제출
      await axios.post(`/api/arune/survey`, {
        sessionId: selectedSessionId,
        answers: surveyAnswers
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // 리포트 생성 요청
      const reportResponse = await axios.post(`/api/arune/report/${selectedSessionId}/generate`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('설문이 완료되었습니다! 리포트를 확인해주세요.');

      // 리포트 조회
      const reportData = await axios.get(`/api/arune/report/${selectedSessionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('리포트 응답 데이터:', reportData.data);

      if (reportData.data && reportData.data.report) {
        setSelectedReport(reportData.data.report);
        setCurrentStep('report');
        loadReports();
      } else {
        console.error('리포트 데이터 형식 오류:', reportData.data);
        alert('리포트 데이터를 불러오는데 문제가 있습니다.');
      }
    } catch (error: any) {
      console.error('설문 제출 실패:', error);
      console.error('에러 응답:', error.response?.data);
      alert('설문 제출 중 오류가 발생했습니다: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const viewReport = async (sessionId: string) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/arune/report/${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedReport(response.data.report);
      setCurrentStep('report');
    } catch (error) {
      console.error('리포트 조회 실패:', error);
      alert('리포트를 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 리스트 화면
  const renderList = () => (
    <div style={{ padding: '20px' }}>
      <div style={{
        marginBottom: '30px',
        padding: '30px',
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{
          fontSize: '24px',
          fontWeight: 'bold',
          marginBottom: '16px',
          color: '#1e293b'
        }}>
          재무 성향 분석 (Arune)
        </h2>
        <p style={{ color: '#64748b', marginBottom: '24px' }}>
          26개의 질문으로 당신의 재무 성향을 분석하고, 맞춤 재무 계획을 추천해드립니다.
        </p>

        <div style={{ marginBottom: '16px' }}>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            fontWeight: '500',
            color: '#475569'
          }}>
            재무상담 세션 선택
          </label>
          <select
            value={selectedSessionId}
            onChange={(e) => setSelectedSessionId(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '14px'
            }}
          >
            <option value="">세션을 선택하세요</option>
            {sessions.map(session => (
              <option key={session._id} value={session._id}>
                {new Date(session.scheduledDate).toLocaleDateString()} - {session.client?.name || '고객'}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleStartSurvey}
          disabled={!selectedSessionId}
          style={{
            padding: '12px 24px',
            backgroundColor: selectedSessionId ? '#10b981' : '#cbd5e1',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '500',
            cursor: selectedSessionId ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s'
          }}
        >
          설문 시작하기
        </button>
      </div>

      {reports.length > 0 && (
        <div style={{
          padding: '30px',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{
            fontSize: '20px',
            fontWeight: 'bold',
            marginBottom: '20px',
            color: '#1e293b'
          }}>
            이전 분석 리포트
          </h3>
          <div style={{ display: 'grid', gap: '12px' }}>
            {reports.map((report, index) => (
              <div
                key={index}
                style={{
                  padding: '16px',
                  backgroundColor: '#f8fafc',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  border: '1px solid #e2e8f0',
                  transition: 'all 0.2s'
                }}
                onClick={() => viewReport(report.sessionId)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f1f5f9';
                  e.currentTarget.style.borderColor = '#10b981';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#f8fafc';
                  e.currentTarget.style.borderColor = '#e2e8f0';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: '500', color: '#1e293b' }}>{report.animalType}</div>
                    <div style={{ fontSize: '14px', color: '#64748b' }}>
                      {new Date(report.generatedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div style={{
                    padding: '4px 12px',
                    backgroundColor: '#10b981',
                    color: '#ffffff',
                    borderRadius: '12px',
                    fontSize: '14px'
                  }}>
                    조회
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // 설문 화면
  const renderSurvey = () => {
    const question = SURVEY_QUESTIONS[currentQuestion];
    const progress = ((currentQuestion + 1) / SURVEY_QUESTIONS.length) * 100;

    return (
      <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '30px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          {/* 진행 상황 */}
          <div style={{ marginBottom: '30px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '8px',
              fontSize: '14px',
              color: '#64748b'
            }}>
              <span>질문 {currentQuestion + 1} / {SURVEY_QUESTIONS.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div style={{
              height: '8px',
              backgroundColor: '#e2e8f0',
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div style={{
                height: '100%',
                width: `${progress}%`,
                backgroundColor: '#10b981',
                transition: 'width 0.3s'
              }} />
            </div>
          </div>

          {/* 질문 */}
          <h3 style={{
            fontSize: '20px',
            fontWeight: 'bold',
            marginBottom: '24px',
            color: '#1e293b'
          }}>
            {question.text}
          </h3>

          {/* 답변 입력 */}
          {question.type === 'number' ? (
            <input
              type="number"
              value={surveyAnswers[question.id] || ''}
              onChange={(e) => handleAnswerChange(question.id, parseInt(e.target.value) || 0)}
              placeholder="숫자를 입력하세요"
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '16px'
              }}
            />
          ) : (
            <div style={{ display: 'grid', gap: '12px' }}>
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  onClick={() => handleAnswerChange(question.id, value)}
                  style={{
                    padding: '16px',
                    backgroundColor: surveyAnswers[question.id] === value ? '#10b981' : '#f8fafc',
                    color: surveyAnswers[question.id] === value ? '#ffffff' : '#1e293b',
                    border: '1px solid',
                    borderColor: surveyAnswers[question.id] === value ? '#10b981' : '#e2e8f0',
                    borderRadius: '8px',
                    fontSize: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {value === 1 && '전혀 아니다'}
                  {value === 2 && '아니다'}
                  {value === 3 && '보통이다'}
                  {value === 4 && '그렇다'}
                  {value === 5 && '매우 그렇다'}
                </button>
              ))}
            </div>
          )}

          {/* 버튼 */}
          <div style={{
            display: 'flex',
            gap: '12px',
            marginTop: '30px',
            justifyContent: 'space-between'
          }}>
            <button
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
              style={{
                padding: '12px 24px',
                backgroundColor: currentQuestion === 0 ? '#cbd5e1' : '#ffffff',
                color: currentQuestion === 0 ? '#ffffff' : '#1e293b',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '16px',
                cursor: currentQuestion === 0 ? 'not-allowed' : 'pointer'
              }}
            >
              이전
            </button>
            <button
              onClick={handleNext}
              disabled={!surveyAnswers[question.id]}
              style={{
                padding: '12px 24px',
                backgroundColor: surveyAnswers[question.id] ? '#10b981' : '#cbd5e1',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                cursor: surveyAnswers[question.id] ? 'pointer' : 'not-allowed'
              }}
            >
              {currentQuestion === SURVEY_QUESTIONS.length - 1 ? '제출' : '다음'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // 리포트 화면
  const renderReport = () => {
    if (!selectedReport) return null;

    // 디버깅: 리포트 데이터 구조 확인
    console.log('렌더링할 리포트 데이터:', selectedReport);
    console.log('recommendations 타입:', typeof selectedReport.recommendations, Array.isArray(selectedReport.recommendations));

    return (
      <div style={{ padding: '20px' }}>
        <button
          onClick={() => setCurrentStep('list')}
          style={{
            marginBottom: '20px',
            padding: '8px 16px',
            backgroundColor: '#ffffff',
            color: '#64748b',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          ← 목록으로
        </button>

        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '30px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          marginBottom: '20px'
        }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px', color: '#1e293b' }}>
            재무 성향 분석 결과
          </h2>
          <div style={{
            padding: '24px',
            backgroundColor: '#f0fdf4',
            borderRadius: '8px',
            marginBottom: '24px'
          }}>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#10b981', marginBottom: '8px' }}>
              {selectedReport.animalType || '분석중'}
            </div>
            <div style={{ color: '#64748b' }}>
              {selectedReport.animalTypeDescription || ''}
            </div>
          </div>

          {/* 점수 */}
          {selectedReport.scores && (
            <div style={{ marginBottom: '30px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', color: '#1e293b' }}>
                영역별 점수
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                {Object.entries(selectedReport.scores).filter(([key]) => key !== 'total').map(([key, value]) => (
                  <div key={key} style={{
                    padding: '16px',
                    backgroundColor: '#f8fafc',
                    borderRadius: '8px'
                  }}>
                    <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '4px' }}>
                      {key === 'spending' && '지출관리'}
                      {key === 'saving' && '저축'}
                      {key === 'investment' && '투자'}
                      {key === 'riskManagement' && '리스크 관리'}
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>
                      {value}점
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 인생시계 */}
          {selectedReport.lifeClock && (
            <div style={{ marginBottom: '30px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', color: '#1e293b' }}>
                인생 시계
              </h3>
              <div style={{
                padding: '20px',
                backgroundColor: '#f8fafc',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#10b981' }}>
                  {selectedReport.lifeClock.timeString}
                </div>
                <div style={{ color: '#64748b', marginTop: '8px' }}>
                  {selectedReport.lifeClock.phase} ({selectedReport.lifeClock.percentageComplete}% 완료)
                </div>
              </div>
            </div>
          )}

          {/* 추천사항 */}
          {selectedReport.recommendations && Array.isArray(selectedReport.recommendations) && selectedReport.recommendations.length > 0 && (
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', color: '#1e293b' }}>
                맞춤 재무 계획
              </h3>
              <div style={{ display: 'grid', gap: '16px' }}>
                {selectedReport.recommendations.map((rec, index) => (
                <div key={index} style={{
                  padding: '20px',
                  backgroundColor: '#f8fafc',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{
                      padding: '4px 12px',
                      backgroundColor: rec.priority === 'high' ? '#ef4444' : '#3b82f6',
                      color: '#ffffff',
                      borderRadius: '12px',
                      fontSize: '12px',
                      marginRight: '12px'
                    }}>
                      {rec.priority === 'high' ? '높음' : '중간'}
                    </span>
                    <span style={{ color: '#64748b', fontSize: '14px' }}>
                      {rec.category}
                    </span>
                  </div>
                  <h4 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px', color: '#1e293b' }}>
                    {rec.title}
                  </h4>
                  <p style={{ color: '#64748b', marginBottom: '12px' }}>
                    {rec.description}
                  </p>
                  {rec.actionItems && Array.isArray(rec.actionItems) && rec.actionItems.length > 0 && (
                    <ul style={{ listStyle: 'disc', paddingLeft: '20px', color: '#64748b' }}>
                      {rec.actionItems.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '400px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '3px solid #f3f3f3',
            borderTop: '3px solid #10b981',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <div style={{ color: '#64748b' }}>처리 중...</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {currentStep === 'list' && renderList()}
      {currentStep === 'survey' && renderSurvey()}
      {currentStep === 'report' && renderReport()}
    </div>
  );
};

export default AruneAnalysis;

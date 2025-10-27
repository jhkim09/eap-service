import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

interface CustomerDetailData {
  employee: {
    _id: string;
    name: string;
    email: string;
    phone: string;
    company: string;
  };
  tiroSessions: Array<{
    _id: string;
    callTimestamp: string;
    emotionalState?: string;
    consultationType?: string;
    mainIssues: string[];
    recommendedServices: {
      eap: { needed: boolean; priority: string; reason: string; };
      financial: { needed: boolean; priority: string; reason: string; };
    };
    riskLevel: string;
  }>;
  eapSessions: Array<{
    _id: string;
    appointmentDate: string;
    status: string;
    topic: string;
    counselor?: { name: string; };
    urgencyLevel: string;
  }>;
  financialSessions: Array<{
    _id: string;
    appointmentDate: string;
    status: string;
    topic: string;
    counselor?: { name: string; };
  }>;
  latestRecommendation?: {
    from: string;
    date: string;
    eap: { needed: boolean; priority: string; reason: string; };
    financial: { needed: boolean; priority: string; reason: string; };
  };
}

interface CustomerDetailProps {
  user: any;
  onLogout: () => void;
}

const CustomerDetail: React.FC<CustomerDetailProps> = ({ user, onLogout }) => {
  const { employeeId } = useParams<{ employeeId: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<CustomerDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'tiro' | 'eap' | 'financial' | 'timeline'>('tiro');

  useEffect(() => {
    fetchCustomerDetail();
  }, [employeeId]);

  const fetchCustomerDetail = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/dashboard/customer/${employeeId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(response.data.data);
      setError(null);
    } catch (err: any) {
      console.error('Failed to fetch customer detail:', err);
      setError(err.response?.data?.message || '고객 정보를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityBadge = (priority: string) => {
    const badges: Record<string, { emoji: string; color: string; text: string }> = {
      urgent: { emoji: '🔴', color: 'bg-red-100 text-red-800', text: '긴급' },
      high: { emoji: '🟠', color: 'bg-orange-100 text-orange-800', text: '높음' },
      medium: { emoji: '🟡', color: 'bg-yellow-100 text-yellow-800', text: '중간' },
      low: { emoji: '🟢', color: 'bg-green-100 text-green-800', text: '낮음' }
    };
    const badge = badges[priority] || badges.low;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
        <span className="mr-1">{badge.emoji}</span>
        {badge.text}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { color: string; text: string }> = {
      scheduled: { color: 'bg-blue-100 text-blue-800', text: '예정' },
      'in-progress': { color: 'bg-yellow-100 text-yellow-800', text: '진행중' },
      completed: { color: 'bg-green-100 text-green-800', text: '완료' },
      cancelled: { color: 'bg-gray-100 text-gray-800', text: '취소' },
      'no-show': { color: 'bg-red-100 text-red-800', text: '노쇼' }
    };
    const badge = badges[status] || badges.scheduled;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.text}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || '데이터를 찾을 수 없습니다.'}</p>
          <button
            onClick={() => navigate('/integrated-dashboard')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            대시보드로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/integrated-dashboard')}
                className="mr-4 text-gray-600 hover:text-gray-900"
              >
                ← 뒤로
              </button>
              <h1 className="text-2xl font-bold text-gray-900">고객 상세 정보</h1>
            </div>
            <button
              onClick={onLogout}
              className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
            >
              로그아웃
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 고객 기본 정보 카드 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">기본 정보</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">이름</p>
              <p className="text-lg font-medium">{data.employee.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">회사</p>
              <p className="text-lg font-medium">{data.employee.company}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">이메일</p>
              <p className="text-lg font-medium">{data.employee.email || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">전화번호</p>
              <p className="text-lg font-medium">{data.employee.phone || '-'}</p>
            </div>
          </div>
        </div>

        {/* 최근 추천 */}
        {data.latestRecommendation && (
          <div className="bg-blue-50 rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">최근 서비스 추천</h2>
            <p className="text-sm text-gray-600 mb-4">
              {formatDate(data.latestRecommendation.date)}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.latestRecommendation.eap.needed && (
                <div className="bg-white rounded p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">🏥 EAP 상담</h3>
                    {getPriorityBadge(data.latestRecommendation.eap.priority)}
                  </div>
                  <p className="text-sm text-gray-600">{data.latestRecommendation.eap.reason}</p>
                </div>
              )}
              {data.latestRecommendation.financial.needed && (
                <div className="bg-white rounded p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">💰 재무상담</h3>
                    {getPriorityBadge(data.latestRecommendation.financial.priority)}
                  </div>
                  <p className="text-sm text-gray-600">{data.latestRecommendation.financial.reason}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 탭 네비게이션 */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex">
              <button
                onClick={() => setActiveTab('tiro')}
                className={`py-4 px-6 text-sm font-medium ${
                  activeTab === 'tiro'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                🎙️ Tiro 세션 ({data.tiroSessions.length})
              </button>
              <button
                onClick={() => setActiveTab('eap')}
                className={`py-4 px-6 text-sm font-medium ${
                  activeTab === 'eap'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                🏥 EAP 상담 ({data.eapSessions.length})
              </button>
              <button
                onClick={() => setActiveTab('financial')}
                className={`py-4 px-6 text-sm font-medium ${
                  activeTab === 'financial'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                💰 재무상담 ({data.financialSessions.length})
              </button>
              <button
                onClick={() => setActiveTab('timeline')}
                className={`py-4 px-6 text-sm font-medium ${
                  activeTab === 'timeline'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                📅 통합 타임라인
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Tiro 세션 탭 */}
            {activeTab === 'tiro' && (
              <div className="space-y-4">
                {data.tiroSessions.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">Tiro 세션 기록이 없습니다.</p>
                ) : (
                  data.tiroSessions.map((session) => (
                    <div key={session._id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-medium">{formatDate(session.callTimestamp)}</p>
                          <p className="text-sm text-gray-600">
                            {session.consultationType || '상담'} | {session.emotionalState || '-'}
                          </p>
                        </div>
                        {getPriorityBadge(session.riskLevel)}
                      </div>
                      {session.mainIssues.length > 0 && (
                        <div className="mb-3">
                          <p className="text-sm font-medium text-gray-700 mb-1">주요 이슈:</p>
                          <div className="flex flex-wrap gap-2">
                            {session.mainIssues.map((issue, idx) => (
                              <span
                                key={idx}
                                className="inline-block px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                              >
                                {issue}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {(session.recommendedServices.eap.needed || session.recommendedServices.financial.needed) && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-sm font-medium text-gray-700 mb-2">추천 서비스:</p>
                          <div className="flex gap-2">
                            {session.recommendedServices.eap.needed && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                                🏥 EAP ({session.recommendedServices.eap.priority})
                              </span>
                            )}
                            {session.recommendedServices.financial.needed && (
                              <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                                💰 재무상담 ({session.recommendedServices.financial.priority})
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* EAP 상담 탭 */}
            {activeTab === 'eap' && (
              <div className="space-y-4">
                {data.eapSessions.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">EAP 상담 기록이 없습니다.</p>
                ) : (
                  data.eapSessions.map((session) => (
                    <div key={session._id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium">{formatDate(session.appointmentDate)}</p>
                          <p className="text-sm text-gray-600">
                            상담사: {session.counselor?.name || '미배정'}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {getStatusBadge(session.status)}
                          {getPriorityBadge(session.urgencyLevel)}
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 mt-2">주제: {session.topic}</p>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* 재무상담 탭 */}
            {activeTab === 'financial' && (
              <div className="space-y-4">
                {data.financialSessions.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">재무상담 기록이 없습니다.</p>
                ) : (
                  data.financialSessions.map((session) => (
                    <div key={session._id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium">{formatDate(session.appointmentDate)}</p>
                          <p className="text-sm text-gray-600">
                            상담사: {session.counselor?.name || '미배정'}
                          </p>
                        </div>
                        {getStatusBadge(session.status)}
                      </div>
                      <p className="text-sm text-gray-700 mt-2">주제: {session.topic}</p>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* 통합 타임라인 탭 */}
            {activeTab === 'timeline' && (
              <div className="space-y-4">
                {[...data.tiroSessions.map(s => ({ ...s, type: 'tiro' })),
                  ...data.eapSessions.map(s => ({ ...s, type: 'eap' })),
                  ...data.financialSessions.map(s => ({ ...s, type: 'financial' }))]
                  .sort((a, b) => {
                    const dateA = new Date((a as any).callTimestamp || (a as any).appointmentDate);
                    const dateB = new Date((b as any).callTimestamp || (b as any).appointmentDate);
                    return dateB.getTime() - dateA.getTime();
                  })
                  .map((item: any, idx) => (
                    <div key={idx} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full ${
                          item.type === 'tiro' ? 'bg-purple-500' :
                          item.type === 'eap' ? 'bg-blue-500' : 'bg-green-500'
                        }`}></div>
                        {idx < data.tiroSessions.length + data.eapSessions.length + data.financialSessions.length - 1 && (
                          <div className="w-0.5 h-full bg-gray-300 flex-1"></div>
                        )}
                      </div>
                      <div className="flex-1 pb-8">
                        <div className="bg-white border rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg">
                              {item.type === 'tiro' ? '🎙️' : item.type === 'eap' ? '🏥' : '💰'}
                            </span>
                            <span className="font-medium">
                              {item.type === 'tiro' ? 'Tiro 상담' : item.type === 'eap' ? 'EAP 상담' : '재무상담'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">
                            {formatDate(item.callTimestamp || item.appointmentDate)}
                          </p>
                          {item.topic && (
                            <p className="text-sm text-gray-700 mt-2">{item.topic}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDetail;

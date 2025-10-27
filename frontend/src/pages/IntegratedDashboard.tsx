import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface IntegratedDashboardProps {
  user: any;
  onLogout: () => void;
}

interface SummaryData {
  today: {
    tiroSessions: number;
    urgentCases: number;
    pendingSessions: number;
    completedToday: number;
  };
  recommendations: {
    eapNeeded: number;
    financialNeeded: number;
    byPriority: {
      urgent: number;
      high: number;
      medium: number;
      low: number;
    };
  };
  weeklyTrend: {
    tiroSessions: number[];
    eapSessions: number[];
  };
}

interface Recommendation {
  sessionId: string;
  employee: {
    _id: string;
    name: string;
    company: string;
    phone: string;
    email: string;
  };
  tiroDate: string;
  emotionalState?: string;
  riskLevel: string;
  recommendedServices: {
    eap: {
      needed: boolean;
      priority: string;
      reason: string;
    };
    financial: {
      needed: boolean;
      priority: string;
      reason: string;
    };
  };
  mainIssues: string[];
  financialMentions: string[];
  hasEapSession: boolean;
  hasFinancialSession: boolean;
}

const IntegratedDashboard: React.FC<IntegratedDashboardProps> = ({ user, onLogout }) => {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    priority: '',
    service: '',
    search: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);

  useEffect(() => {
    fetchSummary();
    fetchRecommendations();
  }, [filters.priority, filters.service, pagination.page]);

  const fetchSummary = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/dashboard/summary', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSummary(response.data.data);
    } catch (error) {
      console.error('Failed to fetch summary:', error);
    }
  };

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const params: any = {
        page: pagination.page,
        limit: pagination.limit
      };

      if (filters.priority) params.priority = filters.priority;
      if (filters.service) params.service = filters.service;
      if (filters.search) params.search = filters.search;

      const response = await axios.get('/api/dashboard/recommendations', {
        headers: { Authorization: `Bearer ${token}` },
        params
      });

      setRecommendations(response.data.data.recommendations);
      setPagination(prev => ({
        ...prev,
        total: response.data.data.pagination.total,
        pages: response.data.data.pagination.pages
      }));
    } catch (error) {
      console.error('Failed to fetch recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchRecommendations();
  };

  const getPriorityBadgeClass = (priority: string): string => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getPriorityEmoji = (priority: string): string => {
    switch (priority) {
      case 'urgent':
        return '🔴';
      case 'high':
        return '🟠';
      case 'medium':
        return '🟡';
      case 'low':
        return '🟢';
      default:
        return '⚪';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">
              📊 통합 대시보드 (Tiro + EAP + 재무상담)
            </h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {user?.name || 'Admin'}
              </span>
              <button
                onClick={onLogout}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-3xl">📞</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">오늘 Tiro 상담</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {summary.today.tiroSessions}건
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-3xl">🔴</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">긴급 케이스</p>
                  <p className="text-2xl font-semibold text-red-600">
                    {summary.today.urgentCases}건
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-3xl">💼</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">대기 중 상담</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {summary.today.pendingSessions}건
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-3xl">✅</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">오늘 완료</p>
                  <p className="text-2xl font-semibold text-green-600">
                    {summary.today.completedToday}건
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recommendation Stats */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">서비스 추천 통계</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">EAP 심리상담 필요</span>
                  <span className="text-lg font-semibold text-blue-600">
                    {summary.recommendations.eapNeeded}건
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">재무상담 필요</span>
                  <span className="text-lg font-semibold text-purple-600">
                    {summary.recommendations.financialNeeded}건
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">우선순위별 분포</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">🔴 긴급</span>
                  <span className="text-lg font-semibold text-red-600">
                    {summary.recommendations.byPriority.urgent}건
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">🟠 높음</span>
                  <span className="text-lg font-semibold text-orange-600">
                    {summary.recommendations.byPriority.high}건
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">🟡 중간</span>
                  <span className="text-lg font-semibold text-yellow-600">
                    {summary.recommendations.byPriority.medium}건
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                우선순위
              </label>
              <select
                value={filters.priority}
                onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">전체</option>
                <option value="urgent">긴급</option>
                <option value="high">높음</option>
                <option value="medium">중간</option>
                <option value="low">낮음</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                서비스
              </label>
              <select
                value={filters.service}
                onChange={(e) => setFilters({ ...filters, service: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">전체</option>
                <option value="eap">EAP만</option>
                <option value="financial">재무만</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                검색
              </label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="고객명/회사명"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={handleSearch}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                검색
              </button>
            </div>
          </div>
        </div>

        {/* Recommendations Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              서비스 추천 목록
              {pagination.total > 0 && (
                <span className="ml-2 text-sm font-normal text-gray-500">
                  (총 {pagination.total}건)
                </span>
              )}
            </h2>
          </div>

          {loading ? (
            <div className="px-6 py-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-sm text-gray-500">로딩 중...</p>
            </div>
          ) : recommendations.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-gray-500">추천 데이터가 없습니다.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      우선순위
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      고객명
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      회사
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      추천 서비스
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      이유
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      액션
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recommendations.map((rec) => {
                    const highestPriority = rec.recommendedServices.eap.needed &&
                      (rec.recommendedServices.eap.priority === 'urgent' || rec.recommendedServices.eap.priority === 'high')
                      ? rec.recommendedServices.eap.priority
                      : rec.recommendedServices.financial.needed &&
                        (rec.recommendedServices.financial.priority === 'urgent' || rec.recommendedServices.financial.priority === 'high')
                        ? rec.recommendedServices.financial.priority
                        : rec.recommendedServices.eap.needed
                          ? rec.recommendedServices.eap.priority
                          : rec.recommendedServices.financial.priority;

                    return (
                      <tr key={rec.sessionId} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPriorityBadgeClass(highestPriority)}`}>
                            {getPriorityEmoji(highestPriority)} {highestPriority}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {rec.employee?.name || '알 수 없음'}
                          </div>
                          {rec.emotionalState && (
                            <div className="text-xs text-gray-500">
                              감정: {rec.emotionalState}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {rec.employee?.company || '알 수 없음'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            {rec.recommendedServices.eap.needed && (
                              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800 mr-2">
                                EAP
                              </span>
                            )}
                            {rec.recommendedServices.financial.needed && (
                              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                재무
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {rec.recommendedServices.eap.needed && (
                            <div className="mb-1">
                              <span className="font-medium">EAP:</span> {rec.recommendedServices.eap.reason}
                            </div>
                          )}
                          {rec.recommendedServices.financial.needed && (
                            <div>
                              <span className="font-medium">재무:</span> {rec.recommendedServices.financial.reason}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => setSelectedCustomer(rec.employee._id)}
                            className="text-blue-600 hover:text-blue-900 font-medium"
                          >
                            상세보기
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                {pagination.total}건 중 {(pagination.page - 1) * pagination.limit + 1}-
                {Math.min(pagination.page * pagination.limit, pagination.total)}건 표시
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  이전
                </button>
                <span className="px-3 py-1 text-sm text-gray-700">
                  {pagination.page} / {pagination.pages}
                </span>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page === pagination.pages}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  다음
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default IntegratedDashboard;

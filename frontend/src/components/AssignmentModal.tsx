import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Recommendation {
  sessionId: string;
  employee: {
    _id: string;
    name: string;
    company: string;
  };
  recommendedServices: {
    eap: { needed: boolean; priority: string; reason: string; };
    financial: { needed: boolean; priority: string; reason: string; };
  };
}

interface AssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  recommendation: Recommendation | null;
  onSuccess: () => void;
}

interface Counselor {
  _id: string;
  name: string;
  email: string;
  role: string;
}

const AssignmentModal: React.FC<AssignmentModalProps> = ({
  isOpen,
  onClose,
  recommendation,
  onSuccess
}) => {
  const [serviceType, setServiceType] = useState<'eap' | 'financial'>('eap');
  const [counselors, setCounselors] = useState<Counselor[]>([]);
  const [selectedCounselor, setSelectedCounselor] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [counselingMethod, setCounselingMethod] = useState<'faceToFace' | 'phoneVideo' | 'chat'>('phoneVideo');
  const [assignmentNotes, setAssignmentNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && recommendation) {
      // 추천 서비스에 맞게 기본값 설정
      if (recommendation.recommendedServices.eap.needed && !recommendation.recommendedServices.financial.needed) {
        setServiceType('eap');
      } else if (recommendation.recommendedServices.financial.needed && !recommendation.recommendedServices.eap.needed) {
        setServiceType('financial');
      }

      // 추천 이유를 자동으로 노트에 추가
      const service = serviceType === 'eap'
        ? recommendation.recommendedServices.eap
        : recommendation.recommendedServices.financial;

      if (service.reason) {
        setAssignmentNotes(`Tiro 추천: ${service.reason}`);
      }
    }
  }, [isOpen, recommendation, serviceType]);

  useEffect(() => {
    if (isOpen) {
      fetchCounselors();
    }
  }, [isOpen, serviceType]);

  const fetchCounselors = async () => {
    try {
      const token = localStorage.getItem('token');
      const role = serviceType === 'eap' ? 'counselor' : 'financial-advisor';

      // 상담사 목록 조회 API (간단한 구현 - 실제로는 별도 API가 필요)
      const response = await axios.get('/api/users', {
        headers: { Authorization: `Bearer ${token}` },
        params: { role }
      });

      setCounselors(response.data.users || []);
    } catch (err) {
      console.error('Failed to fetch counselors:', err);
      // 에러 시 빈 배열로 설정
      setCounselors([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!recommendation) return;

    // 유효성 검사
    if (!selectedCounselor) {
      setError('상담사를 선택해주세요.');
      return;
    }

    if (!appointmentDate) {
      setError('상담 일정을 선택해주세요.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      const requestData = {
        tiroSessionId: recommendation.sessionId,
        serviceType,
        counselorId: selectedCounselor,
        appointmentDate: new Date(appointmentDate).toISOString(),
        counselingMethod,
        assignmentNotes
      };

      await axios.post('/api/dashboard/assign-from-tiro', requestData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // 성공
      alert('상담이 성공적으로 배정되었습니다!');
      onSuccess();
      handleClose();
    } catch (err: any) {
      console.error('Failed to assign counseling:', err);
      setError(err.response?.data?.message || '상담 배정에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    // 폼 초기화
    setSelectedCounselor('');
    setAppointmentDate('');
    setCounselingMethod('phoneVideo');
    setAssignmentNotes('');
    setError(null);
    onClose();
  };

  if (!isOpen || !recommendation) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* 배경 오버레이 */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={handleClose}
        ></div>

        {/* 모달 중앙 정렬 */}
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

        {/* 모달 콘텐츠 */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={handleSubmit}>
            {/* 헤더 */}
            <div className="bg-blue-600 px-6 py-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-white">
                  상담 배정
                </h3>
                <button
                  type="button"
                  onClick={handleClose}
                  className="text-white hover:text-gray-200"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* 바디 */}
            <div className="px-6 py-4">
              {/* 고객 정보 */}
              <div className="mb-4 p-3 bg-gray-50 rounded">
                <p className="text-sm text-gray-600">고객</p>
                <p className="font-medium">{recommendation.employee.name}</p>
                <p className="text-sm text-gray-500">{recommendation.employee.company}</p>
              </div>

              {/* 에러 메시지 */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 rounded text-sm">
                  {error}
                </div>
              )}

              {/* 서비스 타입 선택 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  서비스 유형 <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setServiceType('eap')}
                    disabled={!recommendation.recommendedServices.eap.needed}
                    className={`px-4 py-2 rounded border ${
                      serviceType === 'eap'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    } ${
                      !recommendation.recommendedServices.eap.needed
                        ? 'opacity-50 cursor-not-allowed'
                        : ''
                    }`}
                  >
                    🏥 EAP 상담
                  </button>
                  <button
                    type="button"
                    onClick={() => setServiceType('financial')}
                    disabled={!recommendation.recommendedServices.financial.needed}
                    className={`px-4 py-2 rounded border ${
                      serviceType === 'financial'
                        ? 'bg-green-600 text-white border-green-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    } ${
                      !recommendation.recommendedServices.financial.needed
                        ? 'opacity-50 cursor-not-allowed'
                        : ''
                    }`}
                  >
                    💰 재무상담
                  </button>
                </div>
              </div>

              {/* 상담사 선택 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  상담사 <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedCounselor}
                  onChange={(e) => setSelectedCounselor(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">상담사를 선택하세요</option>
                  {counselors.map((counselor) => (
                    <option key={counselor._id} value={counselor._id}>
                      {counselor.name} ({counselor.email})
                    </option>
                  ))}
                </select>
                {counselors.length === 0 && (
                  <p className="mt-1 text-xs text-gray-500">
                    사용 가능한 상담사가 없습니다.
                  </p>
                )}
              </div>

              {/* 상담 일정 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  상담 일정 <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={appointmentDate}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* 상담 방법 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  상담 방법 <span className="text-red-500">*</span>
                </label>
                <select
                  value={counselingMethod}
                  onChange={(e) => setCounselingMethod(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="phoneVideo">전화/화상</option>
                  <option value="faceToFace">대면</option>
                  <option value="chat">채팅</option>
                </select>
              </div>

              {/* 배정 노트 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  배정 노트
                </label>
                <textarea
                  value={assignmentNotes}
                  onChange={(e) => setAssignmentNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="추가 정보나 특이사항을 입력하세요..."
                />
              </div>
            </div>

            {/* 푸터 */}
            <div className="bg-gray-50 px-6 py-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                disabled={loading}
              >
                취소
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {loading ? '배정 중...' : '배정하기'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AssignmentModal;

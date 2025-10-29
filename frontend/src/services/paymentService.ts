import axios from 'axios';

// 정산 관련 API 호출 모듈
export const paymentService = {
  // 정산 목록 조회
  async getPayments(params?: {
    page?: number;
    limit?: number;
    status?: string;
    year?: number;
    month?: number;
    counselorId?: string;
  }) {
    const token = localStorage.getItem('token');
    const response = await axios.get('/api/counselor-payments', {
      headers: { Authorization: `Bearer ${token}` },
      params
    });
    return response.data;
  },

  // 정산 상세 조회
  async getPaymentDetail(paymentId: string) {
    const token = localStorage.getItem('token');
    const response = await axios.get(`/api/counselor-payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  // 정산 상태 변경 (Super Admin)
  async updatePaymentStatus(paymentId: string, status: string, notes?: string) {
    const token = localStorage.getItem('token');
    const response = await axios.put(
      `/api/counselor-payments/${paymentId}/status`,
      { status, notes },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },

  // 정산 승인 (Super Admin)
  async approvePayment(paymentId: string, notes?: string) {
    const token = localStorage.getItem('token');
    const response = await axios.put(
      `/api/counselor-payments/${paymentId}/approve`,
      { notes },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },

  // 정산 지급 완료 (Super Admin)
  async markPaymentAsPaid(paymentId: string, paymentMethod: string, notes?: string) {
    const token = localStorage.getItem('token');
    const response = await axios.put(
      `/api/counselor-payments/${paymentId}/pay`,
      { paymentMethod, notes },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },

  // 정산 이의제기 (상담사)
  async disputePayment(paymentId: string, reason: string) {
    const token = localStorage.getItem('token');
    const response = await axios.put(
      `/api/counselor-payments/${paymentId}/dispute`,
      { reason },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },

  // 정산 명세서 다운로드
  async getPaymentStatement(paymentId: string) {
    const token = localStorage.getItem('token');
    const response = await axios.get(`/api/counselor-payments/${paymentId}/statement`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  // 월별 정산서 생성 (Super Admin)
  async generateMonthlyPayments(year: number, month: number, counselorId?: string) {
    const token = localStorage.getItem('token');
    const response = await axios.post(
      '/api/counselor-payments/generate',
      { year, month, counselorId },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  }
};

// 정산 상태 한글명
export const getPaymentStatusName = (status: string): string => {
  const statusMap: Record<string, string> = {
    pending: '정산 대기',
    processing: '처리 중',
    settling: '정산 진행',
    approved: '승인됨',
    paid: '지급완료',
    completed: '정산완료',
    dispute: '이의제기'
  };
  return statusMap[status] || status;
};

// 정산 상태 색상
export const getPaymentStatusColor = (status: string): string => {
  const colorMap: Record<string, string> = {
    pending: '#f57c00',
    processing: '#1976d2',
    settling: '#0288d1',
    approved: '#388e3c',
    paid: '#2e7d32',
    completed: '#2e7d32',
    dispute: '#d32f2f'
  };
  return colorMap[status] || '#666';
};

// 정산 상태 배경색
export const getPaymentStatusBgColor = (status: string): string => {
  const bgColorMap: Record<string, string> = {
    pending: '#fff3e0',
    processing: '#e3f2fd',
    settling: '#e1f5fe',
    approved: '#e8f5e9',
    paid: '#e8f5e9',
    completed: '#e8f5e9',
    dispute: '#ffebee'
  };
  return bgColorMap[status] || '#f5f5f5';
};

// 금액 포맷팅
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW'
  }).format(amount);
};

// 날짜 포맷팅
export const formatDate = (date: string | Date): string => {
  return new Date(date).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

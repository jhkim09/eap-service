import React, { useState, useEffect } from 'react';
import {
  paymentService,
  getPaymentStatusName,
  getPaymentStatusColor,
  getPaymentStatusBgColor,
  formatCurrency,
  formatDate
} from '../services/paymentService';

interface CounselorPaymentsProps {
  user: any;
}

const CounselorPayments: React.FC<CounselorPaymentsProps> = ({ user }) => {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);

  useEffect(() => {
    loadPayments();
  }, [currentYear, currentMonth]);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const data = await paymentService.getPayments({
        year: currentYear,
        month: currentMonth,
        limit: 50
      });
      setPayments(data.payments || []);
    } catch (error) {
      console.error('정산 내역 로딩 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = async (payment: any) => {
    try {
      const detail = await paymentService.getPaymentDetail(payment._id);
      setSelectedPayment(detail);
      setShowDetailModal(true);
    } catch (error) {
      console.error('정산 상세 조회 오류:', error);
      alert('정산 상세 정보를 불러오는데 실패했습니다.');
    }
  };

  const handleDispute = async () => {
    if (!disputeReason.trim() || disputeReason.length < 10) {
      alert('이의제기 사유를 10자 이상 입력해주세요.');
      return;
    }

    try {
      await paymentService.disputePayment(selectedPayment._id, disputeReason);
      alert('이의제기가 접수되었습니다.');
      setShowDisputeModal(false);
      setDisputeReason('');
      loadPayments();
    } catch (error: any) {
      console.error('이의제기 오류:', error);
      alert(error.response?.data?.message || '이의제기 접수에 실패했습니다.');
    }
  };

  const downloadStatement = async (payment: any) => {
    try {
      const statement = await paymentService.getPaymentStatement(payment._id);
      // 명세서 다운로드 로직 (실제로는 PDF 생성 필요)
      console.log('정산 명세서:', statement);
      alert('명세서 다운로드 기능은 추후 구현 예정입니다.');
    } catch (error) {
      console.error('명세서 다운로드 오류:', error);
      alert('명세서 다운로드에 실패했습니다.');
    }
  };

  // 월 선택 옵션
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  // 전체 통계 계산
  const totalAmount = payments.reduce((sum, p) => sum + (p.summary?.totalAmount || 0), 0);
  const pendingAmount = payments
    .filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + (p.summary?.totalAmount || 0), 0);
  const completedAmount = payments
    .filter(p => ['completed', 'paid'].includes(p.status))
    .reduce((sum, p) => sum + (p.summary?.totalAmount || 0), 0);

  return (
    <div style={{ padding: '20px' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px'
      }}>
        <h2 style={{ margin: 0, color: '#333' }}>💰 내 정산 내역</h2>

        {/* 년/월 선택 */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <select
            value={currentYear}
            onChange={(e) => setCurrentYear(parseInt(e.target.value))}
            style={{
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          >
            {years.map(year => (
              <option key={year} value={year}>{year}년</option>
            ))}
          </select>
          <select
            value={currentMonth}
            onChange={(e) => setCurrentMonth(parseInt(e.target.value))}
            style={{
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          >
            {months.map(month => (
              <option key={month} value={month}>{month}월</option>
            ))}
          </select>
        </div>
      </div>

      {/* 통계 카드 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '20px',
        marginBottom: '30px'
      }}>
        <div style={{
          padding: '20px',
          backgroundColor: '#e3f2fd',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '14px', color: '#1976d2', marginBottom: '8px' }}>
            총 정산 금액
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1565c0' }}>
            {formatCurrency(totalAmount)}
          </div>
        </div>
        <div style={{
          padding: '20px',
          backgroundColor: '#fff3e0',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '14px', color: '#f57c00', marginBottom: '8px' }}>
            대기 중
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#e65100' }}>
            {formatCurrency(pendingAmount)}
          </div>
        </div>
        <div style={{
          padding: '20px',
          backgroundColor: '#e8f5e9',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '14px', color: '#2e7d32', marginBottom: '8px' }}>
            지급 완료
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1b5e20' }}>
            {formatCurrency(completedAmount)}
          </div>
        </div>
      </div>

      {/* 정산 목록 */}
      {loading ? (
        <div style={{
          padding: '40px',
          textAlign: 'center',
          color: '#666'
        }}>
          정산 내역을 불러오는 중...
        </div>
      ) : payments.length === 0 ? (
        <div style={{
          padding: '40px',
          textAlign: 'center',
          color: '#999',
          border: '1px dashed #ddd',
          borderRadius: '8px'
        }}>
          {currentYear}년 {currentMonth}월 정산 내역이 없습니다.
        </div>
      ) : (
        <div style={{
          border: '1px solid #e0e0e0',
          borderRadius: '8px',
          overflow: 'hidden'
        }}>
          {/* 테이블 헤더 */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '120px 100px 120px 120px 120px 120px 1fr',
            gap: '10px',
            padding: '15px',
            backgroundColor: '#f5f5f5',
            fontWeight: 'bold',
            fontSize: '14px',
            borderBottom: '2px solid #ddd'
          }}>
            <div>기간</div>
            <div style={{ textAlign: 'center' }}>세션 수</div>
            <div style={{ textAlign: 'right' }}>총 금액</div>
            <div style={{ textAlign: 'right' }}>세금</div>
            <div style={{ textAlign: 'right' }}>실수령액</div>
            <div style={{ textAlign: 'center' }}>상태</div>
            <div style={{ textAlign: 'center' }}>액션</div>
          </div>

          {/* 테이블 행 */}
          {payments.map((payment, idx) => (
            <div
              key={payment._id}
              style={{
                display: 'grid',
                gridTemplateColumns: '120px 100px 120px 120px 120px 120px 1fr',
                gap: '10px',
                padding: '15px',
                borderBottom: idx < payments.length - 1 ? '1px solid #e0e0e0' : 'none',
                backgroundColor: idx % 2 === 0 ? '#fff' : '#fafafa',
                alignItems: 'center'
              }}
            >
              <div style={{ fontWeight: 'bold' }}>
                {payment.year}년 {payment.month}월
              </div>
              <div style={{ textAlign: 'center' }}>
                {payment.summary?.totalSessions || 0}건
              </div>
              <div style={{ textAlign: 'right', fontWeight: 'bold' }}>
                {formatCurrency(payment.summary?.totalAmount || 0)}
              </div>
              <div style={{ textAlign: 'right', color: '#d32f2f' }}>
                -{formatCurrency(payment.summary?.taxAmount || 0)}
              </div>
              <div style={{ textAlign: 'right', fontWeight: 'bold', color: '#2e7d32' }}>
                {formatCurrency(payment.summary?.netAmount || 0)}
              </div>
              <div style={{ textAlign: 'center' }}>
                <span style={{
                  padding: '4px 12px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  backgroundColor: getPaymentStatusBgColor(payment.status),
                  color: getPaymentStatusColor(payment.status)
                }}>
                  {getPaymentStatusName(payment.status)}
                </span>
              </div>
              <div style={{
                display: 'flex',
                gap: '8px',
                justifyContent: 'center'
              }}>
                <button
                  onClick={() => handleViewDetail(payment)}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#1976d2',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '13px'
                  }}
                >
                  상세보기
                </button>
                {payment.status === 'pending' && (
                  <button
                    onClick={() => {
                      setSelectedPayment(payment);
                      setShowDisputeModal(true);
                    }}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#f57c00',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '13px'
                    }}
                  >
                    이의제기
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 정산 상세 모달 */}
      {showDetailModal && selectedPayment && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '8px',
            width: '700px',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <h3 style={{ margin: '0 0 20px 0' }}>
              {selectedPayment.year}년 {selectedPayment.month}월 정산 상세
            </h3>

            {/* 요약 정보 */}
            <div style={{
              padding: '20px',
              backgroundColor: '#f5f5f5',
              borderRadius: '8px',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <div style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>
                    총 세션 수
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
                    {selectedPayment.summary?.totalSessions || 0}건
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>
                    총 금액
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1976d2' }}>
                    {formatCurrency(selectedPayment.summary?.totalAmount || 0)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>
                    세금 (10%)
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#d32f2f' }}>
                    -{formatCurrency(selectedPayment.summary?.taxAmount || 0)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>
                    실수령액
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#2e7d32' }}>
                    {formatCurrency(selectedPayment.summary?.netAmount || 0)}
                  </div>
                </div>
              </div>
            </div>

            {/* 세션별 상세 */}
            {selectedPayment.sessions && selectedPayment.sessions.length > 0 && (
              <div>
                <h4 style={{ marginBottom: '15px' }}>세션 내역</h4>
                <div style={{
                  border: '1px solid #e0e0e0',
                  borderRadius: '4px',
                  maxHeight: '300px',
                  overflowY: 'auto'
                }}>
                  {selectedPayment.sessions.map((session: any, idx: number) => (
                    <div
                      key={idx}
                      style={{
                        padding: '12px 15px',
                        borderBottom: idx < selectedPayment.sessions.length - 1 ? '1px solid #e0e0e0' : 'none',
                        backgroundColor: idx % 2 === 0 ? '#fff' : '#fafafa',
                        fontSize: '13px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 'bold' }}>
                          {session.employeeName || '직원명 미상'} ({session.company})
                        </span>
                        <span style={{ fontWeight: 'bold', color: '#1976d2' }}>
                          {formatCurrency(session.amount || 0)}
                        </span>
                      </div>
                      <div style={{ color: '#666', fontSize: '12px' }}>
                        {formatDate(session.date)} · {session.method === 'faceToFace' ? '대면' : session.method === 'phoneVideo' ? '전화/화상' : '채팅'} · {session.duration}분
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 비고 */}
            {selectedPayment.notes && (
              <div style={{ marginTop: '20px' }}>
                <h4 style={{ marginBottom: '10px' }}>비고</h4>
                <div style={{
                  padding: '12px',
                  backgroundColor: '#f5f5f5',
                  borderRadius: '4px',
                  fontSize: '13px',
                  whiteSpace: 'pre-wrap'
                }}>
                  {selectedPayment.notes}
                </div>
              </div>
            )}

            <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => downloadStatement(selectedPayment)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#2e7d32',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                명세서 다운로드
              </button>
              <button
                onClick={() => setShowDetailModal(false)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#666',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 이의제기 모달 */}
      {showDisputeModal && selectedPayment && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '8px',
            width: '500px'
          }}>
            <h3 style={{ margin: '0 0 20px 0' }}>정산 이의제기</h3>
            <p style={{ marginBottom: '15px', color: '#666' }}>
              {selectedPayment.year}년 {selectedPayment.month}월 정산에 대한 이의제기 사유를 입력해주세요.
            </p>
            <textarea
              value={disputeReason}
              onChange={(e) => setDisputeReason(e.target.value)}
              placeholder="이의제기 사유를 10자 이상 입력해주세요..."
              style={{
                width: '100%',
                minHeight: '120px',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
                resize: 'vertical',
                marginBottom: '20px'
              }}
            />
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowDisputeModal(false);
                  setDisputeReason('');
                }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#999',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                취소
              </button>
              <button
                onClick={handleDispute}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#d32f2f',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                이의제기 접수
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CounselorPayments;

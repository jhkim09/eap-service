// API 설정
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://eap-service-lt1r.onrender.com';

// API 엔드포인트 생성 함수
export const apiUrl = (endpoint) => `${API_BASE_URL}${endpoint}`;

// 공통 API 설정
export const apiConfig = {
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
};
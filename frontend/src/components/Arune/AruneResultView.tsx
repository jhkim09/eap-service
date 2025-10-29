import React from 'react';
import { MomentumTheme } from '../../styles/MomentumTheme';
import {
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Shield,
  Target,
  Clock,
  Download,
  AlertCircle
} from 'lucide-react';

interface AruneAnalysis {
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
  recommendations: {
    spending: string[];
    saving: string[];
    investment: string[];
    risk: string[];
  };
}

interface AruneResultViewProps {
  analysis: AruneAnalysis;
  onDownloadBooklet?: () => void;
}

const AruneResultView: React.FC<AruneResultViewProps> = ({ analysis, onDownloadBooklet }) => {
  // 점수에 따른 색상 결정
  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 75) return 'bg-green-100';
    if (score >= 50) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  // 동물형 이모지
  const getAnimalEmoji = (animalType: string) => {
    const emojiMap: Record<string, string> = {
      '돼지형': '🐷',
      '황소형': '🐂',
      '사자형': '🦁',
      '양형': '🐑',
      '거북이형': '🐢'
    };
    return emojiMap[animalType] || '📊';
  };

  return (
    <div className="space-y-6">
      {/* 헤더 섹션 */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold mb-2">Arune 재무분석 결과</h2>
            <p className="text-blue-100">
              생성일: {new Date(analysis.generatedAt).toLocaleDateString('ko-KR')}
            </p>
          </div>
          <div className="text-6xl">{getAnimalEmoji(analysis.animalType)}</div>
        </div>
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
          <p className="text-sm mb-1">분석 ID</p>
          <p className="font-mono text-lg">{analysis.analysisId}</p>
        </div>
      </div>

      {/* 인생시계 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200 p-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Clock className="w-5 h-5 mr-2" />
            나의 인생시계
          </h3>
        </div>
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">🕐</div>
            <h3 className="text-3xl font-bold text-blue-600 mb-2">
              {analysis.lifeClock.timeString}
            </h3>
            <p className="text-gray-600 mb-4">
              현재 {analysis.lifeClock.age}세 · {analysis.lifeClock.phase}
            </p>
            <div className="max-w-md mx-auto">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>인생 진행률</span>
                <span>{analysis.lifeClock.percentageComplete}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-blue-600 h-3 transition-all duration-300"
                  style={{ width: `${analysis.lifeClock.percentageComplete}%` }}
                />
              </div>
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              💡 인생을 하루 24시간으로 표현했을 때, 지금은 {analysis.lifeClock.timeString}입니다.
              남은 시간을 의미있게 설계하세요.
            </p>
          </div>
        </div>
      </div>

      {/* 재무성향 캐릭터 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200 p-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Target className="w-5 h-5 mr-2" />
            나의 재무 캐릭터: {analysis.animalType}
          </h3>
        </div>
        <div className="p-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="text-6xl">{getAnimalEmoji(analysis.animalType)}</div>
            <div className="flex-1">
              <h4 className="text-xl font-bold text-gray-900 mb-2">
                {analysis.animalType}
              </h4>
              <p className="text-gray-700 leading-relaxed">
                {analysis.animalTypeDescription}
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-4">
            <div className="flex justify-center items-baseline gap-2">
              <span className="text-gray-600">총점</span>
              <span className="text-4xl font-bold text-blue-600">
                {analysis.scores.total}
              </span>
              <span className="text-gray-600">/ 400</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4영역 점수 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200 p-4">
          <h3 className="text-lg font-semibold text-gray-900">4영역 재무성향 분석</h3>
        </div>
        <div className="p-6 space-y-6">
          {/* 지출 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <TrendingDown className="w-5 h-5 mr-2 text-purple-600" />
                <span className="font-semibold">지출 관리</span>
              </div>
              <span className={`font-bold ${getScoreColor(analysis.scores.spending)}`}>
                {analysis.scores.spending}점
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-purple-600 h-2 transition-all duration-300"
                style={{ width: `${analysis.scores.spending}%` }}
              />
            </div>
            <div className={`mt-2 text-sm ${getScoreBgColor(analysis.scores.spending)} rounded px-2 py-1 inline-block`}>
              {analysis.scores.spending >= 75 && '매우 우수'}
              {analysis.scores.spending >= 50 && analysis.scores.spending < 75 && '양호'}
              {analysis.scores.spending < 50 && '개선 필요'}
            </div>
          </div>

          {/* 저축 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <PiggyBank className="w-5 h-5 mr-2 text-green-600" />
                <span className="font-semibold">저축 습관</span>
              </div>
              <span className={`font-bold ${getScoreColor(analysis.scores.saving)}`}>
                {analysis.scores.saving}점
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-green-600 h-2 transition-all duration-300"
                style={{ width: `${analysis.scores.saving}%` }}
              />
            </div>
            <div className={`mt-2 text-sm ${getScoreBgColor(analysis.scores.saving)} rounded px-2 py-1 inline-block`}>
              {analysis.scores.saving >= 75 && '매우 우수'}
              {analysis.scores.saving >= 50 && analysis.scores.saving < 75 && '양호'}
              {analysis.scores.saving < 50 && '개선 필요'}
            </div>
          </div>

          {/* 투자 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
                <span className="font-semibold">투자 성향</span>
              </div>
              <span className={`font-bold ${getScoreColor(analysis.scores.investment)}`}>
                {analysis.scores.investment}점
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-blue-600 h-2 transition-all duration-300"
                style={{ width: `${analysis.scores.investment}%` }}
              />
            </div>
            <div className={`mt-2 text-sm ${getScoreBgColor(analysis.scores.investment)} rounded px-2 py-1 inline-block`}>
              {analysis.scores.investment >= 75 && '적극적'}
              {analysis.scores.investment >= 50 && analysis.scores.investment < 75 && '균형적'}
              {analysis.scores.investment < 50 && '보수적'}
            </div>
          </div>

          {/* 위험관리 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <Shield className="w-5 h-5 mr-2 text-orange-600" />
                <span className="font-semibold">위험 관리</span>
              </div>
              <span className={`font-bold ${getScoreColor(analysis.scores.riskManagement)}`}>
                {analysis.scores.riskManagement}점
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-orange-600 h-2 transition-all duration-300"
                style={{ width: `${analysis.scores.riskManagement}%` }}
              />
            </div>
            <div className={`mt-2 text-sm ${getScoreBgColor(analysis.scores.riskManagement)} rounded px-2 py-1 inline-block`}>
              {analysis.scores.riskManagement >= 75 && '매우 우수'}
              {analysis.scores.riskManagement >= 50 && analysis.scores.riskManagement < 75 && '양호'}
              {analysis.scores.riskManagement < 50 && '개선 필요'}
            </div>
          </div>
        </div>
      </div>

      {/* AI 추천사항 - 지출 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200 p-4">
          <h3 className="text-lg font-semibold text-purple-600 flex items-center">
            <TrendingDown className="w-5 h-5 mr-2" />
            지출 관리 추천사항
          </h3>
        </div>
        <div className="p-6">
          <ul className="space-y-2">
            {analysis.recommendations.spending.map((rec, idx) => (
              <li key={idx} className="flex items-start">
                <AlertCircle className="w-4 h-4 mr-2 mt-1 text-purple-500 flex-shrink-0" />
                <span className="text-gray-700">{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* AI 추천사항 - 저축 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200 p-4">
          <h3 className="text-lg font-semibold text-green-600 flex items-center">
            <PiggyBank className="w-5 h-5 mr-2" />
            저축 습관 추천사항
          </h3>
        </div>
        <div className="p-6">
          <ul className="space-y-2">
            {analysis.recommendations.saving.map((rec, idx) => (
              <li key={idx} className="flex items-start">
                <AlertCircle className="w-4 h-4 mr-2 mt-1 text-green-500 flex-shrink-0" />
                <span className="text-gray-700">{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* AI 추천사항 - 투자 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200 p-4">
          <h3 className="text-lg font-semibold text-blue-600 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            투자 전략 추천사항
          </h3>
        </div>
        <div className="p-6">
          <ul className="space-y-2">
            {analysis.recommendations.investment.map((rec, idx) => (
              <li key={idx} className="flex items-start">
                <AlertCircle className="w-4 h-4 mr-2 mt-1 text-blue-500 flex-shrink-0" />
                <span className="text-gray-700">{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* AI 추천사항 - 위험관리 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200 p-4">
          <h3 className="text-lg font-semibold text-orange-600 flex items-center">
            <Shield className="w-5 h-5 mr-2" />
            위험 관리 추천사항
          </h3>
        </div>
        <div className="p-6">
          <ul className="space-y-2">
            {analysis.recommendations.risk.map((rec, idx) => (
              <li key={idx} className="flex items-start">
                <AlertCircle className="w-4 h-4 mr-2 mt-1 text-orange-500 flex-shrink-0" />
                <span className="text-gray-700">{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* 소책자 다운로드 (Phase 2) */}
      {onDownloadBooklet && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">
                  상세 분석 리포트 (132페이지)
                </h4>
                <p className="text-sm text-gray-600">
                  개인 맞춤형 B5 소책자를 PDF로 다운로드하세요
                </p>
              </div>
              <button
                onClick={onDownloadBooklet}
                className="px-6 py-3 rounded-lg border-2 border-gray-300 bg-white text-gray-700 font-semibold transition-all hover:bg-gray-50 flex items-center"
              >
                <Download className="w-4 h-4 mr-2" />
                다운로드
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 푸터 안내 */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-600 text-center">
        <p>
          이 분석 결과는 AI 기반 재무진단 도구로 참고용입니다.
          전문 상담사와의 심층 상담을 통해 더욱 정확한 재무 설계가 가능합니다.
        </p>
      </div>
    </div>
  );
};

export default AruneResultView;

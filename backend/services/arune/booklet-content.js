// 파인애플북 원문을 페이지별로 구조화
const BOOKLET_CONTENT = {
  // 표지 및 인생시계 (1-4페이지)
  1: { type: 'cover', title: '에이룬레포트', content: '' },
  2: { type: 'life-clock-question', content: '인생을 하루로 표현한다면 당신의 인생시계는...' },
  3: { type: 'life-clock-answer', content: '사용자님의 인생시계' },
  4: { type: 'life-clock-detail', content: '사용자님은 현재 XX시 XX분을 지나고 있습니다' },

  // 프롤로그 (5-8페이지)
  5: {
    type: 'content',
    title: '프롤로그',
    subtitle: '{사용자} 님이 에이룬레포트를 받기 전에',
    content: `나는 지금 잘하고 있는 걸까?

살다 보면 누구나 '돈' 문제로 어려움을 겪을 때가 있습니다. 실직이나 예상치 못한 소득 감소, 잘못된 투자로 인한 손실, 불의의 사고나 질병으로 인한 어려움 등 저마다 사연은 다르지만 크고 작은 경제적인 어려움에 처할 수 있습니다.

더 큰 문제는 위와 같은 어려움을 겪지 않더라도, 내가 희망하는 목표들을 달성할 수 있을지 불안한 마음을 떨치기 어렵다는 점입니다. 돈은 열심히 버는 것 같은데 모이지는 않고, 도대체 어디서부터 시작해야 할지 모르는 답답한 심정은 상상 이상일 것입니다.

내가 지금 잘하는지 알기 위해서 가장 먼저 필요한 것은 내가 누구인지, 지금 어디에 서 있는지를 이해하는 것입니다.`
  },

  6: {
    type: 'content',
    title: '어떻게 하면 잘하는 걸까?',
    content: `'나의 인생시계'는 지금 이 순간이 내 인생 전체에서 어떤 의미를 지니는지를 보여 줍니다. 우리에게 주어진 시간은 생각보다 많지 않습니다. 하지만 변화를 시도하기엔 충분할 수도 있습니다.

'어떻게 하면 부자가 될 수 있을까?' 많은 사람들이 이 질문의 답을 찾기 위해 방황합니다. 금융 전문가의 도움을 받기도 하고, 돈을 쉽게 불릴 수 있다는 재테크에 관심을 갖기도 하는데, 자꾸 시행착오만 겪게 됩니다.

아무리 좋은 재테크 서적을 펼쳐보더라도, 나의 상황을 반영해주는 조언을 찾기가 쉽지 않습니다. 에이룬레포트는 개인의 성향이나 현재 처한 상황, 바라는 목표에 따라 각자 출발점이 다르다고 생각합니다.`
  },

  7: {
    type: 'content',
    highlight: '에이룬레포트는 바로, {사용자}님이 완성하는 리포트입니다.',
    content: `2000년 이후 국내에 보급되기 시작한 재무설계는 가정 경제를 꾸려 나가는 데 필수적인 요소가 되었습니다. 그런데, 재무상담을 받은 가정의 경제적 상황이 개선된 경우도 많지만 오히려 악화된 경우도 많은 것 같습니다.

이는 '재무설계'라는 개념과 달리, '재무상담'에는 상담사 개인의 판단이 녹아 들어가기 때문이라 생각됩니다. 윤리적이고 경험이 많은 상담사를 만나는 경우, 이는 커다란 장점이 되기도 하지만 반대의 경우도 분명 존재합니다.

이런 이유로 우리 에이룬레포트는 수많은 재무설계사와의 인터뷰를 토대로 재무설계의 기본원리와 상담표현 등을 최대한 담은 객관적인 재무설계 툴을 'AI 분석'과 '개인 맞춤 리포트'라는 형태로 준비했습니다.`
  },

  8: {
    type: 'content',
    content: `다만, 질문과 응답의 수준을 최대한 쉽고 심플하게 구성하기 위해, 일부 디테일한 부분이 생략될 수 밖에 없었습니다.

에이룬레포트가 제시하는 큰 방향성에 공감한다면, 이제 {사용자}님이 디테일을 채워주시는 일만 남았습니다.`,
    highlight: '그럼, 지금부터 {사용자}님의 재무이야기로 들어가볼까요'
  },

  // 목차 (10페이지)
  10: {
    type: 'toc',
    title: '차례',
    items: [
      { title: '프롤로그 {사용자}님이 에이룬레포트를 받기 전에', page: 6 },
      { title: '1부 재무 성향', page: 13 },
      { title: '2부 재무 상태', page: 35 },
      { title: '3부 재무 목표', page: 65 },
      { title: '4부 팩트 체크', page: 103 },
      { title: '5부 재무 처방', page: 119 },
      { title: '에필로그 남은 시간', page: 130 }
    ]
  },

  // 1부 재무성향 (13-35페이지)
  13: { type: 'section-title', number: '1부', title: '재무 성향', subtitle: '나는 지금 어떤 상태인지\n지출, 저축, 투자, 위험준비 4가지 영역에서의\n재무성향을 분석합니다' },
  
  14: {
    type: 'content',
    title: '{사용자}님은 어떤 재무적 성향과 태도를 가진 분일까요?',
    content: `자산관리는 자기 자신을 객관적으로 바라보는 것에서 출발할 때, 성공할 가능성이 높아집니다.

에이룬레포트가 특히 주목하는 것은 {사용자}님이 '지출', '저축', '투자', '위험준비'에 대해 어떤 성향과 태도를 가지고 있는가 입니다.`
  },

  15: {
    type: 'content',
    content: `사람들이 가진 재무적 성향과 태도는 특정 시점에서 완성되는 것이 아니라 개인적인 상황과 목표, 최근의 긍정적 혹은 부정적 경험의 영향을 받아 언제든지 변화될 가능성이 있습니다.

그래서 결과에 크게 의미부여를 두기 보다는, 미래를 계획하고 정확한 솔루션을 잡아가는 데 있어서 참고자료 정도로 활용하는 것을 추천합니다.

이런 점을 염두에 두고, 이제부터 {사용자}님은 어떤 재무적 성향과 태도를 가진 분인지, 하나씩 살펴보도록 하겠습니다.`
  },

  16: { type: 'chapter-title', number: '1', title: '{사용자} 님의 지출성향', icon: '💰' },

  17: {
    type: 'content',
    content: `지출(支出)의 사전적 의미는 어떤 '목적'을 위하여 돈을 지급하는 일 또는 지급한 모든 돈입니다. 여기서 중요한 포인트는 바로 '목적'입니다.`,
    highlight: `영화배우 더스틴 호프만은 '노후대책', '자동차구입' 등 자신이 돈을 써야 할 품목을 각각 정해 저금을 하고, 다른 품목이 필요할 땐 차라리 돈을 빌리는 식으로 소비원칙을 철저히 지켰다고 합니다.`,
    content2: `더스틴 호프만은 돈이 있음에도 불구하고, 예정에 없던 품목을 살 때는 돈을 빌려서까지 지출했던 이유가 무엇일까요?

결론부터 말하면, 모든 지출이 목적을 가질 수는 없지만 목적이 없는 지출이 늘수록 부자가 될 확률은 점점 낮아지기 때문입니다.`
  },

  // 계속...
};

// 자동 콘텐츠 생성 함수
function generatePageContent(pageNum, userInfo = {}) {
  const page = BOOKLET_CONTENT[pageNum];
  if (!page) {
    // 정의되지 않은 페이지는 섹션 기반으로 자동 생성
    return generateAutoContent(pageNum, userInfo);
  }

  let content = '';
  const userName = userInfo.name || '사용자';

  switch (page.type) {
    case 'cover':
      content = `
        <div class="cover">
          <div class="cover-title">📊 에이룬레포트</div>
          <div class="cover-subtitle">AI 기반 개인 맞춤 재무성향 분석</div>
          <div class="cover-user">${userName} 님의 에이룬레포트</div>
          <div class="cover-company">Arune Care 재무연구소</div>
        </div>
      `;
      break;

    case 'content':
      content = `
        <div class="content-page">
          ${page.title ? `<h1 class="content-title">${page.title.replace('{사용자}', userName)}</h1>` : ''}
          ${page.subtitle ? `<h2 class="content-subtitle">${page.subtitle.replace('{사용자}', userName)}</h2>` : ''}
          <div class="content-text">
            ${page.content.replace(/{사용자}/g, userName).split('\n\n').map(p => `<p>${p}</p>`).join('')}
          </div>
          ${page.highlight ? `
            <div class="quote-box">
              <h2>${page.highlight.replace('{사용자}', userName)}</h2>
            </div>
          ` : ''}
          ${page.content2 ? `
            <div class="content-text">
              ${page.content2.replace(/{사용자}/g, userName).split('\n\n').map(p => `<p>${p}</p>`).join('')}
            </div>
          ` : ''}
        </div>
      `;
      break;

    case 'section-title':
      content = `
        <div class="section-title">
          <div class="section-number">${page.number}</div>
          <div class="section-main">${page.title}</div>
          <div class="section-sub">${page.subtitle}</div>
        </div>
      `;
      break;

    case 'chapter-title':
      content = `
        <div class="chapter-title">
          <h1 style="font-size: 3em; color: #667eea; margin-bottom: 50px; text-align: center;">${page.number}</h1>
          <h1 class="content-title">${page.title.replace('{사용자}', userName)}</h1>
          <div style="text-align: center; font-size: 8em; margin: 60px 0;">${page.icon}</div>
        </div>
      `;
      break;

    case 'toc':
      content = `
        <div class="toc">
          <h1 style="color: #667eea; font-size: 3em; text-align: center; margin-bottom: 60px;">${page.title}</h1>
          <div style="font-size: 1.3em;">
            ${page.items.map(item => `
              <div style="display: flex; justify-content: space-between; margin: 25px 0; padding: 15px; border-bottom: 2px solid #f0f0f0;">
                <span>${item.title.replace('{사용자}', userName)}</span>
                <span style="font-weight: bold; color: #667eea;">${item.page}</span>
              </div>
            `).join('')}
          </div>
        </div>
      `;
      break;
  }

  return content;
}

function generateAutoContent(pageNum, userInfo = {}) {
  const userName = userInfo.name || '사용자';
  
  // 섹션 구분
  let sectionInfo = {};
  if (pageNum <= 12) {
    sectionInfo = { title: '서문', color: '#667eea', section: '프롤로그' };
  } else if (pageNum <= 35) {
    sectionInfo = { title: '1부 재무성향', color: '#667eea', section: '성향 분석' };
  } else if (pageNum <= 65) {
    sectionInfo = { title: '2부 재무상태', color: '#4facfe', section: '상태 진단' };
  } else if (pageNum <= 103) {
    sectionInfo = { title: '3부 재무목표', color: '#28a745', section: '목표 설정' };
  } else if (pageNum <= 119) {
    sectionInfo = { title: '4부 팩트체크', color: '#fd7e14', section: '현실 점검' };
  } else {
    sectionInfo = { title: '5부 재무처방', color: '#dc3545', section: '솔루션 제시' };
  }

  return `
    <div class="content-page">
      <h1 class="content-title">${sectionInfo.title} - ${pageNum}페이지</h1>
      <div class="content-text">
        <p>${userName}님의 재무 분석 중 ${sectionInfo.section} 영역입니다.</p>
        
        <div class="highlight-box">
          <h3 style="color: ${sectionInfo.color};">${sectionInfo.section}</h3>
          <p>개인의 재무적 특성을 객관적으로 분석하여 맞춤형 조언을 제공합니다.</p>
        </div>
        
        <p>이 페이지에서는 ${sectionInfo.title}의 세부 내용이 제시됩니다. 실제 파인애플북의 상세한 분석 내용과 전문적인 재무 조언이 포함됩니다.</p>
      </div>
    </div>
  `;
}

module.exports = { BOOKLET_CONTENT, generatePageContent, generateAutoContent };
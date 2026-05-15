// ============================================================================
// Knox_Knox / 해일미리 — 메신저 콘텐츠 단일 소스
// 인물·채팅방·메시지·테마·Webhook 설정을 모두 이 파일에서 관리합니다.
// ============================================================================

// ============================================================
// KNOCK_CONFIG — n8n Webhook 연동 설정
// ⚠️ URL·발신자 변경 시 이 파일에서만 수정하세요
// ============================================================
const KNOCK_CONFIG = {
  // useTestWebhook: true  → 테스트 URL (n8n 워크플로우 Inactive 상태 / 개발 중)
  // useTestWebhook: false → 프로덕션 URL (n8n 워크플로우 Active 상태 / 데모 당일)
  useTestWebhook: true,

  webhookUrl: {
    test:       'https://wontaeryu.app.n8n.cloud/webhook-test/knox-message',
    production: 'https://wontaeryu.app.n8n.cloud/webhook/knox-message',
  },

  // 위키 적재 Webhook (Scene 2 플라이휠 시연용)
  wikiWebhookUrl: {
    test:       'https://wontaeryu.app.n8n.cloud/webhook-test/knox-wiki-add',
    production: 'https://wontaeryu.app.n8n.cloud/webhook/knox-wiki-add',
  },

  // Knox 목업 발신자 정보 (n8n 질문 정규화 노드가 읽는 필드)
  // 시나리오 변경 시 이 값만 수정하세요
  sender: {
    id:   'user_samsung',
    name: '김삼성',
    dept: '서비스개발팀',
  },
};
// ============================================================

// ── 디자인 토큰 (변경 금지 — 공통 디자인 시스템) ─────────────────────────────
const KNOCK_THEME = {
  bg:            '#0A0C0F',
  surface:       '#1A1F22',
  surfaceHi:     '#222A2F',
  divider:       '#2A2F36',
  border:        '#2A2F36',
  secure:        '#2ECC71',
  accent:        '#4F8AFE',
  accentSoft:    '#2A3B5C',
  warn:          '#F39C12',
  danger:        '#E74C3C',
  badge:         '#E74C3C',
  textPrimary:   '#FFFFFF',
  textSecondary: '#8A9BA8',
  textTertiary:  '#5C6770',
  bubbleMe:      '#3B4D6E',
  bubbleOther:   '#252B30',
};

const AVATAR_BG = '#2A3B5C';
const AVATAR_FG = '#7FA9F4';

// ── 인물 ─────────────────────────────────────────────────────────────────────
const PEOPLE = {
  samsung: { id: 'samsung', name: '김삼성',  initial: '김', dept: '서비스개발팀',   status: 'online' },
  boan:    { id: 'boan',    name: '김보안',  initial: '김', dept: '정보보호실',     status: 'online' },
  moni:    { id: 'moni',    name: '정모니',  initial: '정', dept: '모니모사업팀',   status: 'online' },
  ryu:     { id: 'ryu',     name: '류원태',  initial: '류', dept: '모니모마케팅팀', status: 'online' },
  rookie:  { id: 'rookie',  name: '김신입',  initial: '김', dept: '서비스개발팀',   status: 'online' },
};

// ── 채팅방 목록 ──────────────────────────────────────────────────────────────
const CHATS = [
  {
    id: 'c_mau',
    type: 'dm',
    person: PEOPLE.samsung,
    title: '김삼성',
    lastMessage: '모니모 MAU 구하는 SQL 쿼리 알려주세요',
    time: '16:42',
    unread: 1,
    secure: false,
    feed: false,
    isAnnouncement: false,
  },
  {
    id: 'c_security',
    type: 'group',
    title: '보안성 검토 요청 채널',
    members: 8,
    lastMessage: '김보안: 검토 키 값 발급 URL 공유드립니다',
    time: '15:30',
    unread: 3,
    secure: true,
    feed: true,
  },
  {
    id: 'c_rookie',
    type: 'dm',
    person: PEOPLE.rookie,
    title: '김신입',
    lastMessage: 'Claude API 키는 어떻게 발급받나요?',
    time: '14:15',
    unread: 1,
    secure: false,
    feed: false,
    isAnnouncement: false,
  },
  {
    id: 'c_wiki',
    type: 'dm',
    person: PEOPLE.moni,
    title: '정모니',
    lastMessage: '위키에 추가해뒀습니다 👍',
    time: '13:00',
    unread: 0,
    secure: false,
    feed: false,
  },
];

// ── 채팅방별 메시지 스레드 ───────────────────────────────────────────────────
const MESSAGES = {
  // Scene 1 — Action A 시연용 (AI 초안 생성 흐름)
  c_mau: [
    { id: 'm_mau_sys', from: 'system', kind: 'system', text: '암호화된 대화방입니다.' },
    { id: 'm_mau_1', from: PEOPLE.samsung, text: '안녕하세요! 업무 관련해서 여쭤볼게 있어서요.', time: '16:38' },
    { id: 'm_mau_2', from: PEOPLE.samsung, text: '모니모 MAU 구하는 SQL 쿼리 알려주세요. SC_MONIMO_USER_STAT 테이블 쓰면 된다고 하던데 정확한 쿼리를 모르겠어요.', time: '16:39' },
    { id: 'm_mau_3', from: 'me', text: '잠깐만요, 확인해볼게요 🙏', time: '16:40', read: 1 },
  ],

  // Scene 2 — Action B 시연용 (AI 미응답 → 직접 응대 → Wiki 적재 → 플라이휠)
  c_rookie: [
    { id: 'm_rookie_sys', from: 'system', kind: 'system', text: '암호화된 대화방입니다.' },
    { id: 'm_rookie_1', from: PEOPLE.rookie, text: '안녕하세요! 신입 김신입입니다. 여쭤볼 게 있어서요.', time: '14:10' },
    { id: 'm_rookie_2', from: PEOPLE.rookie, text: 'Claude API 키는 어떻게 발급받나요? 개발 업무에 필요한데 경로를 모르겠어요.', time: '14:11' },
    { id: 'm_rookie_3', from: 'me', text: '확인해서 알려드릴게요!', time: '14:12', read: 1 },
  ],
};

// ── 미정의 채팅방의 기본 스레드 ──────────────────────────────────────────────
const DEFAULT_THREAD = (chat) => [
  { id: 'm1', from: 'system', kind: 'system', text: '암호화된 대화방입니다.' },
  { id: 'm2', from: 'other', authorName: chat.title, text: chat.lastMessage || '안녕하세요', time: chat.time },
];

Object.assign(window, {
  KNOCK_CONFIG, KNOCK_THEME, PEOPLE, CHATS, MESSAGES, DEFAULT_THREAD,
  AVATAR_BG, AVATAR_FG,
});

// data.jsx — 콘텐츠 수정은 이 파일에서만

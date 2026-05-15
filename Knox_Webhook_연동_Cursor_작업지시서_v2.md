# Knox Mockup × n8n Webhook 연동 — Cursor 작업지시서 v2.0

> **작성 기준**: n8n 워크플로우 `Knock_Knox` (ID: `qGddk1phr96Kuz6t`) 실구조 분석 +  
> `FOLDER_STRUCTURE.md` / `README.md` 기준 최신 폴더 구조 반영 (2026-05-15)  
> **v1.0 → v2.0 주요 변경**: 파일 경로 전면 업데이트 (`messenger/` 하위), `android-frame.jsx` 수정 금지 대상 추가, 데모 시나리오 2종 확정, 데모 체크리스트 README 기준으로 정합

---

## ⚠️ 작업 전 반드시 읽을 원칙 (절대 위반 금지)

1. `chat-list.jsx`, `chat-room.jsx`, `icons.jsx`, **`android-frame.jsx`** 의 UI 구조·디자인 토큰·레이아웃은 **단 한 줄도 수정하지 않는다**
2. 인물·채팅방·메시지 콘텐츠는 **`messenger/data.jsx` 에서만** 수정한다
3. Webhook 연동 로직은 **`chat-room.jsx`의 기존 send 이벤트 핸들러에 최소 침습적으로 추가**한다 (기존 `autoReply` 로직은 반드시 유지)
4. 추가 npm 패키지나 빌드 툴은 절대 도입하지 않는다 — CDN 기반 React 18 + Babel Standalone 구조 유지
5. n8n Webhook URL은 **절대 하드코딩하지 않는다** — `data.jsx`의 `KNOCK_CONFIG` 객체에서만 관리한다
6. `wiki-add.html` / `wiki-add.bundle.html` 은 legacy placeholder로 이번 작업 범위 밖이다. 위키 기능의 실제 구현체는 `console/wiki/add/page.tsx` 이다

---

## 📋 사전 확인 사항 (작업 시작 전 체크)

### n8n 워크플로우 현황 (실제 분석 결과)

| 항목 | 값 |
|---|---|
| 워크플로우 이름 | `Knock_Knox` |
| 워크플로우 ID | `qGddk1phr96Kuz6t` |
| Webhook Path | `knox-message` |
| HTTP Method | `POST` |
| 현재 활성 상태 | **Inactive (비활성)** |
| **테스트 URL** | `https://wontaeryu.app.n8n.cloud/webhook-test/knox-message` |
| **프로덕션 URL** | `https://wontaeryu.app.n8n.cloud/webhook/knox-message` |
| **위키 적재 테스트 URL** | `https://wontaeryu.app.n8n.cloud/webhook-test/knox-wiki-add` |

> **⚠️ 현재 워크플로우가 Inactive 상태입니다.**  
> - 개발/테스트 중: **테스트 URL** 사용 (`useTestWebhook: true`)  
> - 데모 당일 Active 전환 후: **프로덕션 URL** 로 전환 (`useTestWebhook: false`)  
> - 전환은 `messenger/data.jsx`의 `KNOCK_CONFIG.useTestWebhook` 플래그 하나로 처리

### n8n이 기대하는 Request Body (실구조 확인)

```json
{
  "question":     "모니모 MAU 구하는 SQL 쿼리 알려주세요",
  "sender_id":    "user_samsung",
  "sender_name":  "김삼성",
  "sender_dept":  "서비스개발팀",
  "channel_id":   "c_mau"
}
```

> 이 5개 필드가 정확히 맞아야 n8n `질문 정규화` 노드가 정상 처리합니다.  
> 필드명 오타 시 n8n 내부에서 빈 문자열로 처리되어 RAG 결과가 왜곡됩니다.

### n8n Webhook 즉시 응답 (Knox 목업이 받는 것)

```json
{
  "status": "received",
  "message": "처리 완료"
}
```

> Knox 목업은 이 즉시 응답을 받아 **전송 완료 상태만** 표시합니다.  
> AI 초안 결과(Action A/B)는 n8n이 `console/api/console-update`로 별도 POST합니다.  
> Knox는 그 결과를 받지 않습니다 — 결과는 검수 콘솔 화면에서 확인합니다.

---

## 🗂️ 파일 구조 파악 (작업 전 필수 확인)

**이번 작업의 실제 대상 경로** — Cursor에서 아래 경로로 파일을 엽니다:

```
C:\dev\Knock_Knox\
│
├── messenger/                          ← ★ 이번 작업의 루트
│   ├── Knock Messenger.html            ← 진입점. React/Babel CDN 로드. 수정 금지
│   ├── Knock Messenger.bundle.html     ← 단일 번들 배포용. 수정 금지
│   ├── data.jsx                        ← ★ 콘텐츠+Webhook 설정 단일 소스. 여기만 수정
│   ├── chat-list.jsx                   ← 채팅 목록 화면. 수정 금지
│   ├── chat-room.jsx                   ← ★ send 핸들러만 최소 수정
│   ├── icons.jsx                       ← SVG 아이콘. 수정 금지
│   ├── android-frame.jsx               ← 디바이스 프레임 UI. 수정 금지 (신규 확인)
│   ├── wiki-add.html                   ← legacy placeholder. 이번 작업 범위 외
│   └── wiki-add.bundle.html            ← legacy placeholder. 이번 작업 범위 외
│
└── console/                            ← Next.js 앱. 이번 작업 범위 외
    └── app/
        ├── console/page.tsx            ← 검수 콘솔 (이번 작업 범위 외)
        ├── wiki/add/page.tsx           ← 위키 적재 실제 구현체 (이번 작업 범위 외)
        └── api/console-update/
            └── route.ts               ← n8n 결과 수신 엔드포인트 (이번 작업 범위 외)
```

> **⚠️ 경로 주의**: 모든 파일은 `C:\dev\Knock_Knox\messenger\` 하위에 있습니다.  
> 루트(`C:\dev\Knock_Knox\`) 직접 하위가 아닙니다. Cursor에서 폴더를 잘못 열면 파일을 못 찾습니다.

---

## 🔨 작업 단계 (Step by Step)

---

### STEP 1 — Cursor에서 작업 폴더 열기

**목적**: Cursor가 올바른 경로를 컨텍스트로 잡도록 설정

```
1. Cursor 실행
2. File → Open Folder → C:\dev\Knock_Knox 선택
   (messenger/ 하위가 아닌 Knock_Knox 루트 전체를 열어야 함)
3. 좌측 파일 트리에서 messenger/ 폴더 확장
4. 다음 파일들이 보이는지 확인:
   ✅ messenger/data.jsx
   ✅ messenger/chat-room.jsx
   ✅ messenger/chat-list.jsx
   ✅ messenger/android-frame.jsx
   ✅ messenger/icons.jsx
```

---

### STEP 2 — `messenger/data.jsx` 상단에 `KNOCK_CONFIG` 추가

**목적**: Webhook URL과 발신자 정보를 한 곳에서 관리

**작업 위치**: `messenger/data.jsx` 파일 최상단 — 기존 `KNOCK_THEME` 객체 **바로 위**

**추가할 코드**:

```javascript
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
```

**검증**: 저장 후 브라우저에서 `messenger/Knock Messenger.html`을 열어 콘솔 에러 없는지 확인

---

### STEP 3 — `messenger/chat-room.jsx`에서 기존 핸들러 구조 파악

**목적**: 기존 send 핸들러 위치를 파악하고, 코드 추가 지점 결정

**작업**:

1. `messenger/chat-room.jsx` 열기
2. `Ctrl+F`로 다음 키워드를 순서대로 검색:
   - `handleSend` 또는 `onSend` 또는 `sendMessage`
   - `autoReply`
   - `setMessages`
   - `useState` (state 선언 위치 파악)

3. 메시지 전송 흐름 파악:
   ```
   사용자 입력 → [전송 버튼 / Enter 키] → handleSend() → setMessages() → autoReply()
   ```

4. `handleSend` 함수 전체를 복사해서 별도 파일(예: `handleSend_backup.txt`)에 저장  
   → 작업 실패 시 복원 기준점

5. 입력값 변수명 확인: `trimmedText`, `inputText`, `message`, `text` 중 실제 사용 중인 것  
   → STEP 5에서 이 변수명을 그대로 씁니다

> **이 단계에서 코드를 수정하지 마세요.** 구조 파악만 합니다.

---

### STEP 4 — `messenger/chat-room.jsx`에 Webhook 전송 함수 추가

**목적**: n8n으로 질문을 POST하는 독립 함수 추가 (기존 로직과 완전 분리)

**작업 위치**: `ChatRoom` 컴포넌트 함수 선언부 안쪽, `handleSend` 함수 **바로 위**

**추가할 코드**:

```javascript
// ── [추가] n8n Webhook 전송 함수 ────────────────────────────
// 기존 채팅 UI 로직과 완전히 분리된 독립 함수
// 실패해도 채팅 전송은 정상 동작 (non-blocking 설계)
const sendToKnoxWebhook = async (messageText, channelId) => {
  const url = KNOCK_CONFIG.useTestWebhook
    ? KNOCK_CONFIG.webhookUrl.test
    : KNOCK_CONFIG.webhookUrl.production;

  const payload = {
    question:    messageText,
    sender_id:   KNOCK_CONFIG.sender.id,
    sender_name: KNOCK_CONFIG.sender.name,
    sender_dept: KNOCK_CONFIG.sender.dept,
    channel_id:  channelId || 'unknown',
  };

  try {
    const response = await fetch(url, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });

    if (!response.ok) {
      console.warn('[Knox→n8n] 응답 이상:', response.status, response.statusText);
      return { success: false, status: response.status };
    }

    const data = await response.json();
    // data = { status: "received", message: "처리 완료" }
    console.log('[Knox→n8n] 전송 완료:', data);
    return { success: true, data };

  } catch (error) {
    // 네트워크 오류 — 채팅 전송에는 영향 없음
    console.error('[Knox→n8n] 전송 실패:', error.message);
    return { success: false, error: error.message };
  }
};
// ────────────────────────────────────────────────────────────
```

**검증**: 저장 후 브라우저 콘솔에 에러 없는지 확인 (선언만이므로 호출 전까지 동작 없음)

---

### STEP 5 — `webhookStatus` state 추가

**목적**: 전송 상태를 UI에 반영하기 위한 state 선언

**작업 위치**: `chat-room.jsx` 내 기존 `useState` 선언들이 모여 있는 곳 바로 아래

```javascript
// ── [추가] Webhook 전송 상태 state ──────────────────────────
const [webhookStatus, setWebhookStatus] = React.useState(null);
// null: 기본 | 'sending': 전송중 | 'sent': 접수완료 | 'error': 오류
// ────────────────────────────────────────────────────────────
```

---

### STEP 6 — `handleSend` 함수에 Webhook 호출 삽입

**목적**: 메시지 전송 시 n8n Webhook을 비동기로 호출하고 상태를 UI에 반영

**핵심 규칙**:
- 기존 `setMessages(...)` 호출은 **절대 건드리지 않는다**
- 기존 `autoReply` 로직은 **절대 건드리지 않는다**
- Webhook 호출은 `setMessages` 이후, `autoReply` **이전 또는 이후** 어느 쪽이든 상관없음
- `await` 없이 `.then()` 체이닝으로 non-blocking 처리

**삽입할 코드** — 기존 `setMessages(...)` 직후에 추가:

```javascript
// ── [추가] n8n Webhook 비동기 전송 ──────────────────────────
// ※ STEP 3에서 확인한 실제 입력값 변수명으로 교체하세요
//   예) trimmedText, inputText, message, text 중 실제 사용 중인 것
setWebhookStatus('sending');
sendToKnoxWebhook(trimmedText, currentChat?.id)
  .then(result => {
    setWebhookStatus(result.success ? 'sent' : 'error');
    setTimeout(() => setWebhookStatus(null), 3000); // 3초 후 초기화
  });
// ────────────────────────────────────────────────────────────
```

> **변수명 체크**: `trimmedText` 는 예시입니다.  
> STEP 3에서 확인한 실제 입력값 변수명(예: `inputText`, `msg` 등)으로 반드시 교체하세요.  
> 변수명이 틀리면 `ReferenceError`로 채팅 전체가 멈춥니다.

---

### STEP 7 — 전송 상태 UI 피드백 JSX 추가

**목적**: 데모 시연 시 심사위원이 "Webhook이 실제로 작동 중"임을 시각으로 확인

**조건**: 기존 UI 구조·디자인 토큰 변경 없이, 입력창 영역에 상태 텍스트만 추가

**작업 위치**: `chat-room.jsx`의 메시지 입력창 JSX 바로 위 (입력창 div 상단)

```jsx
{/* ── [추가] Webhook 전송 상태 피드백 ── */}
{webhookStatus && (
  <div style={{
    fontSize: '11px',
    padding: '2px 12px 4px',
    color: webhookStatus === 'sent'
             ? KNOCK_THEME.secure          // #2ECC71 초록
             : webhookStatus === 'error'
               ? '#E74C3C'                 // 빨강
               : KNOCK_THEME.textSecondary, // 회색
    textAlign: 'right',
    transition: 'opacity 0.2s',
  }}>
    {webhookStatus === 'sending' && '⏳ AI Agent에 전달 중...'}
    {webhookStatus === 'sent'    && '✅ AI Agent 접수 완료'}
    {webhookStatus === 'error'   && '⚠️ 전송 실패 (콘솔 확인)'}
  </div>
)}
{/* ─────────────────────────────────── */}
```

> **토큰 변수명 주의**: `KNOCK_THEME.secure`, `KNOCK_THEME.textSecondary` 는  
> `messenger/data.jsx`에 정의된 실제 키 이름과 일치해야 합니다.  
> 다를 경우 `data.jsx`에서 실제 키 이름을 확인 후 교체하세요.

---

### STEP 8 — `messenger/data.jsx` 시나리오 데이터 정비

**목적**: README의 데모 시나리오 2종과 data.jsx 콘텐츠를 일치시키기

**Scene 1 — Action A 시연 (김삼성, 모니모 MAU SQL)**

`CHATS` 배열에 아래 항목 추가/확인:

```javascript
{
  id: 'c_mau',
  type: 'dm',
  person: PEOPLE.samsung,      // PEOPLE.samsung 객체 참조
  title: '김삼성',
  lastMessage: '모니모 MAU 구하는 SQL 쿼리 알려주세요',
  time: '16:42',
  unread: 1,
  secure: false,
  feed: false,
  isAnnouncement: false,
},
```

`MESSAGES['c_mau']` 스레드 추가:

```javascript
MESSAGES['c_mau'] = [
  {
    id: 'm_mau_sys',
    from: 'system', kind: 'system',
    text: '암호화된 대화방입니다.',
  },
  {
    id: 'm_mau_1',
    from: PEOPLE.samsung,
    text: '안녕하세요! 업무 관련해서 여쭤볼게 있어서요.',
    time: '16:38',
  },
  {
    id: 'm_mau_2',
    from: PEOPLE.samsung,
    text: '모니모 MAU 구하는 SQL 쿼리 알려주세요. SC_MONIMO_USER_STAT 테이블 쓰면 된다고 하던데 정확한 쿼리를 모르겠어요.',
    time: '16:39',
  },
  {
    id: 'm_mau_3',
    from: 'me',
    text: '잠깐만요, 확인해볼게요 🙏',
    time: '16:40',
    read: 1,
  },
  // ★ 이 채팅방에서 메시지 전송 → n8n Webhook 트리거 → Action A 흐름 시연
];
```

**Scene 2 — Action B 시연 (김신입, Claude API 키 발급)**

`CHATS` 배열에 아래 항목 추가/확인:

```javascript
{
  id: 'c_rookie',
  type: 'dm',
  person: PEOPLE.rookie,       // PEOPLE.rookie 객체 참조
  title: '김신입',
  lastMessage: 'Claude API 키는 어떻게 발급받나요?',
  time: '14:15',
  unread: 1,
  secure: false,
  feed: false,
  isAnnouncement: false,
},
```

`MESSAGES['c_rookie']` 스레드 추가:

```javascript
MESSAGES['c_rookie'] = [
  {
    id: 'm_rookie_sys',
    from: 'system', kind: 'system',
    text: '암호화된 대화방입니다.',
  },
  {
    id: 'm_rookie_1',
    from: PEOPLE.rookie,
    text: '안녕하세요! 신입 김신입입니다. 여쭤볼 게 있어서요.',
    time: '14:10',
  },
  {
    id: 'm_rookie_2',
    from: PEOPLE.rookie,
    text: 'Claude API 키는 어떻게 발급받나요? 개발 업무에 필요한데 경로를 모르겠어요.',
    time: '14:11',
  },
  {
    id: 'm_rookie_3',
    from: 'me',
    text: '확인해서 알려드릴게요!',
    time: '14:12',
    read: 1,
  },
  // ★ 이 채팅방에서 메시지 전송 → n8n Webhook 트리거 → Action B 흐름 시연
  // ★ 현업 응대 후 메시지 우클릭 → "위키에 추가하기" → console/wiki/add 페이지
];
```

`PEOPLE` 객체에 `rookie` 추가 (없으면):

```javascript
rookie: {
  id: 'rookie', name: '김신입', initial: '김',
  dept: '서비스개발팀', status: 'online'
},
```

> **`initial` 충돌 주의**: `rookie`의 `initial: '김'`이 기존 `김보안`, `김삼성`과 겹칩니다.  
> `chat-list.jsx`의 `personHue` 객체에 `rookie: <색상값>` 한 줄 추가가 필요합니다.  
> 이 작업만은 `chat-list.jsx` 수정 허용 (색상 추가는 디자인 변경 아님 — HANDOFF.md §6 예외 규정).

---

### STEP 9 — 로컬 테스트 및 검증

**테스트 환경 준비**:

1. n8n 대시보드 → `Knock_Knox` 워크플로우 → **"Test Workflow"** 클릭하여 Webhook 수신 대기 상태 진입
2. `messenger/data.jsx`의 `useTestWebhook: true` 확인
3. 브라우저에서 `messenger/Knock Messenger.html` 열기 (더블클릭)

**시나리오 1 — Scene 1 테스트 (Action A 흐름)**:

```
1. 'c_mau' 채팅방 (김삼성 DM) 진입
2. 입력창에 "모니모 MAU 구하는 SQL 쿼리 알려주세요" 입력
3. Enter 또는 전송 버튼 클릭
4. 확인사항:
   ✅ 채팅방에 내 메시지 말풍선 표시 (기존 UI 동작 유지)
   ✅ autoReply 더미 응답도 정상 표시
   ✅ 입력창 위: "⏳ AI Agent에 전달 중..." → "✅ AI Agent 접수 완료" 전환
   ✅ 브라우저 Network 탭: POST knox-message 요청 발생
   ✅ Request Body 확인:
      { "question": "모니모 MAU 구하는 SQL 쿼리 알려주세요",
        "sender_id": "user_samsung",
        "sender_name": "김삼성",
        "sender_dept": "서비스개발팀",
        "channel_id": "c_mau" }
   ✅ Response: { "status": "received", "message": "처리 완료" }
   ✅ n8n 실행 화면에서 워크플로우 1회 트리거 확인
```

**시나리오 2 — Scene 2 테스트 (Action B 흐름)**:

```
1. 'c_rookie' 채팅방 (김신입 DM) 진입
2. "Claude API 키는 어떻게 발급받나요?" 입력 후 전송
3. 확인사항 (Scene 1과 동일한 체크 + 추가):
   ✅ channel_id: "c_rookie" 로 전달됨
   ✅ n8n에서 유사도 < 0.85 → Action B 분기 처리
      (시드 데이터에 유사 질문 없으면 자동으로 Action B)
```

**오류 내성 테스트**:

```
1. data.jsx의 webhookUrl.test 를 임시로 잘못된 URL로 변경
2. 메시지 전송 시도
3. 확인사항:
   ✅ 채팅 메시지는 정상 전송됨 (Webhook 오류와 무관)
   ✅ "⚠️ 전송 실패" 상태 텍스트 표시 후 3초 뒤 소멸
   ✅ 페이지 크래시 없음
4. URL 원복 후 재확인
```

---

### STEP 10 — 데모 당일 전환 가이드

**데모 당일 순서** (README 기준 체크리스트 반영):

```
□ 1. Supabase 프로젝트 생존 확인 (SQL Editor에서 SELECT 1 실행)
□ 2. inquiries 테이블 비어있음 확인 (테스트 데이터 DELETE)
□ 3. qa_pairs 30건 시드 + embedding 적재 완료 확인
□ 4. n8n 워크플로우 2개 모두 Active 전환
     - Knock_Knox (knox-message)
     - Knox Wiki Add (knox-wiki-add) — 워크플로우 B
□ 5. console/.env.local 의 CONSOLE_API_SECRET 과 n8n HTTP Request 헤더 값 일치 확인
□ 6. messenger/data.jsx 에서 useTestWebhook: false 로 변경
□ 7. Vercel 배포 도메인 (console) 접속 정상 확인
□ 8. Realtime 연결 인디케이터 🟢 초록 확인
□ 9. Scene 1 리허설 1회 (Action A: 김삼성 → MAU SQL)
□ 10. Scene 2 리허설 1회 (Action B: 김신입 → API 키 → Wiki → 플라이휠)
```

**URL 전환 방법**:

```javascript
// messenger/data.jsx 에서:
useTestWebhook: false,  // ← true → false 로 변경
```

변경 후 브라우저 강력 새로고침 (`Ctrl+Shift+R`)

---

## 🚨 자주 발생하는 오류 및 대처법

| 오류 상황 | 원인 | 해결 방법 |
|---|---|---|
| `Cannot find file 'data.jsx'` | 루트가 아닌 messenger/ 하위에 있음 | `C:\dev\Knock_Knox\messenger\data.jsx` 경로로 열기 |
| Network 탭에 요청이 안 보임 | `sendToKnoxWebhook` 호출 위치 잘못됨 | `handleSend` 내부 `setMessages` 이후에 위치하는지 확인 |
| `ReferenceError: trimmedText is not defined` | 입력값 변수명 불일치 | STEP 3에서 확인한 실제 변수명으로 교체 |
| `KNOCK_CONFIG is not defined` | data.jsx 로드 순서 문제 | KNOCK_CONFIG 선언이 KNOCK_THEME 위에 있는지 확인 |
| 응답 200인데 n8n에서 안 받음 | n8n 수신 대기 상태 아님 | n8n "Test Workflow" 클릭 후 재시도 |
| CORS 오류 | n8n 클라우드 CORS 미설정 | n8n Webhook 노드 → 우측 설정 → Allowed Origins: `*` 추가 |
| `KNOCK_THEME.secure is not defined` | data.jsx 내 실제 토큰 키명 불일치 | data.jsx에서 secure 색상 키 이름 확인 후 교체 |
| rookie 아바타 색상 겹침 | personHue에 rookie 미등록 | chat-list.jsx의 personHue 객체에 `rookie: <hue값>` 추가 |

---

## 📎 참고: n8n 워크플로우 실제 노드 흐름

```
[1] Webhook Trigger  POST /knox-message
         ↓
[2] 질문 정규화 (Set Node)
    question_normalized, sender_dept, sender_name, sender_id, channel_id
         ↓
[3] OpenAI Embeddings (text-embedding-3-small)
    + Q-Q 유사도 검색 (Supabase Vector Store, qa_pairs, match_documents, Top 3)
         ↓
[4] 유사도 임계점 분기 (IF Node)
    $json[0].score >= 0.85 ?

         ↓ TRUE (Action A)              ↓ FALSE (Action B)
[5-A] Answer Agent (Claude Sonnet 4.6)  [5-B] Set Node (FIELD_DIRECT 응답 생성)
         ↓                                       ↓
[6-A] HTTP POST → /api/console-update   [6-B] HTTP POST → /api/console-update
    { mode:"AI_DRAFT", draft,               { mode:"FIELD_DIRECT",
      confidence, sources }                   top_similarity, top_match }
         ↓                                       ↓
              [7] Webhook 응답 (즉시)
              { status:"received", message:"처리 완료" }
                       ↑
              Knox 목업이 받는 것은 여기까지
```

AI 처리 결과([6-A]/[6-B])는 `console/app/api/console-update/route.ts` 가 수신하여  
Supabase `inquiries` 테이블에 INSERT → Realtime으로 검수 콘솔 화면에 즉시 표시됩니다.

---

## ✅ 최종 완료 기준

모든 STEP 완료 후 아래가 전부 충족되면 이 작업지시서의 목표 달성:

- [ ] `messenger/data.jsx` 에 `KNOCK_CONFIG` 추가 완료 (테스트/프로덕션 URL 분기 포함)
- [ ] `messenger/chat-room.jsx` 에 `sendToKnoxWebhook` 함수 추가 완료
- [ ] `messenger/chat-room.jsx` 의 `handleSend` 에 non-blocking Webhook 호출 삽입 완료
- [ ] 입력창 상태 피드백 UI ("⏳ → ✅ / ⚠️") 정상 표시
- [ ] Scene 1 (c_mau): 메시지 전송 시 n8n Webhook POST 요청 발생 확인
- [ ] Scene 2 (c_rookie): 메시지 전송 시 n8n Webhook POST 요청 발생 확인
- [ ] Request Body 5개 필드 정확히 전달 (channel_id가 각 채팅방 id와 일치)
- [ ] n8n 실행 로그에서 워크플로우 트리거 확인
- [ ] Webhook 실패 시에도 채팅 UI 정상 동작 (non-blocking)
- [ ] 기존 UI 디자인·레이아웃 변화 없음 (android-frame.jsx 포함)
- [ ] `useTestWebhook` 플래그 하나로 테스트↔프로덕션 URL 전환 동작 확인

---

*작업지시서 버전: v2.0 | 기준 워크플로우: Knock_Knox (qGddk1phr96Kuz6t)*  
*폴더 구조 기준: FOLDER_STRUCTURE.md + README.md (2026-05-15)*  
*v1.0 대비 변경: 전체 파일 경로 messenger/ 반영, android-frame.jsx 추가, Scene 2 c_rookie 확정, 데모 체크리스트 README 정합*

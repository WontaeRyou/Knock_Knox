# Knock Messenger — Prototype Handoff

사내 업무 메신저(보안성 검토 요청 / 모니모 MAU 산출 문의 시나리오)의 모바일 목업 프로토타입입니다. 이 문서는 **퍼블리싱·export·콘텐츠 수정**에 필요한 모든 정보를 정리합니다.

> **불변 원칙**
> - 기존 UI 디자인 토큰, 컴포넌트 구조, 뼈대(layout)는 **수정 금지**.
> - 콘텐츠(채팅방·메시지·유저)는 모두 **하드코딩 데이터 한 파일(`data.jsx`)**에서 수정 가능해야 함.

---

## 1. 파일 구조

| 경로 | 역할 | 수정 권한 |
|---|---|---|
| `Knock Messenger.html` | 진입점. React/Babel 로드, device shell, 스크롤바 숨김 CSS | **UI/뼈대 — 수정 금지** |
| `data.jsx` | 인물·채팅방·메시지·테마 토큰. **하드코딩 데이터 단일 소스** | **콘텐츠 자유 수정** |
| `icons.jsx` | SVG 아이콘 세트 | UI — 수정 금지 |
| `chat-list.jsx` | 대화 목록 화면 (탭/리스트/하단 네비) | UI — 수정 금지 |
| `chat-room.jsx` | 채팅방 화면 + 우클릭 컨텍스트 메뉴 ("위키에 추가하기") | UI — 수정 금지 |
| `wiki-add.html` | "위키에 추가하기" 클릭 시 랜딩 페이지 (placeholder) | 별도 작업 예정 |
| `HANDOFF.md` | (이 문서) | — |

---

## 2. 실행 / 미리보기

브라우저에서 `Knock Messenger.html` 을 직접 열면 됩니다. 별도 빌드·서버 불필요 (CDN 기반 React 18.3.1 + Babel Standalone 7.29.0).

- 외부 의존성: `unpkg.com` (React, ReactDOM, Babel Standalone), `fonts.googleapis.com` (Noto Sans KR, IBM Plex Mono).
- 오프라인 배포 시 위 리소스를 인라인 번들링하거나 로컬로 미러링해야 합니다.

---

## 3. 콘텐츠 수정 가이드 — `data.jsx`

모든 텍스트성 콘텐츠는 `data.jsx` 안의 세 개 객체/배열에 하드코딩되어 있습니다. **이 파일만 수정하면 UI는 그대로 두고 콘텐츠를 갈아끼울 수 있습니다.**

### 3-1. `PEOPLE` — 등장 인물

```js
const PEOPLE = {
  boan:    { id: 'boan',    name: '김보안',  initial: '김', dept: '정보보호실',   status: 'online' },
  samsung: { id: 'samsung', name: '김삼성',  initial: '김', dept: '서비스개발팀', status: 'online' },
  ...
};
```

| 필드 | 의미 |
|---|---|
| `id` | 내부 식별자 (`PEOPLE.boan` 처럼 참조). 영문 소문자 권장. |
| `name` | 메시지 상단 작성자 표시명. |
| `initial` | 아바타 원형 안에 들어갈 한 글자. |
| `dept` | 1:1 채팅방 헤더 부제목으로 노출. |
| `status` | `'online' \| 'away' \| 'offline'` (현재 시각 표시는 안 됨, 추후 확장용). |

> 같은 `initial`을 가진 인물(예: 김보안·김삼성)은 `chat-list.jsx`의 `personHue` 매핑에 의해 **id 기준**으로 다른 색이 자동 부여됩니다. 새 인물 id를 추가하면 색이 겹칠 수 있으므로, 필요시 `chat-list.jsx`의 `personHue` 객체에 한 줄 추가하면 됩니다 (※ 색만 추가하는 작업이며 UI 변경 아님).

### 3-2. `CHATS` — 대화 목록

배열 순서가 곧 화면 노출 순서입니다.

```js
{
  id: 'c1',                          // 고유 키 (MESSAGES 매핑에 사용)
  type: 'group' | 'dm',              // 그룹 / 1:1
  title: '보안성 검토 요청 채널 12', // 리스트·헤더 표시명
  members: 12,                       // group일 때만 의미
  person: PEOPLE.boan,               // dm일 때 필수
  lastMessage: '김삼성: 검토 키 값은 어디서 발급받나요?',
  time: '16:42',
  unread: 4,                         // 0이면 뱃지 숨김
  secure: true,                      // 헤더 옆 보안 쉴드 아이콘
  feed: true,                        // (예약) 상단 MY 피드 노출 여부
  isAnnouncement: false,             // true면 공지 메가폰 아이콘
}
```

### 3-3. `MESSAGES` — 채팅방별 메시지 스레드

`CHATS[].id` ↔ `MESSAGES[id]` 로 매핑됩니다. **정의되지 않은 채팅방은 `DEFAULT_THREAD()`** 가 자동 노출됩니다.

```js
MESSAGES.c1 = [
  { id: 'm1', from: 'system', kind: 'system', text: '암호화된 대화방입니다.' },
  { id: 'm2', from: PEOPLE.samsung, text: '...', time: '16:21' },
  { id: 'm3', from: 'me',         text: '...', time: '16:25', read: 9 },
];
```

| 필드 | 의미 |
|---|---|
| `from` | `'me'` / `'system'` / `PEOPLE.xxx` 객체 중 하나. |
| `kind` | `'system'` 이면 가운데 보안 안내 칩으로 렌더. 일반 메시지는 생략. |
| `text` | 본문. 이모지 그대로 사용 가능. |
| `time` | `"HH:MM"` 문자열 (자동 시간 계산 안 함). |
| `read` | 내 메시지일 때 "읽음 N" 노출. 0이면 숨김. |

### 3-4. 테마 토큰 — `KNOCK_THEME`

색상은 단일 객체에 모여 있습니다. 디자인 토큰은 **수정 금지** 영역이지만, 위치만 안내합니다 (`data.jsx` 상단).

---

## 4. 우클릭 → "위키에 추가하기" 동작

- 모든 말풍선(`mine` / `other` 모두) 위에서 우클릭하면 컨텍스트 메뉴가 열립니다.
- "위키에 추가하기" 클릭 시 `wiki-add.html?chat=...&author=...&time=...&text=...&id=...` 로 이동합니다.
- 외부 클릭 / Esc / 다른 우클릭으로 닫힙니다.
- 디바이스 베젤 밖으로 메뉴가 넘치지 않도록 좌표 클램핑이 적용되어 있습니다.

랜딩 페이지(`wiki-add.html`)는 별도 디자인 작업이 예정되어 있으며, 현재는 전달된 query 파라미터를 JSON으로 표시하는 placeholder입니다.

---

## 5. Export / Publishing 옵션

용도별로 권장 방식이 다릅니다.

### A. 단일 HTML 번들로 배포 (가장 권장)
- 외부 의존성(React/Babel/Fonts)을 모두 한 파일에 인라인 → 어디서든 더블클릭으로 실행.
- 산출물: `Knock Messenger.bundle.html` (단일 파일)
- 같은 방식으로 `wiki-add.html`도 별도 번들링 가능.

### B. 정적 호스팅
- 현 폴더(루트의 `Knock Messenger.html`, `*.jsx`, `wiki-add.html`)를 그대로 정적 서버에 업로드.
- GitHub Pages / Netlify / S3 + CloudFront 등.
- 진입 URL: `<host>/Knock%20Messenger.html` (파일명에 공백 포함 — 인코딩 필수).

### C. PDF / 스크린샷 캡처
- 모바일 1프레임 정적 캡처용. 인터랙션이 사라지므로 검토용으로만 적합.
- 채팅방을 열어 두고 인쇄 → PDF 저장.

### D. 압축본 다운로드
- 폴더 통째로 zip → 사내 위키/메신저 공유.

> 어떤 방식으로 export할지 알려주시면 그에 맞게 산출해 드립니다 (A안 단일 HTML 번들, D안 zip 다운로드 등).

---

## 6. 콘텐츠 수정 체크리스트

새로운 시나리오로 갈아끼울 때 순서대로 확인:

1. `data.jsx > PEOPLE` 의 인물 목록을 시나리오에 맞게 교체 (`id`, `name`, `initial`, `dept`).
2. `data.jsx > CHATS` 배열 재구성 — 각 채팅방의 `title`, `lastMessage`, `time`, `unread`, `secure` 갱신.
3. 핵심 채팅방에 한해 `data.jsx > MESSAGES.<chatId>` 스레드 작성. 작성하지 않은 채팅방은 `DEFAULT_THREAD` 가 자동 처리.
4. (선택) 새로 추가된 인물 id가 같은 `initial`을 공유한다면 `chat-list.jsx > personHue` 에 색 한 줄 추가.
5. 브라우저 새로고침으로 즉시 확인.

---

## 7. 알려진 제약 / 주의사항

- 시간(`time`)은 자동 계산되지 않고 모두 하드코딩 문자열입니다. 시나리오 시간 흐름이 자연스럽도록 직접 정렬하세요.
- 자동 답장(`autoReply`, `chat-room.jsx`)은 **랜덤 더미 응답**입니다. 시나리오성 자동 응답이 필요하면 별도 요청 주세요.
- Babel Standalone은 매 로드 시 JSX를 즉석 트랜스파일하므로 첫 로드가 ~200–400ms 추가됩니다. 대규모 배포 시 빌드 단계 도입을 검토할 수 있습니다 (단, 본 프로토타입 범위 밖).
- 모든 텍스트는 한국어 기본. 다국어 전환 구조는 포함되어 있지 않습니다.

---

## 8. 다음 단계 제안 (선택)

- [ ] 단일 HTML 번들 산출 (A안)
- [ ] `wiki-add.html` 디자인 본 작업
- [ ] zip 다운로드 패키지 생성
- [ ] 시나리오 추가 — 인물/채팅방 데이터 교체본 작성

원하시는 export 방식을 알려주시면 바로 진행하겠습니다.

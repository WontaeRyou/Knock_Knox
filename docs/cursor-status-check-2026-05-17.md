# Cursor 현황 확인 결과

작성일: 2026-05-17  
목적: v2.1 명세서 최신화 전 실제 코드베이스 상태 확인

## 기준 및 주의사항

- Supabase 확인 기준은 `https://scmlaiiypectfoboejam.supabase.co` 단일 프로젝트입니다.
- 해당 Supabase 외 다른 프로젝트는 조회 또는 사용하지 않는 것을 기준으로 합니다.
- 민감키 값은 문서에 표시하지 않습니다.
- 현재 Cursor에 등록된 MCP 목록에는 n8n MCP가 없어 n8n 워크플로우 내부 노드 credentials는 직접 조회하지 못했습니다.

## 1. wiki-add 구현체 경로

| 파일 경로 | 존재 여부 | webhook 호출 로직 | 확인 결과 |
|---|---|---|---|
| `messenger/wiki-add.html` | 있음 | placeholder만 있음 | URL query를 화면에 출력하는 정적 placeholder입니다. |
| `messenger/wiki-add.bundle.html` | 있음 | placeholder만 있음 | `wiki-add.html`을 번들링한 placeholder입니다. |
| `console/app/wiki/add/page.tsx` | 있음 | 있음 | `knox-wiki-add` n8n webhook으로 POST 전송하는 실제 구현체입니다. |

정리:

- 실제 구현체는 `console/app/wiki/add/page.tsx`입니다.
- `messenger/wiki-add.html` 및 `messenger/wiki-add.bundle.html`은 legacy placeholder로 보는 것이 맞습니다.
- v2.1에는 "정본은 `console/app/wiki/add/page.tsx`, messenger 쪽 wiki-add HTML은 legacy placeholder"로 명시하는 것이 적절합니다.

## 2. RAG / Supabase 실제 연결 상태

| 확인 항목 | 결과 |
|---|---|
| `.env.local` Supabase 환경변수 | 채워짐 |
| 기준 Supabase URL | `https://scmlaiiypectfoboejam.supabase.co` |
| n8n Vector Store 노드 credentials | 확인 불가 |
| Supabase `qa_pairs` 테이블 실제 존재 여부 | 없음으로 판단 |

세부 확인:

- `console/.env.local`은 존재합니다.
- Supabase 관련 값은 채워져 있습니다.
- 파일 내 변수명은 요청서의 `SUPABASE_URL`, `SUPABASE_ANON_KEY`가 아니라 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` 형태입니다.
- 값 자체는 보안상 표시하지 않습니다.
- `https://scmlaiiypectfoboejam.supabase.co/rest/v1/qa_pairs?select=*&limit=1` 읽기 요청 결과 `404`가 반환되어, 현재 기준 원격 `qa_pairs` 테이블은 없거나 REST 노출 대상이 아닌 상태로 판단됩니다.
- n8n workflow ID `qGddk1phr96Kuz6t`의 Supabase Vector Store credentials는 n8n MCP가 등록되어 있지 않아 직접 확인하지 못했습니다.

최신화 방향:

- v2.1 §3-2 및 §10에는 "현재 RAG/Supabase Vector Store 연결은 코드/문서상 설계와 로컬 migration/seed는 있으나, 기준 Supabase 원격 `qa_pairs` 테이블은 확인되지 않음"으로 주석 처리하는 것이 안전합니다.
- n8n credentials 상태는 "n8n MCP 부재로 미확인"으로 별도 표기해야 합니다.

## 3. Knox 목업 현재 버전

| 확인 항목 | 결과 |
|---|---|
| viewport 태그 형태 | 모바일 전용 |
| `android-frame.jsx` 존재 여부 | 있음 |
| 현재 배포 목업 형태 | 모바일형 |

세부 확인:

- `messenger/Knock Messenger.html`에는 `<meta name="viewport" content="width=device-width, initial-scale=1" />`가 있습니다.
- 같은 파일에는 `Android device shell` 주석과 `width: 380px; height: 800px` 디바이스 쉘 스타일이 있습니다.
- `messenger/android-frame.jsx`에는 `AndroidDevice`, `AndroidStatusBar`, `AndroidNavBar`, `AndroidKeyboard` 등이 정의되어 있어 모바일 기기 프레임을 감싸는 용도입니다.
- 배포 URL `https://knock-knox-messenger.vercel.app/Knock%20Messenger.html`도 현재 HTML 기준 `Android device shell`과 `380x800` 모바일 쉘을 포함합니다.

최신화 방향:

- v2.1 §6에는 "현재 모바일 목업 운용 중, PC 버전 재작업 진행 중"으로 명시하는 것이 맞습니다.
- PC형으로 이미 전환된 상태는 아닙니다.

## 4. Scene 2 현업 매핑 방식 실구현 여부

| 확인 항목 | 결과 |
|---|---|
| 콘솔에 현업 초대 UI 존재 여부 | 없음 |
| `data.jsx`에 group 타입 채팅방 여부 | 있음 |

세부 확인:

- `console/app/console/page.tsx`에서 `invite`, `초대`, `3자`, `group`, `room` 관련 UI나 로직은 확인되지 않았습니다.
- `messenger/data.jsx`의 `CHATS` 배열에는 `type: 'group'`인 `보안성 검토 요청 채널`이 존재합니다.
- 다만 Scene 2의 핵심 흐름인 `c_rookie`는 `dm` 타입 채팅방입니다.
- `c_rookie` 메시지에는 시스템 메시지로 "담당자를 초대합니다."가 표시되고, 이후 현업 답변이 정적으로 이어지는 형태입니다.
- 실제 3자 방 생성, 초대, 멤버 추가, room 전환 로직은 구현되어 있지 않습니다.

최신화 방향:

- v2.1 §5 Scene 2에는 "3자 방 구성은 PoC 범위 내 미결이며, 현재는 정적 메시지/이미지화에 가까운 방식으로 처리"라고 명시하는 것이 적절합니다.
- 단, `data.jsx`에는 별도 group 타입 채팅방 예시가 있으므로 "group 타입 데이터 구조 자체는 존재하나 Scene 2 직접 초대 로직과 연결되어 있지는 않음"으로 구분해야 합니다.

## 최종 요약

| 항목 | 실제 코드베이스 기준 판단 |
|---|---|
| wiki-add 구현체 | `console/app/wiki/add/page.tsx`가 실제 구현체, messenger HTML은 placeholder |
| RAG / Supabase | 기준 Supabase env는 채워져 있으나 원격 `qa_pairs`는 확인되지 않음, n8n credentials는 미확인 |
| Knox 목업 | 현재 모바일형 목업 운용 중 |
| Scene 2 현업 매핑 | 콘솔 초대 UI 없음, Scene 2는 정적 현업 답변 흐름 |

## 문서 반영 권고

- v2.1에는 `console/app/wiki/add/page.tsx`를 wiki-add 정본으로 명시합니다.
- v2.1 §3-2, §10에는 RAG/Supabase 연결 상태를 "설계 및 로컬 migration/seed 존재, 원격 `qa_pairs` 미확인 또는 미구현"으로 낮춰 적습니다.
- v2.1 §6에는 "현재 모바일 목업 기준, PC 버전 재작업 필요"를 명시합니다.
- v2.1 §5 Scene 2에는 "3자 방/현업 초대 방식은 미결, 현재 PoC는 정적 응대 흐름"으로 정리합니다.

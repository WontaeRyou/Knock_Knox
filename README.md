# 🛡 Knock_Knox / 해일미리

> 사내 업무 문의 자동 응답 AI Agent PoC — **2026 삼성금융 AI 스파크톤 본선 출품작**

사내 메신저(Knox)에서 들어온 업무 문의를 AI Agent가 자동 답변 초안을 생성하고, 현업 담당자가 검수 콘솔에서 확인·발송하는 PoC. 답변되지 않은 질문은 현업이 직접 응대하고 그 결과를 위키로 적재해 **지식 플라이휠**을 돌립니다.

---

## 📂 폴더 구조

전체 트리(파일 단위)는 [`FOLDER_STRUCTURE.md`](./FOLDER_STRUCTURE.md)를 참고하세요.

```
Knock_Knox/
├── messenger/                ← Knox 메신저 목업 (HTML + React CDN, 빌드 없음)
│   ├── Knock Messenger.html  ← 진입점 (소스)
│   ├── Knock Messenger.bundle.html  ← 단일 HTML 번들 배포용
│   ├── data.jsx              ← 🟢 콘텐츠·Webhook 설정 단일 소스
│   ├── chat-list.jsx · chat-room.jsx · icons.jsx · android-frame.jsx
│   ├── wiki-add.html         ← (legacy placeholder, 본 페이지는 console/wiki/add)
│   └── wiki-add.bundle.html  ← 위키 placeholder 단일 번들
│
├── console/                  ← Next.js 14 App Router + TypeScript + Tailwind (Vercel 배포 대상)
│   ├── app/
│   │   ├── page.tsx
│   │   ├── layout.tsx · globals.css
│   │   ├── console/page.tsx               ← 🟢 AI 초안 검수 콘솔
│   │   ├── wiki/add/page.tsx              ← 🟢 위키 적재 페이지
│   │   └── api/console-update/route.ts    ← 🟢 n8n 수신 엔드포인트
│   ├── lib/supabase.ts
│   ├── package.json · tsconfig.json · tailwind.config.ts · next.config.js
│   ├── postcss.config.js · next-env.d.ts · .gitignore
│   └── .env.local.example
│
├── supabase/migrations/
│   └── 001_init.sql          ← 🟢 DB 스키마 (pgvector, RLS, Realtime, RPC)
│
├── seed/
│   └── qa_seed.sql           ← 🟢 데모 시드 데이터 (3개 부서 × 10건)
│
├── uploads/                  ← 데모·자료용 이미지 등 (선택)
│
├── HANDOFF.md                ← messenger 콘텐츠 수정 가이드
├── CLAUDE_PROJECT_PROMPT.md  ← Claude Project 등록용 프롬프트
├── Knock_Knox.md             ← 내부 작업·요구사항 메모
├── KNOCK_Knox_PoC_구현명세서_v2.1.md
├── FOLDER_STRUCTURE.md       ← 저장소 디렉터리 트리 (본 README와 동기화)
└── README.md
```

---

## 🚀 빠른 시작

### Step 1. Supabase 설정
1. [supabase.com](https://supabase.com) 에서 신규 프로젝트 생성
2. SQL Editor 에서 `supabase/migrations/001_init.sql` **실행**
3. Project Settings → API 에서 다음 3개 키 복사
   - `Project URL`
   - `anon public` key
   - `service_role` key (⚠️ 절대 클라이언트 노출 금지)

### Step 2. 시드 데이터 적재
SQL Editor 에서 `seed/qa_seed.sql` **실행** → qa_pairs 30건 INSERT  
(embedding 컬럼은 n8n 워크플로우가 별도 적재)

### Step 3. console 환경변수
```bash
cd console
cp .env.local.example .env.local
# .env.local 을 열어 Step 1 에서 복사한 값 채우기
# CONSOLE_API_SECRET 은 `openssl rand -hex 32` 결과로 채우기
```

### Step 4. console 실행
```bash
cd console
npm install
npm run dev
# → http://localhost:3000/console
```

### Step 5. messenger 실행
`messenger/Knock Messenger.html` **브라우저로 더블클릭**  
(빌드 불필요 — React/Babel CDN)

### Step 6. n8n 워크플로우 Active
n8n 클라우드에서 두 워크플로우를 **Active** 로 전환
- `knox-message` (Webhook 수신 → Q-Q 유사도 검색 → Action A/B → 검수 콘솔로 push)
- `knox-wiki-add` (위키 적재 시 Summarize Agent → embedding 생성)

---

## 🎬 데모 시연 가이드

### Scene 1 — Action A (AI 초안 흐름)
```
1. messenger 열기 → '김삼성' 채팅방 진입
2. 입력창에 "모니모 MAU 구하는 SQL 쿼리 알려주세요" 입력 → 전송
3. 채팅방 하단에 "⏳ AI Agent에 전달 중..." → "✅ AI Agent 접수 완료" 표시
4. 검수 콘솔(localhost:3000/console) 좌측 리스트 상단에 **새 문의 자동 등장**
5. 클릭 → AI 추천 답변 + Confidence(92% 등) + 참조 과거 질문 표시
6. [✅ 그대로 발송] 클릭 → Knox로 자동 답변 전송 (PoC: UI 시연만)
```

### Scene 2 — Action B (직접 응대 → 위키 → 플라이휠)
```
1. messenger → '김신입' 채팅방
2. "Claude API 키는 어떻게 발급받나요?" 입력 → 전송
3. 검수 콘솔에 "⚠️ AI가 답변할 수 없습니다" (FIELD_DIRECT) 카드 등장
4. [💬 Knox에서 직접 응대하기] 클릭 → 현업이 직접 답변
5. 답변한 메시지 위에서 **우클릭 → "위키에 추가하기"**
6. /wiki/add 페이지에서 Summarize Agent 결과 확인 후 [📝 Wiki에 추가]
7. ★ 플라이휠 증명: 다른 사용자가 동일 질문 입력 → 이번엔 AI_DRAFT 로 응답
```

---

## 🔗 n8n Webhook URL

| 환경 | URL |
|---|---|
| 테스트 (실행 1회용) | `https://wontaeryu.app.n8n.cloud/webhook-test/knox-message` |
| 프로덕션 (Active 필요) | `https://wontaeryu.app.n8n.cloud/webhook/knox-message` |
| 위키 적재 (테스트) | `https://wontaeryu.app.n8n.cloud/webhook-test/knox-wiki-add` |

전환 방법: `messenger/data.jsx` 의 `KNOCK_CONFIG.useTestWebhook` 값을 `true ↔ false` 토글.

---

## ✅ 데모 당일 체크리스트

- [ ] Supabase 프로젝트 살아있음 (`select 1` 확인)
- [ ] `inquiries` 테이블 비어있음 (테스트 데이터 정리)
- [ ] `qa_pairs` 30건 시드 + embedding 적재 완료
- [ ] n8n 워크플로우 2개 모두 **Active**
- [ ] Vercel 배포 도메인 접속 정상
- [ ] `.env.local` 의 `CONSOLE_API_SECRET` 과 n8n 헤더 값 일치
- [ ] messenger 의 `useTestWebhook` 값을 **데모 환경에 맞게** 설정
- [ ] Scene 1 리허설 1회 (Action A 흐름)
- [ ] Scene 2 리허설 1회 (Action B → Wiki → 재질문 플라이휠)
- [ ] Realtime 연결 인디케이터가 🟢 초록색

---

## 👥 팀원 R&R

| 이름 | 담당 |
|---|---|
| **류원태** | n8n 워크플로우 설계·운영, messenger Webhook 연동 |
| **김주명** | Supabase 스키마, 시드 데이터, RAG 튜닝 |
| **정수민** | console Next.js UI, Wiki 페이지, Vercel 배포 |

---

## 🛡 보안 명세 (PoC)

- **데이터**: 더미 데이터 한정 운영
- **모델**: Anthropic Cloud API (학습 미사용 SLA)
- **DB**: Supabase Cloud (실서비스 시 온프레미스 전환 전제)

**실서비스 보강 항목**: IT보안팀 정보보호 정책 연동 / 사번·성명 마스킹 / 온프레미스 pgvector 전환

---

## 📚 추가 문서

- `FOLDER_STRUCTURE.md` — 저장소 디렉터리 트리(파일 단위, README와 동기화)
- `HANDOFF.md` — messenger 콘텐츠(인물·채팅·메시지) 수정 가이드
- `CLAUDE_PROJECT_PROMPT.md` — Claude Project 등록용 시스템 프롬프트
- `console/.env.local.example` — 환경변수 템플릿

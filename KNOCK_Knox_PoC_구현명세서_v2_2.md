# KNOCK-Knox PoC 구현 명세서 v2.2

> **프로젝트**: 사내 업무 문의 자동 응답 AI Agent
> **팀**: TEAM 890 "해일미리" (정수민·김주명·류원태)
> **대회**: 2026 삼성금융 AI 스파크톤 본선
> **단계**: 본선 PoC 구현 (3 Days Sprint)
> **개발 환경**: Cursor (vibe-coding) / Vercel 배포
> **인프라 버전**: n8n v2.20.7 / Node.js v24.15.0

---

## 📌 v2.2 변경 사항 요약 (v2.1 → v2.2)

> **변경 기준일**: 2026-05-17 | Cursor 코드베이스 실황 확인 + n8n MCP 직접 조회 결과 반영

| 영역 | v2.1 (이전) | v2.2 (변경) | 변경 근거 |
|---|---|---|---|
| n8n 워크플로우 A 노드 수 | 8개 (설계 기준) | **13개 (실제 배포 기준)** | MCP 직접 조회 결과 — 응답 정규화 노드 2개(Action A·B) 및 병합 구조 확인 |
| n8n 워크플로우 A URL | 미기재 | **URL 명시** | 팀 공유용 접근 경로 확정 |
| n8n 워크플로우 B 노드 수 | 6개 (설계 기준) | **10개 (실제 배포 기준)** | MCP 직접 조회 결과 — 필수값 검증 IF 노드, 에러·성공·실패 응답 분기 확인 |
| n8n 워크플로우 B URL | 미기재 | **URL 명시** | 팀 공유용 접근 경로 확정 |
| n8n 워크플로우 B 구조 | Summarize Agent(Claude Haiku) 포함 | **필수값 검증 → 정규화 → metadata 조립 → Vector Store (Insert) 구조** | MCP 직접 조회 결과 — Summarize Agent 없이 직접 Insert 흐름 확인 |
| RAG/Supabase 구현 상태 | 설계 완료된 것으로 서술 | **설계 완료, 원격 qa_pairs 테이블 미생성 (최우선 블로커)** | Cursor 확인: REST 조회 404 반환 |
| wiki-add 구현체 경로 | `/wiki-add` (모호하게 서술) | **정본: `console/app/wiki/add/page.tsx`, legacy: `messenger/wiki-add.html`** | Cursor 확인: page.tsx에 실제 webhook 호출 로직 존재 |
| Knox 목업 버전 | 명시 없음 | **현재 모바일형(Android 380×800 shell) 운용 중, PC 버전 재작업 예정** | Cursor 확인: android-frame.jsx, 380px 쉘 확인 |
| Scene 2 현업 매핑 방식 | "현업이 Knox에서 직접 응대"로 단순 서술 | **3자 방 생성 미구현 — 정적 메시지 흐름으로 처리 (PoC 범위 내 결정)** | Cursor 확인: 콘솔 초대 UI 없음, c_rookie는 정적 dm |
| Supabase 프로젝트 URL | 미기재 | **`https://scmlaiiypectfoboejam.supabase.co`** | Cursor .env.local 확인 |

> v2.1 → v2.2는 **실제 코드베이스·n8n 실 워크플로우와 명세서의 정합성 확보**가 핵심입니다.
> 서비스 본질(Q-Q RAG, Scene 1·2, 인간 책임 모델, 플라이휠 구조)은 유지됩니다.

---

## 📌 v1 → v2 → v2.1 → v2.2 누적 변경 (참고)

| 영역 | v1 | v2 | v2.1 | v2.2 |
|---|---|---|---|---|
| RAG 방식 | Q+A 청크 | Q-Q 유사도 | (유지) | (유지) |
| 테이블 구조 | 2개 분리안 | 단일 `qa_pairs` | (유지) | (유지, 원격 미생성 상태 명시) |
| 보안 노드 | n8n Classifier | 삭제 → 보안 명세 카드 | (유지) | (유지) |
| 액션 | ①/②/③ 3종 | A/B 2종 | (유지) | (유지) |
| Validation Agent | 포함 | 포함 | **제거** | (유지) |
| DB 인덱스 | 미정 | IVFFlat | **HNSW** | (유지) |
| 함수명 | 미정 | `match_qa_pairs` | **`match_documents`** | (유지) |
| 워크플로우 노드 수 | 미정 | 미정 | 8개/6개 (설계) | **13개/10개 (실제)** |
| 워크플로우 URL | 미정 | 미정 | 미기재 | **명시** |
| RAG 구현 상태 | 미정 | 미정 | 설계 완료로 서술 | **원격 테이블 미생성 명시** |
| wiki-add 경로 | 미정 | 미정 | 모호 | **page.tsx 정본 확정** |
| 목업 버전 | 미정 | 미정 | 명시 없음 | **모바일형 명시** |
| Scene 2 현업 방식 | 미정 | 미정 | 단순 서술 | **정적 흐름 처리 명시** |

---

## 0. 이 문서의 목적

본선 진출 2차 지원서(PPTX 23슬라이드)의 기획 내용을 **실제 구현 가능한 PoC 명세**로 전환한 문서입니다.
- 기획 문서는 "왜/무엇을(WHY/WHAT)"에 집중
- 본 문서는 "어떻게(HOW)"에 집중 — n8n 노드 구성, Supabase 스키마, RAG 파이프라인, Frontend 연동
- Cursor에서 이 문서를 그대로 컨텍스트로 넣어 vibe-coding 가능하도록 설계

---

## 1. 서비스 요약 (One-Pager)

### 1-1. 한 줄 요약
**휘발되는 사내 업무 대화를 원클릭으로 자산화하여 업무 질의 비효율을 해소하는 Knox 메신저 연동형 AI Agent**

### 1-2. 핵심 가치 (Core Value)
| 관점 | AS-IS | TO-BE |
|---|---|---|
| **질문자** | 담당자 탐색 → 메신저 문의 → 회신 대기 (평균 1시간+) | Knox 챗봇에 질문 → Q-Q 매칭으로 추천 답변 즉시 수령 → 미해결시 자동 라우팅 |
| **답변자(현업)** | 반복 문의 매번 처음부터 응답 (일 30분+ 소요, 본업 몰입 저하) | AI 초안 검수 후 발송 → 드래그&페이스트로 Wiki 적재 → 점진적 자동화 |

### 1-3. 페인포인트 근거 (사내 설문 n=42, 26.04.13~21)
- 90%+ 현업: **업무 담당자/레거시 문서 탐색에 불편 경험**
- 50%+ 현업: **최근 업무 문의에 1시간 이상 소요**
- 70%+ 현업: **업무 시간 중 30분 이상을 문의 대응에 할애**
- 90%+ 현업: **반복성 문의 경험**

### 1-4. 페인포인트 발생 구조 (PPTX Slide 5~6)

**질문자 측 PAIN POINTS**:
- 신입사원: 업무 중 궁금한 사항을 누구에게 물어야 할지 모름
- 기획자: 개발 진행 시 개발자/디자이너/보안/정보보호 등 다양한 담당자에게 문의 必

**답변자 측 PAIN POINTS**:
- 보안팀: 동일한 업무 문의(보안 점검, 방화벽 등)가 반복 인입
- 신규 발령자: 前 업무 담당자 히스토리를 일일이 확인해야 하는 번거로움

**근본 원인**:
- 협업툴(Confluence) 검색 기능 열악 + 이용 불편
- 바쁜 현업의 문서 제작 부담
- 업무 변동사항 관리의 어려움
- 전사 표준 아카이브의 부재

---

## 2. 서비스 핵심 로직 (Action 2종)

### Action A — Q-Q 유사도 기반 자동 답변 추천 (Scene 1)
> **조건**: 과거 질문과의 유사도 ≥ 0.85

```
질문자 [Knox 메신저]
  → n8n Webhook 수신
  → 질문 정규화 (Set Node)
  → 임베딩 생성 (OpenAI text-embedding-3-small)
  → Supabase Vector Store에서 Q-Q 유사도 검색 (Top 3)
  → IF Node: similarity ≥ 0.85
  → 매칭된 metadata.answer_text 사용
  → Claude Sonnet으로 답변 정제 (현재 질문 맥락 반영)
  → 현업 검수 콘솔로 송출 (draft + similarity + sources)
  → 현업 1-클릭 발송
```

### Action B — AI 미응답 → 현업 응대 → Wiki 적재 (Scene 2, 플라이휠)
> **조건**: 과거 질문과의 최고 유사도 < 0.85 (= AI가 모름을 인정)

```
질문자 [Knox 메신저]
  → n8n Webhook 수신
  → 질문 정규화 / 임베딩 / Q-Q 검색
  → IF Node: 최고 유사도 < 0.85
  → "AI 답변 보류 — Hallucination 방지" 응답
  → 검수 콘솔에 "직접 답변 작성" 모드로 표시
  → 현업이 Knox에서 직접 응대 [정적 흐름으로 처리 — 아래 §5 Scene 2 참조]
  → 응대 완료 후 메시지 드래그 → 우클릭 → "위키에 추가하기"
  → console/app/wiki/add/page.tsx 랜딩
  → 워크플로우 B: 필수값 검증 → 정규화 → metadata 조립 → qa_pairs INSERT + 임베딩 적재
  → ★ 다음번 유사 질문 발생 시 Action A로 자동 흡수
```

### 2-1. Q-Q RAG 채택 근거 (멘토 피드백 반영)

**기존 Q+A 청크 RAG의 결함**:
| # | 결함 | 사례 |
|---|---|---|
| 1 | Answer-leakage | Q="MAU 쿼리?" + A="SC_MONIMO_USER_STAT 테이블..." 통합 임베딩 → 새 질문 "SC_MONIMO_USER_STAT 컬럼 구조"와 의도가 전혀 다른데도 매칭됨 |
| 2 | 장문 희석(Dilution) | A가 Q보다 5~10배 길면 Q의 의미 비중이 1/10로 축소 → 사실상 "답변 유사도"가 됨 |
| 3 | 재학습 비용 폭증 | A만 갱신해도 임베딩 전체 재생성 必 |

**Q-Q RAG의 이점**:
- 임베딩 벡터의 의미가 **순수 질문 의도**에 집중됨
- 답변 토큰의 오염 없이 매칭 정확도 ↑
- 답변 갱신 시 metadata만 UPDATE, 임베딩 보존
- 임베딩 토큰 비용 90%+ 절감 (Q만 30~50토큰, A는 200~500토큰)
- **평가위원 설명력**: "같은 질문을 찾아 답하는 사내 FAQ Agent" — 우리 서비스의 본질을 정확히 표현

### 2-2. Validation Agent 제거 결정 (v2.1 확정)

**Q-Q RAG 구조에서 Validation Agent가 불필요한 이유**:

1. **답변이 LLM 생성물이 아님** — 과거에 현업이 실제 사용한 검증된 답변. Hallucination이 구조적으로 발생하기 어려움
2. **0.85 임계점 IF Node가 이미 신뢰성 게이트** — 별도 LLM 재검증의 한계 효용 ↓
3. **응답 지연 회피** — Sonnet 호출 1회 추가 = 2~5초 지연 → 시연 임팩트 손실
4. **인간 책임 모델 정합성** — 최종 검증자는 검수 콘솔의 현업. LLM Validation은 중복 레이어
5. **PoC 작업량 절감** — 3일 스프린트에서 핵심 기능 집중

평가위원이 짚을 경우 답변: *"Q-Q RAG 구조 자체가 검증 메커니즘입니다. 답변은 과거에 현업이 실제 사용한 검증된 답변이며, 0.85 임계값이 매칭 품질을 보장합니다. 최종 검증은 검수 콘솔에서 현업이 수행합니다."*

### 2-3. 보안 처리 방식 (PoC 단계)

**원칙**: 본선 PoC에서는 보안 분류 노드를 **별도로 구현하지 않음**. 대신 **화면 내 보안 명세 카드**로 정책을 명시적으로 노출.

**근거**:
- 보안 분류 LLM은 정확도 검증에 시간 소요, PoC에서 실효성 없음
- 평가위원이 "AI에 보안 판단을 맡기는 게 위험" 같은 역공의 빌미가 될 수 있음
- 의도적으로 PoC 범위를 한정한 결과임을 명시 → 실서비스 전환 시 IT보안팀 정책 연동을 별도 명세

**구현**:
- 화면 내 "보안 명세 카드" 패널 (정적 텍스트)
- PoC 단계 운영 기준 + 실서비스 전환 시 보강 항목 명시

---

## 3. 기술 아키텍처

### 3-1. 전체 스택

| 레이어 | 도구 | 채택 근거 |
|---|---|---|
| Workflow Orchestration | **n8n v2.20.7** | 인터페이스 기반 시각화, 팀 이용 경험 있음 |
| Vector DB + RDB | **Supabase (pgvector)** · `scmlaiiypectfoboejam.supabase.co` | RAG 파이프라인 + DB 동시 지원 → 아키텍처 단순화 |
| RAG Framework | **n8n 내장 LangChain 노드** | 별도 서버 불필요. Vector Store/Embeddings/AI Agent 노드가 LangChain.js로 빌드됨 |
| LLM (답변 생성) | **Claude Sonnet 4.6** | 답변 품질 중요 → 고도화 모델 |
| Embedding | **OpenAI text-embedding-3-small (1536차원)** | n8n 호환성 + 한국어 양호 + 저렴 |
| Frontend (목업) | **정적 React (Knock Messenger.html)** · 현재 모바일형 | 디자인 가이드 준수, UI 골격 수정 금지 |
| Frontend (콘솔/Wiki) | **Next.js (App Router) + React** | Cursor vibe-coding 최적 |
| 배포 | **Vercel** | Next.js 최적, 데모 URL 즉시 공유 가능 |
| Runtime | **Node.js v24.15.0** | n8n + Next.js 양쪽 호환 LTS 인접 버전 |

> **단일 스택 원칙**: LangChain Python 서버, LangGraph 등 추가 오케스트레이션 프레임워크는 도입하지 않음. PoC 단계에서 듀얼 스택은 디버깅 비용만 증가.

> ⚠️ **[v2.2 상태 주석] LLM (요약)**: v2.1 명세의 Claude Haiku 4.5 Summarize Agent는 워크플로우 B 실 구조에서 확인되지 않음. 현재 워크플로우 B는 직접 Insert 방식으로 동작. 별도 요약 단계 필요 시 Set Node 또는 Agent 노드 추가 검토 필요.

### 3-2. n8n 워크플로우 노드 구성

> ⚠️ **[v2.2 상태 주석]** 아래 구성은 n8n MCP 직접 조회(2026-05-17) 결과 기준입니다. v2.1의 설계 노드 수(8개/6개)와 실제 배포 노드 수(13개/10개)가 다릅니다. 실제 n8n 대시보드가 기준입니다.

#### 워크플로우 A: 신규 질문 인입 → Q-Q 검색 → 답변 추천 (Scene 1)

- **워크플로우 ID**: `qGddk1phr96Kuz6t`
- **워크플로우 이름**: `Knock_Knox`
- **URL**: https://wontaeryu.app.n8n.cloud/workflow/qGddk1phr96Kuz6t
- **Webhook Path**: `knox-message` (POST)
- **테스트 URL**: `https://wontaeryu.app.n8n.cloud/webhook-test/knox-message`
- **프로덕션 URL**: `https://wontaeryu.app.n8n.cloud/webhook/knox-message`
- **현재 상태**: Active ✅
- **실제 노드 수**: 13개

**실제 노드 구성 (MCP 조회 기준)**:

```
[1]  Webhook Trigger               — Knox 메신저(목업)로부터 새 질문 수신
[2]  질문 정규화 (Set)              — 공백 통일, 특수문자 제거, 핵심 명사 보존
[3]  Q-Q 유사도 검색 (VectorStore) — Supabase match_documents, Top 3
     └ [서브] OpenAI Embeddings    — text-embedding-3-small
[4]  유사도 임계점 분기 (IF)        — score[0] ≥ 0.85 → TRUE / FALSE

[TRUE 분기 — Action A]
[5-A] Answer Agent (Sonnet)        — Claude Sonnet 4.6 답변 정제
      └ [서브] Claude Sonnet 4.6   — LM 서브노드
[6-A] 검수 콘솔 송출 (HTTP)        — POST {mode:"AI_DRAFT", draft, confidence, sources}
[7-A] 응답 정규화 (Action A, Set)  — Webhook 응답 데이터 정규화

[FALSE 분기 — Action B]
[5-B] Action B — AI 미응답 처리 (Set) — {mode:"FIELD_DIRECT", reason, top_similarity}
[6-B] 검수 콘솔 송출 (HTTP)           — POST {mode:"FIELD_DIRECT", original_question, top_match, similarity}
[7-B] 응답 정규화 (Action B, Set)     — Webhook 응답 데이터 정규화

[공통]
[8]  Webhook 응답                   — { status:"received", message:"처리 완료" } 즉시 반환
```

> **설계 기준 노드 수(8개)와 실제 배포 노드 수(13개)의 차이**: 각 분기별 응답 정규화 Set 노드(7-A, 7-B)가 추가로 배포되어 있으며, Claude Sonnet 서브노드와 OpenAI Embeddings 서브노드가 별도 계산됨.

#### 워크플로우 B: Wiki 적재 (Scene 2의 후반부 — 플라이휠)

- **워크플로우 ID**: `Lxtjx8UE6Hbxfvko`
- **워크플로우 이름**: `Knock_Knox (Scene2)`
- **URL**: https://wontaeryu.app.n8n.cloud/workflow/Lxtjx8UE6Hbxfvko
- **Webhook Path**: `knox-wiki-add` (POST)
- **테스트 URL**: `https://wontaeryu.app.n8n.cloud/webhook-test/knox-wiki-add`
- **프로덕션 URL**: `https://wontaeryu.app.n8n.cloud/webhook/knox-wiki-add`
- **현재 상태**: Active ✅
- **실제 노드 수**: 10개

**실제 노드 구성 (MCP 조회 기준)**:

```
[1]  Webhook Trigger               — "위키에 추가하기" 클릭 시 수신
     └ Body: { chat_text, responder_id, responder_name, department }
[2]  필수값 검증 (IF)              — 필수 필드 존재 여부 확인

[검증 실패 분기]
[3-E] 에러 응답 (Respond)          — 400 에러 즉시 반환

[검증 성공 분기]
[3]  질문 정규화 및 데이터 정리 (Set)  — question_normalized 생성
[4]  metadata 조립 (Set)           — answer_text, department, tags, archived_at 등 조립
[5]  Supabase Vector Store (Insert) — qa_pairs 테이블에 문서 + 임베딩 INSERT
     └ [서브] Default Data Loader  — JSON 모드, question_normalized + metadata
     └ [서브] OpenAI Embeddings    — text-embedding-3-small

[INSERT 결과 분기]
[6-S] 성공 응답 (Respond)          — "Wiki 적재 완료"
[6-F] 실패 응답 (Respond)          — 오류 내용 반환
```

> ⚠️ **[v2.2 주요 변경]** v2.1 명세의 워크플로우 B에는 `Summarize Agent (Claude Haiku 4.5)` 노드가 포함되어 있었으나, 실제 배포된 워크플로우 B에는 해당 노드가 없습니다. 현재는 `console/app/wiki/add/page.tsx`에서 Q-A를 미리 분리하여 webhook으로 전송하는 방식으로 동작합니다. 추후 Summarize Agent 추가가 필요하면 워크플로우 B에 노드를 삽입하면 됩니다.

### 3-3. Agent Output 표준 (JSON)

#### Action A (AI 답변 가능) 응답
```json
{
  "mode": "AI_DRAFT",
  "draft": "안녕하세요 프로님, 모니모마케팅팀 류원태입니다. 요청하신 모니모 MAU 산출 쿼리는 다음과 같습니다...",
  "confidence": 0.89,
  "sources": [
    { "qa_pair_id": 12, "matched_question": "모니모 MAU 산출 SQL", "similarity": 0.89 },
    { "qa_pair_id": 23, "matched_question": "월간 활성 사용자 SQL", "similarity": 0.81 },
    { "qa_pair_id": 45, "matched_question": "SC_MONIMO_USER_STAT 컬럼", "similarity": 0.62 }
  ]
}
```

#### Action B (AI 미응답) 응답
```json
{
  "mode": "FIELD_DIRECT",
  "reason": "유사한 과거 사례 없음. Hallucination 방지를 위해 답변 보류",
  "original_question": "Claude API 키는 어떻게 발급받나요?",
  "top_similarity": 0.41,
  "top_match": "MCP 서버 권한 신청"
}
```

> **설계 원칙**: Confidence Thresholding은 **n8n IF 노드(별도 분리)**에서 수행. Agent 프롬프트 내부에 숨기지 않음 → 아키텍처 슬라이드와 실 구현이 시각적으로 일치.

---

## 4. Supabase 스키마 설계 (v2.2 — 최종안)

> ⚠️ **[v2.2 상태 주석 — 최우선 블로커]**
> - Supabase 프로젝트: `https://scmlaiiypectfoboejam.supabase.co`
> - `.env.local` 환경변수(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY): **채워짐**
> - `qa_pairs` 테이블: **원격 미생성** (REST 조회 404 반환, 2026-05-17 기준)
> - `match_documents` RPC 함수: **미생성** (테이블 없으므로 동반 미생성)
> - **→ 아래 §4-1~4-2 SQL을 Supabase SQL Editor에서 순서대로 실행해야 RAG가 동작합니다.**

### 4-1. 핵심 테이블 — qa_pairs

```sql
-- ============================================
-- 1. pgvector 확장 활성화
-- ============================================
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================
-- 2. qa_pairs : 질문-답변 페어 (단일 통합 테이블)
-- ============================================
-- 설계 원칙:
-- (1) content   = 정규화된 질문 (임베딩 대상, LangChain 표준 컨벤션)
-- (2) metadata  = jsonb (answer_text + 부서·태그·답변자 등 모두 통합)
-- (3) embedding = content의 1536차원 벡터
-- (4) answer_text를 metadata 안에 둠으로써 n8n 표준 Vector Store 노드
--     (content/metadata/embedding 3컬럼만 자동 처리)와 호환
-- ============================================
CREATE TABLE qa_pairs (
    id           BIGSERIAL PRIMARY KEY,
    content      TEXT NOT NULL,                  -- 정규화된 질문 (임베딩 대상)
    metadata     JSONB DEFAULT '{}'::jsonb,      -- answer_text, department, tags 등 모두 포함
    embedding    VECTOR(1536),                    -- OpenAI text-embedding-3-small
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. 인덱스 — HNSW (점진적 INSERT 대응)
-- ============================================
CREATE INDEX qa_pairs_embedding_hnsw_idx
    ON qa_pairs USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

-- 부서별 필터링 가속
CREATE INDEX qa_pairs_department_idx
    ON qa_pairs ((metadata->>'department'));

-- ============================================
-- 4. updated_at 자동 갱신 트리거 (선택)
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER qa_pairs_updated_at_trigger
    BEFORE UPDATE ON qa_pairs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

### 4-2. 핵심 RPC 함수 — match_documents (LangChain/n8n 표준 컨벤션)

```sql
CREATE OR REPLACE FUNCTION match_documents (
    query_embedding VECTOR(1536),
    match_count     INT DEFAULT 3,
    filter          JSONB DEFAULT '{}'::jsonb
)
RETURNS TABLE (
    id          BIGINT,
    content     TEXT,
    metadata    JSONB,
    similarity  FLOAT
)
LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT
        qa_pairs.id,
        qa_pairs.content,
        qa_pairs.metadata,
        1 - (qa_pairs.embedding <=> query_embedding) AS similarity
    FROM qa_pairs
    WHERE qa_pairs.metadata @> filter
    ORDER BY qa_pairs.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;
```

### 4-3. metadata 구조 (v2.2)

```json
{
  "answer_text":       "SELECT COUNT(DISTINCT user_id) FROM SC_MONIMO_USER_STAT WHERE base_ym = '202603' AND login_cnt >= 1;",
  "question_original": "모니모 MAU 산출 SQL 쿼리 알려주세요",
  "department":        "모니모마케팅팀",
  "responder_id":      "EMP_003",
  "responder_name":    "류원태",
  "tags":              ["MAU", "SQL", "모니모", "지표"],
  "archived_at":       "2026-03-15"
}
```

| 키 | 용도 | 필터링 빈도 |
|---|---|---|
| `answer_text` | 답변 본문 (Answer Agent에 전달) | — (디스플레이) |
| `question_original` | 원본 질문 (정규화 전) | 낮음 |
| `department` | 부서별 검색 한정 | **높음** ★ (전용 인덱스) |
| `responder_id` | 답변자 추적 | 중간 |
| `responder_name` | UI 표시 | 낮음 |
| `tags` | 태그 검색·필터 | 중간 |
| `archived_at` | 적재 시각 | 낮음 |

### 4-4. 시드 데이터 INSERT 예시

```sql
-- 예시 1: 모니모 MAU 쿼리 페어
INSERT INTO qa_pairs (content, metadata) VALUES (
    '모니모 MAU 구하는 SQL 쿼리',
    '{
        "answer_text": "SELECT COUNT(DISTINCT user_id) FROM SC_MONIMO_USER_STAT WHERE base_ym = ''202603'' AND login_cnt >= 1;",
        "question_original": "모니모 MAU 산출 SQL 쿼리 알려주세요",
        "department": "모니모마케팅팀",
        "responder_id": "EMP_003",
        "responder_name": "류원태",
        "tags": ["MAU", "SQL", "모니모", "지표"],
        "archived_at": "2026-03-15"
    }'::jsonb
);

-- 예시 2: 보안성 검토 일정 페어
INSERT INTO qa_pairs (content, metadata) VALUES (
    '개발 건 이관 전 보안성 검토 일정',
    '{
        "answer_text": "보안성 점검은 3~5일 소요됩니다. 이관 일정 고려하여 이관 2~3주 전에 사전 협의 필요합니다.",
        "question_original": "보안성 검토 일정은 언제 협의해야 하나요?",
        "department": "IT보안팀",
        "responder_id": "EMP_001",
        "responder_name": "김보안",
        "tags": ["보안성검토", "이관", "일정"],
        "archived_at": "2026-03-20"
    }'::jsonb
);
```

> **임베딩 적재**: 시드 데이터의 `embedding` 컬럼은 워크플로우 B를 일회용으로 실행하여 채움. 또는 별도 batch 스크립트로 처리.

---

## 5. 데모 시나리오 (본선 시연용 — Scene 2종)

### Scene 1 — AI가 알면 자신 있게 답한다 (Action A 시연)

**상황**: 김삼성(채널마케팅팀)이 모니모 MAU SQL 쿼리를 묻는다. 이미 Wiki에 유사 답변 누적됨.

**시연 흐름**:

```
[STEP 1] Knox 메신저 입력
  김삼성: "모니모 MAU 구하는 SQL 쿼리 알려주세요"

       ↓ n8n Webhook 수신 (POST /webhook/knox-message)

[STEP 2] 질문 정규화 + 임베딩
  → "모니모 MAU 구하는 SQL 쿼리"

       ↓ match_documents 호출

[STEP 3] Q-Q 유사도 검색 결과
  Top 1: "모니모 MAU 산출 SQL" (similarity 0.89)
  Top 2: "월간 활성 사용자 SQL" (similarity 0.81)
  Top 3: "SC_MONIMO_USER_STAT 컬럼" (similarity 0.62)

       ↓ IF Node (threshold 0.85)

[STEP 4] 0.89 ≥ 0.85 → Action A
  Answer Agent가 metadata.answer_text를 현재 맥락에 맞춰 정제

       ↓ HTTP Request → 검수 콘솔

[STEP 5] 현업 검수 콘솔 화면
  ┌─────────────────────────────────────────┐
  │ 📩 김삼성 프로 (채널마케팅팀)            │
  │ "모니모 MAU 구하는 SQL 쿼리..."          │
  │                                          │
  │ 💡 AI 추천 답변 (신뢰도 89%)            │
  │ ┌──────────────────────────────────┐    │
  │ │ SELECT COUNT(DISTINCT user_id)   │    │
  │ │ FROM SC_MONIMO_USER_STAT         │    │
  │ │ WHERE base_ym = '202603'         │    │
  │ │   AND login_cnt >= 1;            │    │
  │ └──────────────────────────────────┘    │
  │                                          │
  │ 📚 참고한 과거 질문 3건                  │
  │  • "모니모 MAU 산출 SQL" (0.89)         │
  │  • "월간 활성 사용자 SQL" (0.81)        │
  │  • "SC_MONIMO_USER_STAT 컬럼" (0.62)    │
  │                                          │
  │ [편집] [그대로 발송] [현업 직접 응대]    │
  └─────────────────────────────────────────┘

       ↓ 현업 1-클릭 발송

[STEP 6] Knox 메신저에 답변 도착
  김삼성에게 즉시 회신 표시
```

**시연 핵심 포인트**:
- 유사도 점수가 화면에 노출 → "AI가 자기 확신을 수치로 보여줍니다"
- 참고한 과거 질문 3건이 같이 표시 → "RAG의 근거를 투명하게 공개"
- 현업의 1-클릭 발송 → "최종 책임은 사람에게 있습니다"

### Scene 2 — AI가 모르면 솔직히 모른다고 한다 + 플라이휠 라이브 (Action B 시연)

**상황**: 김신입(서비스개발팀)이 Wiki에 없는 신규 질문을 입력. AI가 응답을 거부하고, 현업이 정적으로 응대한 후 Wiki에 적재되어 동일 질문 재입력 시 매칭됨.

> ⚠️ **[v2.2 상태 주석 — Scene 2 현업 매핑 방식]**
> - 콘솔에 담당 현업 초대 UI 없음, 3자 방 생성 로직 미구현
> - `c_rookie` 채팅방은 dm 타입이며, "담당자를 초대합니다." 시스템 메시지 + 현업 답변이 정적으로 하드코딩
> - PoC 범위 내에서 **정적 메시지 흐름**으로 처리하기로 결정 (이미지화 방식)
> - `data.jsx`에 group 타입 채팅방(`보안성 검토 요청 채널`) 구조는 존재하나, Scene 2와 직접 연결되어 있지 않음
> - 실서비스 전환 시 담당자 매핑 테이블(Supabase) + Knox API 초대 연동 필요

**시연 흐름**:

```
[STEP 1] Knox 메신저 입력
  김신입: "Claude API 키는 어떻게 발급받나요?"

       ↓ n8n Webhook 수신 → 정규화 → 임베딩

[STEP 2] match_documents 검색 결과
  Top 1: "MCP 서버 권한 신청" (similarity 0.41)
  Top 2: "외부 API 사용 승인 절차" (similarity 0.38)
  Top 3: "정보보호 기술 검토" (similarity 0.31)

       ↓ IF Node (threshold 0.85)

[STEP 3] 0.41 < 0.85 → Action B (AI 미응답)
  mode: "FIELD_DIRECT" 응답 생성

       ↓ HTTP Request → 검수 콘솔 (직접 응대 모드)

[STEP 4] 현업 검수 콘솔 화면
  ┌─────────────────────────────────────────┐
  │ 📩 김신입 프로 (서비스개발팀)            │
  │ "Claude API 키는 어떻게 발급받나요?"     │
  │                                          │
  │ ⚠ AI가 답변할 수 없습니다               │
  │ ┌──────────────────────────────────┐    │
  │ │ 유사한 과거 사례를 찾을 수 없어  │    │
  │ │ Hallucination 방지를 위해 답변을 │    │
  │ │ 생성하지 않았습니다.             │    │
  │ │ 최고 유사도: 0.41 (임계값 0.85)  │    │
  │ └──────────────────────────────────┘    │
  │                                          │
  │ 🔍 가장 가까운 과거 질문                 │
  │  • "MCP 서버 권한 신청" (0.41)          │
  │                                          │
  │ [직접 답변 작성하기]                     │
  └─────────────────────────────────────────┘

       ↓ 현업(류원태) 직접 응대 [정적 메시지 흐름으로 표현]

[STEP 5] Knox 메신저에 답변 표시 (정적 하드코딩)
  시스템: "담당자를 초대합니다."
  류원태: "Anthropic Console에서 발급받으면 됩니다.
           정보보호 검토 후 사용 가능합니다..."

       ↓ 응대 완료

[STEP 6] 메신저 대화 드래그 → 우클릭 → "위키에 추가하기"
  (chat-room.jsx에 기 구현된 기능 — query string으로 전달)

       ↓ console/app/wiki/add/page.tsx 랜딩

[STEP 7] Wiki 적재 확인 화면
  ┌─────────────────────────────────────────┐
  │ 📝 Wiki에 추가하시겠습니까?              │
  │                                          │
  │ 질문 (편집 가능)                         │
  │ ┌──────────────────────────────────┐    │
  │ │ Claude API 키 발급 방법은?       │    │
  │ └──────────────────────────────────┘    │
  │                                          │
  │ 답변 (편집 가능)                         │
  │ ┌──────────────────────────────────┐    │
  │ │ Anthropic Console에서 발급...    │    │
  │ └──────────────────────────────────┘    │
  │                                          │
  │ 부서: [서비스개발팀 ▾]                  │
  │ 태그: [API] [발급] [Claude]              │
  │                                          │
  │ [Wiki에 추가] [취소]                     │
  └─────────────────────────────────────────┘

       ↓ POST /webhook/knox-wiki-add → 워크플로우 B
       ↓ 필수값 검증 → 정규화 → metadata 조립 → INSERT + 임베딩 적재

[STEP 8] ★ 플라이휠 라이브 시연
  시연자가 다시 Knox에서 동일 질문 입력
  "Claude API 키 발급 방법 알려주세요"
  → 이번엔 유사도 0.95로 자동 매칭
  → Action A로 자동 응답
  → "방금 학습한 내용이 즉시 적용됩니다" 시연
```

**시연 핵심 포인트**:
- **"AI가 모른다고 인정하는 능력"** — 금융권에서 가장 중요한 trust signal
- 유사도 수치(0.41)가 화면에 노출 → 왜 답변하지 않는지 정량적 근거 제시
- 드래그 → Wiki 적재 → **즉시 동일 질문 재시연으로 매칭 성공** = 플라이휠 라이브 데모
- 평가위원이 가장 의심할 "AI가 헛소리하면 어떻게 하나요?"에 직접 답하는 시나리오

---

## 6. 화면(Frontend) 구성

### 6-1. 화면 구성 (총 4종)

| # | 화면 | 역할 | 기술 | 배포 URL |
|---|---|---|---|---|
| 1 | **Knox 메신저 (목업)** | 질문자가 채팅 입력 / 현업이 답변 발송 | 정적 React (`Knock Messenger.html`) · **현재 모바일형 (Android 380×800 shell)** | https://knock-knox-messenger.vercel.app/Knock%20Messenger.html |
| 2 | **현업 검수 콘솔** | AI 초안 + 신뢰도 + 소스 표시 / Action A·B 분기 표시 | Next.js (`console/app/console/page.tsx`) + Supabase Realtime | https://knock-knox-console.vercel.app/ |
| 3 | **Wiki 적재 페이지** | 드래그한 대화 미리보기 → 저장 | Next.js · **정본: `console/app/wiki/add/page.tsx`** | https://knock-knox-console.vercel.app/wiki/add |
| 4 | **(보안 명세 카드)** | PoC 보안 정책 패널 (정적 텍스트) | 콘솔 내 패널 컴포넌트 | — |

> ⚠️ **[v2.2 상태 주석 — wiki-add 경로]**
> - **정본**: `console/app/wiki/add/page.tsx` — `knox-wiki-add` n8n webhook POST 실제 구현체
> - **Legacy**: `messenger/wiki-add.html`, `messenger/wiki-add.bundle.html` — URL query string을 JSON 표시하는 placeholder. 이번 PoC 작업 범위 밖.
> - `chat-room.jsx`의 우클릭 이벤트는 현재 `wiki-add.html`로 query string을 전달하도록 되어 있음 → 데모 전 `console/wiki/add` URL로 변경 필요.

> ⚠️ **[v2.2 상태 주석 — Knox 목업 버전]**
> - 현재 배포: 모바일형 (Android device shell, 380×800px)
> - PC 버전 재작업 진행 중 (정수민)
> - PC 버전 완료 시 Cursor 작업지시서 v3.0 재발행 필요
> - UI 골격(`Knock Messenger.html`, `*.jsx`, `android-frame.jsx`) 수정 금지 원칙 유지

### 6-2. Frontend 규칙 (디자인 가이드 준수)

**불변 원칙** (디자인 가이드 인용):
- `Knock Messenger.html` 및 동봉된 `*.jsx`, `android-frame.jsx` 컴포넌트의 **UI 골격/디자인 토큰은 절대 수정 금지**
- 콘텐츠 변경은 **`data.jsx` 한 파일에서만** (`PEOPLE`, `CHATS`, `MESSAGES`)
- 우클릭 → "위키에 추가하기" 이벤트는 **이미 `chat-room.jsx`에 구현되어 있음** → **`console/wiki/add` URL로 query string 전달** (기존 `wiki-add.html` 경로는 데모 전 교체 필요)
- 새로 만드는 검수 콘솔/Wiki 페이지는 **별도 Next.js 페이지**로 구축 (기존 목업과 분리)

**`data.jsx` 콘텐츠 수정 체크리스트** (디자인 가이드 §6 인용):
1. `PEOPLE` 객체 — 김보안(IT보안팀), 김삼성(채널마케팅팀), 류원태(모니모마케팅팀) 등 시나리오 인물 정의
2. `CHATS` 배열 — 채팅방 리스트 (시나리오 1, 2별 채팅방)
3. `MESSAGES` 객체 — 채팅방별 메시지 스레드
4. `chat-list.jsx`의 `personHue`에 새 인물 id 색상 추가 (필요시)
5. `KNOCK_CONFIG.useTestWebhook` — 데모 당일 `false`로 변경

### 6-3. 데이터 흐름 (Realtime)

```
[Knox 목업: 질문 입력]
        |
        v  POST /webhook/knox-message
[n8n 워크플로우 A 실행 (ID: qGddk1phr96Kuz6t)]
        |
        v  match_documents 호출 (Supabase: scmlaiiypectfoboejam)
[Supabase qa_pairs 테이블 ← 현재 미생성, 최우선 블로커]
        |
        v  Supabase Realtime 이벤트 발행
[현업 검수 콘솔 — Action A or B 모드로 자동 갱신]
        |
        |--- Action A: 검수 → 발송
        |       |
        |       v  채팅 응답 INSERT
        |       |
        |       v  Realtime → Knox 목업에 답변 도착
        |
        |--- Action B: 직접 답변 → 발송 → "위키에 추가하기" 클릭
                |
                v  POST /webhook/knox-wiki-add
                |
                v  [n8n 워크플로우 B 실행 (ID: Lxtjx8UE6Hbxfvko)]
                |
                v  필수값 검증 → 정규화 → metadata 조립
                |
                v  INSERT INTO qa_pairs (with embedding)
                |
                v  플라이휠 완성
```

### 6-4. 보안 명세 카드 콘텐츠 (화면 내 패널)

```
┌─────────────────────────────────────────────┐
│ 🛡 본 PoC의 보안 범위                       │
├─────────────────────────────────────────────┤
│ ✓ 더미 데이터 한정 운영                     │
│   (실 인사·고객 정보 미사용)                 │
│ ✓ Anthropic Cloud API                       │
│   (학습 미사용 SLA 기준)                     │
│ ✓ Supabase Cloud                            │
│   (실서비스 시 온프레미스 전환 전제)         │
├─────────────────────────────────────────────┤
│ 🔜 실서비스 적용 시 보강                    │
│ • IT보안팀 정보보호 정책과 분류 룰셋 연동   │
│ • 사번/성명/연락처 정규식 마스킹            │
│   → 익명 토큰 치환                          │
│ • 온프레미스 pgvector 전환                  │
│   (외부 전송 없음)                          │
│ • 보안 등급 변경 시 운영팀 승인 + 감사 로그 │
└─────────────────────────────────────────────┘
```

---

## 7. 3-Day 구현 로드맵

### DAY 1 — Front/Backend 기반 구축

| 담당 | 작업 |
|---|---|
| **류원태** | n8n 파이프라인 설계 완료 ✅ / Supabase credentials 연결 상태 n8n MCP 확인 필요 |
| **김주명** | ⚠️ **최우선**: Supabase `qa_pairs` 테이블 + HNSW 인덱스 + `match_documents` RPC 마이그레이션 실행 |
| **정수민** | Knox 목업 `data.jsx` 시나리오 데이터 작성 완료 ✅ / PC 버전 Figma 재작업 진행 중 |
| **공통** | Claude API Key, OpenAI Embeddings API Key, Supabase 연동 검증 |

### DAY 2 — AI Agent 개발 및 Frontend 연동

| 담당 | 작업 |
|---|---|
| **류원태** | n8n 워크플로우 A Supabase credentials 연결 + 시드 데이터로 Action A E2E 검증 |
| **김주명** | Wiki 시드 Q-A 페어 30~50건 작성 + 워크플로우 B로 임베딩 일괄 적재 |
| **정수민** | 검수 콘솔 Action A·B 분기 UI 완성 / wiki-add URL 교체 (`wiki-add.html` → `/wiki/add`) |
| **공통** | 목업 ↔ Agent ↔ DB 연동 1차 테스트 (Scene 1 End-to-End) |

### DAY 3 — Workflow 완성 및 데모 QA

| 담당 | 작업 |
|---|---|
| **류원태** | 워크플로우 B Scene 2 시나리오 검증 + 통합 테스트 QA |
| **김주명** | 유사도 임계점 튜닝 (0.80~0.90 P/R 곡선 확인) + 시드 데이터 보강(50~70건) |
| **정수민** | Scene 1·2 5-Screen 데모 플로우 QA + 목업 ↔ Agent 연동 개선 |
| **공통** | 발표 자료 정합성 검토 (PPT ↔ 실 구현 일치 확인) + 백업 영상 녹화 |

**백업 플랜**: 목업 연동 실패 시 Supabase 기반 단순 EM(Eval Mode) 기능으로 대체. n8n 워크플로우만으로 시연 가능한 폴백 경로 확보.

---

## 8. 데이터 전략 (PoC vs 실서비스)

### 8-1. PoC 기준 (본선 단계)

| 항목 | 내용 |
|---|---|
| KNOX 대화 데이터 | 인터뷰 기반 더미 시나리오 (사번/성명 실제 미포함) |
| Wiki 지식베이스 | 3개 부서(IT보안·경리·모니모) 인터뷰 기반 더미 Q&A 30~70건 |
| 저장 인프라 | Supabase Cloud (`scmlaiiypectfoboejam.supabase.co`) |
| LLM API | Anthropic Cloud API + OpenAI Embeddings API (공개 플랜, 더미 데이터만 사용) |
| 보안 분류 | **별도 노드 미구현** — 화면 내 보안 명세 카드로 정책 명시 |

### 8-2. 실서비스 전환 시

| 항목 | 내용 |
|---|---|
| KNOX 대화 데이터 | Knox API 실시간 연동, 수신 즉시 마스킹 후 LLM 전달 |
| Wiki 지식베이스 | 사내망 온프레미스 pgvector 서버, 외부 클라우드 저장 無 |
| 저장 인프라 | 온프레미스 RAG 전환 — 벡터 포함 외부 미전송 |
| LLM API | Anthropic Enterprise API (데이터 학습 미사용 SLA) 또는 온프레미스 AI Agent |
| 보안 분류 | IT보안팀 정보보호 정책 기준 연동, 변경 시 운영팀 승인 후 룰셋 업데이트, 감사 로그 보관 |
| 마스킹 정책 | 사번/성명/연락처 정규식 탐지 → 익명 토큰 치환 (예: 김보안 → `[EMP_001]`) Claude API 전송 전 n8n 노드에서 처리 |

---

## 9. 평가위원 어필 포인트 (Demo Selling Points)

1. **Q-Q RAG의 도메인 정합성** — "답변 문서를 검색하는 일반 RAG"가 아니라 **"같은 질문이 과거에 있었나"를 묻는 사내 FAQ Agent**임을 명시.

2. **AI의 자기 한계 인정** — Scene 2의 핵심. 임계값 미달 시 답변 거부 → Hallucination 방지를 코드 한 줄로 보장. 금융권 trust signal.

3. **플라이휠 라이브 시연** — Wiki 적재 직후 동일 질문 재시연으로 자동 매칭 성공.

4. **인간 책임 모델** — AI는 초안만 생성, 발송 책임은 현업이 보유. 금융권 책임 소재 문제 해결.

5. **n8n IF 노드 분리 설계** — Confidence Thresholding을 Agent 프롬프트 안에 숨기지 않고 시각적으로 분리.

6. **단일 스택 단순성** — n8n + Supabase + Claude만으로 모든 기능 구현.

7. **보안 명세의 명시적 노출** — PoC 범위를 의도적으로 한정, 실서비스 전환 시 보강 항목을 화면에 명시.

8. **표준 컨벤션 준수** — Supabase 함수명 `match_documents`, LangChain Vector Store 표준 사용.

### 9-1. 평가위원 예상 질의 대응

| 예상 질문 | 답변 |
|---|---|
| "Validation은 왜 별도로 안 두셨나요?" | "Q-Q RAG 구조 자체가 검증 메커니즘입니다. 답변은 과거에 현업이 실제 사용한 검증된 답변이며, 0.85 임계값이 매칭 품질을 보장합니다. 최종 검증은 검수 콘솔에서 현업이 수행합니다." |
| "왜 IVFFlat이 아니라 HNSW인가요?" | "IVFFlat은 인덱스 생성 시점의 데이터로 k-means 클러스터링이 고정됩니다. 저희는 시드 30~50건에서 시작해 플라이휠로 점진 증가하는 운영 패턴이므로, 빈 테이블에도 인덱스 생성이 가능하고 동적 INSERT에 강한 HNSW가 적합합니다." |
| "테이블 하나에 다 넣는 게 정규화 위반 아닌가요?" | "Q-Q RAG의 핵심은 검색 단위(질문)와 보유 단위(질문+답변+메타)를 일치시키는 것입니다. 단일 테이블이 LangChain·n8n 표준 컨벤션이며, PoC 데이터 규모에서는 분리·정규화의 이점이 거의 없습니다." |
| "왜 한국어 임베딩 모델이 아니라 OpenAI를?" | "한국어 단문(질문 30~50토큰) 임베딩은 text-embedding-3-small에서도 충분한 의미 분리가 가능합니다. n8n 노드 호환성과 운영 단순성을 우선 고려했습니다." |
| "3자 방 구성은 왜 없나요?" | "PoC 범위 내에서는 Knox API 직접 통합이 불가하여, 현업 응대 흐름을 정적 메시지로 표현했습니다. 실서비스 전환 시 Knox API + 담당자 매핑 테이블(Supabase)로 구현 가능합니다." |

---

## 10. 구현 체크리스트 (Cursor 작업용)

### Backend (Supabase + n8n) — 현재 상태 반영

- [x] Supabase 프로젝트 생성 (`scmlaiiypectfoboejam.supabase.co`)
- [x] `.env.local` 환경변수 설정 완료 (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY)
- [ ] ⚠️ **최우선 블로커** — §4-1 `qa_pairs` 테이블 마이그레이션 실행 (SQL Editor)
- [ ] ⚠️ **최우선 블로커** — §4-1 HNSW 인덱스 + department 인덱스 생성
- [ ] ⚠️ **최우선 블로커** — §4-2 `match_documents` RPC 함수 생성 및 SELECT 테스트
- [ ] 시드 Q-A 페어 30~50건 작성 (인터뷰 기반 더미 데이터)
- [x] n8n 워크플로우 A 구축 완료 (ID: `qGddk1phr96Kuz6t`, Active)
- [x] n8n 워크플로우 B 구축 완료 (ID: `Lxtjx8UE6Hbxfvko`, Active)
- [ ] n8n 워크플로우 A Supabase credentials 연결 상태 확인 (n8n 대시보드)
- [ ] 시드 데이터 임베딩 일괄 적재 (워크플로우 B 일회용 실행)

### Frontend (Next.js + 기존 목업) — 현재 상태 반영

- [x] Knock Messenger 목업 배포 완료 (https://knock-knox-messenger.vercel.app/Knock%20Messenger.html) · 모바일형
- [x] 우클릭 → "위키에 추가하기" 컨텍스트 메뉴 구현 완료 (`chat-room.jsx`)
- [x] `data.jsx` — `KNOCK_CONFIG` (Webhook URL) 추가 완료
- [x] `data.jsx` — Scene 1(c_mau) / Scene 2(c_rookie) 시나리오 데이터 작성 완료
- [ ] `chat-room.jsx` — wiki-add URL 교체 (`wiki-add.html` → `console/wiki/add` URL)
- [x] Next.js 검수 콘솔 (`/console`) 배포 완료 (https://knock-knox-console.vercel.app/)
- [ ] 검수 콘솔 — Action A·B 분기 UI 완성 (Supabase Realtime 구독)
- [x] Next.js Wiki 적재 페이지 (`/wiki/add`) — `console/app/wiki/add/page.tsx` 실제 구현체 존재
- [ ] 보안 명세 카드 패널 컴포넌트 (콘솔 내)
- [ ] `data.jsx` `useTestWebhook: false` 전환 (데모 당일)

### 데모 준비

- [ ] Scene 1 End-to-End 시연 (모니모 MAU 쿼리) — Supabase 시드 적재 후 가능
- [ ] Scene 2 End-to-End 시연 (Claude API 키 → AI 미응답 → Wiki 적재 → 재시연으로 매칭)
- [ ] 임계점 튜닝 (0.80~0.90 P/R 곡선)
- [ ] 발표용 슬라이드 ↔ 실 구현 정합성 검증
- [ ] 백업 영상 녹화 (네트워크 이슈 대비)

---

## 11. 주의사항 & 원칙

1. **디자인 가이드 절대 준수** — `Knock Messenger.html` 및 `*.jsx`, `android-frame.jsx`의 UI 골격/테마 토큰 수정 금지. 콘텐츠는 `data.jsx`에서만 변경.

2. **단일 스택 유지** — LangGraph, 외부 LangChain Python 서버 등 추가 프레임워크 도입 금지. n8n 내장 LangChain 노드로만 구현.

3. **content 컬럼에는 질문만** — Q-Q RAG의 본질. 절대 답변 텍스트를 content 컬럼에 함께 넣지 말 것. **답변은 `metadata.answer_text`에 저장**.

4. **함수명은 `match_documents`** — n8n Vector Store 노드 기본 컨벤션. 변경 시 노드 설정에서 명시 필요 → 디버깅 비용 ↑.

5. **인덱스는 HNSW** — IVFFlat 절대 사용 금지.

6. **Confidence 분기는 n8n IF 노드** — Agent 프롬프트 내부에 숨기지 않음. 시각적 투명성 확보.

7. **Wiki 적재는 staff-initiated** — 자동 적재 금지. 현업이 명시적으로 "위키에 추가하기"를 누른 경우에만 임베딩 → 적재.

8. **인간 책임 명시** — UI/UX에 "AI 초안", "현업 검수 필요" 라벨 명시. 발송 버튼은 현업만 누를 수 있음.

9. **임베딩 모델 고정** — `text-embedding-3-small (1536차원)`. 차원이 고정되므로 도중 변경 불가.

10. **임계값 0.85** — 본선 Day 3 QA에서 시드 데이터로 P/R 곡선 확인 후 0.80~0.90 사이 조정.

11. **wiki-add URL** — `chat-room.jsx`의 우클릭 이벤트 목적지를 반드시 `console/wiki/add` URL로 교체 후 데모 진행.

---

## 부록 A. 핵심 프롬프트 템플릿

### A-1. Answer Agent (Q-Q 매칭 결과 정제)
```
당신은 사내 업무 문의에 답하는 AI 어시스턴트입니다.
과거에 답변된 유사한 질문이 있어 그 답변을 참고하여 현재 질문에 정제된 답변을 작성합니다.

[현재 질문]
{{ $json.current_question }}

[매칭된 과거 질문] (유사도 {{ $json.similarity }})
{{ $json.matched_question }}

[과거 답변 본문]
{{ $json.matched_answer }}

[참고 정보]
- 답변 부서: {{ $json.matched_department }}
- 답변자: {{ $json.matched_responder }}

지침:
- 정중한 사내 메신저 톤 유지 ("안녕하세요 프로님, ~팀 ~~입니다." 형식)
- 과거 답변의 사실(테이블명, 절차, 수치 등)은 절대 변경 금지
- 현재 질문 맥락에 맞게 표현만 다듬기
- 추측이나 보강 정보 추가 금지

JSON 반환:
{
  "draft": "현업이 검수할 답변 초안",
  "confidence": 유사도 점수,
  "sources": [{"qa_pair_id": ..., "matched_question": ..., "similarity": ...}, ...]
}
```

### A-2. Summarize Agent (선택 — 워크플로우 B에 추가 시)

> ⚠️ **[v2.2 상태 주석]** 현재 워크플로우 B에는 Summarize Agent가 없습니다. `page.tsx`에서 Q-A를 분리하여 전송합니다. 추후 n8n 워크플로우 B에 Haiku 노드를 추가할 경우 아래 프롬프트를 사용합니다.

```
다음 사내 메신저 대화를 Wiki에 적재할 수 있도록 {question, answer} 형태로 요약하세요.

[대화 원문]
{{ $json.chat_text }}

[발신 부서] {{ $json.department }}
[답변자] {{ $json.responder_name }}

요약 지침:
- 질문은 핵심 의도만 1~2문장으로 (인사말·잡담 제거)
- 답변은 절차/수치/근거를 보존하되 군더더기 제거
- 발신자 식별 정보(사번·이름·연락처) 마스킹

JSON 반환:
{
  "question": "정규화된 질문",
  "answer": "정제된 답변",
  "tags": ["태그1", "태그2", "태그3"]
}
```

---

## 부록 B. n8n 노드 설정 치트시트

### B-1. Supabase Vector Store 노드 (Get Many — 워크플로우 A에서 사용)
```
Operation Mode: Get Many
Table Name: qa_pairs
Query Name: match_documents   (또는 빈칸 → 기본값 자동 인식)
Prompt: {{ $('질문 정규화').item.json.question_normalized }}
Limit: 3

Options:
  Metadata Filter (JSON, 선택):
    { "department": "{{ $('Webhook Trigger').item.json.sender_dept }}" }

Sub-node 연결:
  Embedding: Embeddings OpenAI (text-embedding-3-small)
```

**출력 구조** (n8n 자동 변환):
```json
[
  {
    "pageContent": "모니모 MAU 산출 SQL",
    "metadata": {
      "answer_text": "SELECT COUNT(DISTINCT user_id) FROM ...",
      "department": "모니모마케팅팀",
      "responder_name": "류원태",
      "tags": ["MAU", "SQL", "모니모"]
    },
    "score": 0.89
  }
]
```

### B-2. Supabase Vector Store 노드 (Insert Documents — 워크플로우 B에서 사용)
```
Operation Mode: Insert Documents
Table Name: qa_pairs

Sub-node 연결:
  Loader: Default Data Loader
    Mode: JSON
    JSON Content: {{ $json.question_normalized }}
    JSON Metadata:
      {
        "answer_text":       "{{ $json.answer }}",
        "question_original": "{{ $json.question_original }}",
        "department":        "{{ $json.department }}",
        "responder_id":      "{{ $json.responder_id }}",
        "responder_name":    "{{ $json.responder_name }}",
        "tags":              {{ JSON.stringify($json.tags) }},
        "archived_at":       "{{ $now.toISO() }}"
      }

  Embedding: Embeddings OpenAI (text-embedding-3-small)
```

> **핵심**: `answer_text`를 별도 컬럼이 아닌 **metadata 안에** 저장.

### B-3. IF Node 설정 (유사도 임계점 분기)
```
Condition Type: Number
Value 1: {{ $json[0].score }}
Operation: Greater Than or Equal
Value 2: 0.85

TRUE  분기 → Action A (Answer Agent)
FALSE 분기 → Action B (Field Direct)
```

### B-4. 데모 당일 URL 전환
```javascript
// messenger/data.jsx 에서:
useTestWebhook: false,  // ← true → false 로 변경 후 강력 새로고침 (Ctrl+Shift+R)
```

---

## 부록 C. 데이터 구조 요약 (한눈에 보기)

```
qa_pairs (단일 통합 테이블) — ⚠️ 원격 미생성, §4-1 SQL 실행 필요
├─ id              : BIGSERIAL PK (자동 증가)
├─ content         : TEXT — 정규화된 질문 (임베딩 대상)
├─ metadata        : JSONB
│   ├─ answer_text         : 답변 본문
│   ├─ question_original   : 원본 질문
│   ├─ department          : 답변 부서 (전용 인덱스)
│   ├─ responder_id        : 답변자 ID
│   ├─ responder_name      : 답변자 이름
│   ├─ tags                : 태그 배열
│   └─ archived_at         : 적재 시각
├─ embedding       : VECTOR(1536) — text-embedding-3-small
├─ created_at      : 적재 시각
└─ updated_at      : 마지막 업데이트

인덱스
├─ qa_pairs_embedding_hnsw_idx   : HNSW (m=16, ef_construction=64)
└─ qa_pairs_department_idx       : ((metadata->>'department'))

match_documents RPC
  IN:  query_embedding, match_count (기본 3), filter (기본 {})
  OUT: [{id, content, metadata, similarity}, ...]

n8n 워크플로우
├─ 워크플로우 A (Scene 1): ID=qGddk1phr96Kuz6t · Active · 13노드
│   URL: https://wontaeryu.app.n8n.cloud/workflow/qGddk1phr96Kuz6t
│   Webhook: POST /webhook/knox-message
└─ 워크플로우 B (Scene 2): ID=Lxtjx8UE6Hbxfvko · Active · 10노드
    URL: https://wontaeryu.app.n8n.cloud/workflow/Lxtjx8UE6Hbxfvko
    Webhook: POST /webhook/knox-wiki-add

Frontend
├─ Knox 목업 (모바일형): https://knock-knox-messenger.vercel.app/Knock%20Messenger.html
├─ 검수 콘솔: https://knock-knox-console.vercel.app/
└─ Wiki 적재 (정본): console/app/wiki/add/page.tsx
   URL: https://knock-knox-console.vercel.app/wiki/add
```

---

## 부록 D. PPTX 발표 자료 수정 포인트 (v2.2 반영)

| 슬라이드 영역 | 기존 | v2.2 반영 |
|---|---|---|
| Slide 13~14 "에이전트 워크플로우" | RAG 기반 유사도 | **Q-Q RAG 기반 질문 유사도** 명시 |
| Slide 15 "검색된 Wiki 청크" | [Doc1, Doc2, Doc3] | **[Past Question 1, 2, 3]** — Q-Q 명시 |
| Slide 16 "Database" | 질의응답 이력 데이터 저장/관리 | **질문 임베딩 + 답변 metadata 분리 저장 (Q-Q 구조)** |
| Slide 18~19 "데이터 활용 및 보안" | 보안 등급 차단 자동 분류 | **PoC 범위 한정 + 실서비스 시 보강 항목 명시** |
| Slide 21~22 "구현 로드맵 / R&R" | (기존) | **Day 2의 RAG 파이프라인 = Q-Q 임베딩 적재** |
| Slide 26 "n8n 노드 구성안" | 6개 노드 (설계) | **워크플로우 A 13개 / B 10개 (실제 배포 기준)** |

**발표 핵심 메시지 (한 줄)**:
> "우리는 답변 문서를 검색하는 일반 RAG가 아니라, **'과거에 같은 질문이 있었는가'를 묻는 Q-Q RAG**로 사내 업무 문의 도메인 특성을 정확히 반영했습니다."

---

**문서 끝.** 본 v2.2 명세서는 2026-05-17 Cursor 코드베이스 실황 확인 + n8n MCP 직접 조회 결과를 반영한 최신 작업 지침서입니다. Cursor 컨텍스트에 그대로 포함하여 vibe-coding 진행 가능합니다.

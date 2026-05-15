# Knock_Knox 프로젝트 디렉터리 트리

> `README.md`의 「폴더 구조」와 동기화된 참고용 문서입니다. (생성 기준: 저장소 실제 파일 기준)

```
Knock_Knox/
├── messenger/                          ← Knox 메신저 목업 (HTML + React CDN, 빌드 없음)
│   ├── Knock Messenger.html            ← 진입점 (소스 기반)
│   ├── Knock Messenger.bundle.html     ← 단일 HTML 번들 배포용 (A안)
│   ├── data.jsx                        ← 콘텐츠·Webhook 설정 단일 소스
│   ├── chat-list.jsx
│   ├── chat-room.jsx
│   ├── icons.jsx
│   ├── android-frame.jsx               ← 디바이스 프레임 UI
│   ├── wiki-add.html                   ← 위키 랜딩 placeholder (legacy; 본 페이지는 console/wiki/add)
│   └── wiki-add.bundle.html            ← 위키 placeholder 단일 번들
│
├── console/                            ← Next.js 14 App Router + TypeScript + Tailwind
│   ├── app/
│   │   ├── page.tsx
│   │   ├── layout.tsx
│   │   ├── globals.css
│   │   ├── console/
│   │   │   └── page.tsx                ← AI 초안 검수 콘솔
│   │   ├── wiki/
│   │   │   └── add/
│   │   │       └── page.tsx            ← 위키 적재 페이지
│   │   └── api/
│   │       └── console-update/
│   │           └── route.ts            ← n8n 수신 엔드포인트
│   ├── lib/
│   │   └── supabase.ts
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   ├── next.config.js
│   ├── postcss.config.js
│   ├── next-env.d.ts                   ← Next.js 타입 참조 (자동 생성·커밋 관행에 따름)
│   ├── .gitignore
│   └── .env.local.example
│
├── supabase/
│   └── migrations/
│       └── 001_init.sql                ← DB 스키마 (pgvector, RLS, Realtime, RPC)
│
├── seed/
│   └── qa_seed.sql                     ← 데모 시드 데이터 (3개 부서 × 10건)
│
├── uploads/                            ← 데모·자료용 이미지 등 (선택)
│
├── HANDOFF.md                          ← messenger 콘텐츠 수정 가이드
├── CLAUDE_PROJECT_PROMPT.md            ← Claude Project 등록용 프롬프트
├── Knock_Knox.md                       ← 내부 작업·요구사항 메모
├── KNOCK_Knox_PoC_구현명세서_v2.1.md   ← PoC 구현 명세
├── FOLDER_STRUCTURE.md                 ← 본 문서 (디렉터리 트리)
└── README.md
```

## README와의 관계

- 상단 트리는 **현재 저장소**의 디렉터리·파일을 반영합니다.
- 요약·역할 설명은 `README.md`의 「폴더 구조」 섹션을 따릅니다. 상세 트리는 본 파일을 기준으로 하시면 됩니다.

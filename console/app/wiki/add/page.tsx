'use client';

// console/app/wiki/add/page.tsx
// Knox 메신저에서 "위키에 추가하기" 우클릭 후 landing 하는 페이지.
// query string으로 전달된 채팅을 확인·편집한 뒤 n8n Wiki Webhook으로 전송합니다.

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const DEFAULT_WIKI_WEBHOOK_URL =
  'https://wontaeryu.app.n8n.cloud/webhook/knox-wiki-add';

const DEPARTMENTS = [
  '모니모마케팅팀',
  '서비스개발팀',
  'IT보안팀',
  '채널마케팅팀',
  '기타',
];

type SaveState = 'idle' | 'success' | 'error';

export default function WikiAddPage() {
  return (
    <Suspense fallback={<LoadingScreen text="페이지 준비 중…" />}>
      <WikiAddInner />
    </Suspense>
  );
}

function WikiAddInner() {
  const router = useRouter();
  const sp = useSearchParams();

  const chatText  = sp.get('text')   ?? '';
  const author    = sp.get('author') ?? '';
  const chatTitle = sp.get('chat')   ?? '';
  const msgTime   = sp.get('time')   ?? '';
  const messageId = sp.get('id')     ?? '';

  const [question, setQuestion] = useState(chatText);
  const [answer, setAnswer] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagDraft, setTagDraft] = useState('');
  const [department, setDepartment] = useState(DEPARTMENTS[0]);
  const [saving, setSaving] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>('idle');

  // ── 태그 추가/삭제 ───────────────────────────────────────────────────────
  const addTag = () => {
    const t = tagDraft.trim();
    if (!t) return;
    if (tags.includes(t)) return;
    setTags([...tags, t]);
    setTagDraft('');
  };
  const removeTag = (t: string) => setTags(tags.filter((x) => x !== t));

  // ── Wiki 저장 요청 (n8n Webhook POST) ───────────────────────────────────
  const save = async () => {
    setSaving(true);
    setSaveState('idle');
    try {
      const webhookUrl =
        process.env.NEXT_PUBLIC_WIKI_WEBHOOK_URL ?? DEFAULT_WIKI_WEBHOOK_URL;
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_text: chatText,
          question,
          answer,
          department,
          responder_name: author,
          tags,
          channel_id: chatTitle,
          message_id: messageId,
        }),
      });
      if (!res.ok) throw new Error(`webhook_failed:${res.status}`);
      setSaveState('success');
    } catch (err) {
      console.error('[wiki-add] save error:', err);
      setSaveState('error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0C0F] text-white font-[Noto_Sans_KR,sans-serif]">
      <div className="max-w-[480px] mx-auto px-5 py-6">
        <header className="mb-6">
          <h1 className="text-xl font-bold tracking-tight">📝 Wiki에 추가하기</h1>
          <p className="text-xs text-[#8A9BA8] mt-1">
            {chatTitle && `${chatTitle} · `}
            {author && `${author} · `}
            {msgTime}
          </p>
        </header>

        <Field label="원본 대화 내용">
          <textarea
            value={chatText}
            readOnly
            className="w-full min-h-[120px] p-3 rounded-md border border-[#2A2F36] bg-[#11161A] text-sm leading-relaxed text-[#C8D0D8] resize-none"
          />
        </Field>

        <Field label="질문">
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="정규화된 질문을 입력하세요"
            className="w-full min-h-[80px] p-3 rounded-md border border-[#2A2F36] bg-[#1A1F22] text-sm leading-relaxed focus:outline-none focus:border-[#4F8AFE] resize-y"
          />
        </Field>

        <Field label="답변">
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="답변 내용을 입력하세요"
            className="w-full min-h-[160px] p-3 rounded-md border border-[#2A2F36] bg-[#1A1F22] text-sm leading-relaxed focus:outline-none focus:border-[#4F8AFE] resize-y"
          />
        </Field>

        <Field label="태그">
          <div className="flex flex-wrap gap-2 mb-2">
            {tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-[#2A3B5C] text-[#7FA9F4]"
              >
                #{t}
                <button
                  type="button"
                  onClick={() => removeTag(t)}
                  className="text-[#7FA9F4]/70 hover:text-white"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={tagDraft}
              onChange={(e) => setTagDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addTag();
                }
              }}
              placeholder="태그 입력 후 Enter"
              className="flex-1 px-3 py-2 rounded-md border border-[#2A2F36] bg-[#1A1F22] text-sm focus:outline-none focus:border-[#4F8AFE]"
            />
            <button
              type="button"
              onClick={addTag}
              className="px-3 py-2 rounded-md bg-[#1A1F22] border border-[#2A2F36] text-sm hover:bg-[#222A2F]"
            >
              추가
            </button>
          </div>
        </Field>

        <Field label="부서">
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="w-full px-3 py-2 rounded-md border border-[#2A2F36] bg-[#1A1F22] text-sm focus:outline-none focus:border-[#4F8AFE]"
          >
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </Field>

        {saveState === 'success' && (
          <div className="mb-3 p-3 rounded-md border border-[#2ECC71]/40 bg-[#0F2E1F] text-xs text-[#2ECC71]">
            ✅ Wiki에 추가되었습니다
          </div>
        )}

        {saveState === 'error' && (
          <div className="mb-3 p-3 rounded-md border border-[#E74C3C]/40 bg-[#2A0F0F] text-xs text-[#E74C3C]">
            ⚠️ 추가 실패. 다시 시도해주세요
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <button
            onClick={() => router.back()}
            disabled={saving}
            className="flex-1 px-4 py-3 rounded-lg border border-[#2A2F36] bg-[#1A1F22] text-sm font-medium hover:bg-[#222A2F] disabled:opacity-50"
          >
            취소
          </button>
          <button
            onClick={save}
            disabled={saving || !question.trim() || !answer.trim()}
            className="flex-1 px-4 py-3 rounded-lg bg-[#4F8AFE] hover:bg-[#3E78EA] text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? '전송 중…' : '최종 확인 — Wiki에 추가'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── 보조 컴포넌트 ───────────────────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <label className="block text-xs font-semibold text-[#8A9BA8] mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function LoadingScreen({ text }: { text: string }) {
  return (
    <Centered>
      <div className="w-8 h-8 border-2 border-[#4F8AFE] border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-sm text-[#8A9BA8]">{text}</p>
    </Centered>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0A0C0F] text-white flex flex-col items-center justify-center px-6 text-center">
      {children}
    </div>
  );
}

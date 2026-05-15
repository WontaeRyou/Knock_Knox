'use client';

// console/app/wiki/add/page.tsx
// Knox 메신저에서 "위키에 추가하기" 우클릭 후 landing 하는 페이지.
// query string으로 전달된 채팅을 Summarize Agent가 요약 → 편집 → Wiki 저장.

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase';

const N8N_SUMMARIZE_URL =
  'https://wontaeryu.app.n8n.cloud/webhook-test/knox-wiki-add';

const DEPARTMENTS = [
  '모니모마케팅팀',
  '정보보호실',
  '서비스개발팀',
  'IT보안팀',
  '데이터플랫폼팀',
];

// 작성자 → 기본 부서 추정 (간단 매핑)
const AUTHOR_TO_DEPT: Record<string, string> = {
  류원태: '모니모마케팅팀',
  김보안: '정보보호실',
  박개발: '서비스개발팀',
  정모니: '모니모사업팀',
};

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

  const [loading, setLoading] = useState(true);
  const [agentError, setAgentError] = useState(false);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagDraft, setTagDraft] = useState('');
  const [department, setDepartment] = useState(
    AUTHOR_TO_DEPT[author] ?? '모니모마케팅팀',
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // ── 진입 시 Summarize Agent 호출 ─────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(N8N_SUMMARIZE_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_text: chatText,
            responder_name: author,
            department: AUTHOR_TO_DEPT[author] ?? '모니모마케팅팀',
          }),
        });
        if (!res.ok) throw new Error('summarize_failed');
        const data = await res.json();
        if (cancelled) return;
        setQuestion(data.question ?? '');
        setAnswer(data.answer ?? '');
        setTags(Array.isArray(data.tags) ? data.tags : []);
      } catch (err) {
        console.error('[wiki-add] summarize error:', err);
        if (!cancelled) setAgentError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [chatText, author]);

  // ── 태그 추가/삭제 ───────────────────────────────────────────────────────
  const addTag = () => {
    const t = tagDraft.trim();
    if (!t) return;
    if (tags.includes(t)) return;
    setTags([...tags, t]);
    setTagDraft('');
  };
  const removeTag = (t: string) => setTags(tags.filter((x) => x !== t));

  // ── Wiki 저장 (Supabase qa_pairs INSERT) ────────────────────────────────
  const save = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const supabase = createBrowserClient();
      const { error } = await supabase.from('qa_pairs').insert({
        content: question,
        metadata: {
          answer_text: answer,
          question_original: chatText,
          department,
          responder_name: author,
          tags,
          archived_at: new Date().toISOString().slice(0, 10),
        },
      });
      if (error) throw error;
      setSaved(true);
      setTimeout(() => router.back(), 3000);
    } catch (err) {
      console.error('[wiki-add] save error:', err);
      setSaveError('Wiki 저장에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingScreen text="🤖 Summarize Agent가 정리하는 중…" />;

  if (saved) {
    return (
      <Centered>
        <p className="text-2xl mb-3">✅ Wiki에 추가되었습니다!</p>
        <p className="text-sm text-[#8A9BA8]">3초 후 Knox 메신저로 돌아갑니다…</p>
      </Centered>
    );
  }

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

        {agentError && (
          <div className="mb-4 p-3 rounded-md border border-[#F39C12]/40 bg-[#2A1F0A] text-xs text-[#F39C12]">
            ⚠️ AI 요약에 실패했습니다. 아래에 직접 입력해주세요.
          </div>
        )}

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

        {saveError && (
          <div className="mb-3 p-3 rounded-md border border-[#E74C3C]/40 bg-[#2A0F0F] text-xs text-[#E74C3C]">
            {saveError}
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
            {saving ? '저장 중…' : '📝 Wiki에 추가'}
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

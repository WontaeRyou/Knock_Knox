'use client';

// console/app/console/page.tsx
// 현업 담당자가 사용하는 AI 초안 검수 콘솔.
// n8n에서 처리한 결과가 Supabase Realtime을 통해 실시간으로 표시됩니다.

import { useEffect, useState } from 'react';
import { createBrowserClient, type Inquiry } from '@/lib/supabase';

type ConnState = 'connecting' | 'connected' | 'error';

export default function ConsolePage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [conn, setConn] = useState<ConnState>('connecting');
  const [showSecurity, setShowSecurity] = useState(false);

  // ── 초기 로드 + Realtime 구독 ─────────────────────────────────────────────
  useEffect(() => {
    let client: ReturnType<typeof createBrowserClient>;
    try {
      client = createBrowserClient();
    } catch (error) {
      console.error('[console] supabase client init error:', error);
      setConn('error');
      return;
    }

    let mounted = true;

    (async () => {
      const { data, error } = await client
        .from('inquiries')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (!mounted) return;
      if (error) {
        console.error('[console] initial load error:', error);
      } else if (data) {
        setInquiries(data as Inquiry[]);
        if (data.length > 0) setSelectedId((data[0] as Inquiry).id);
      }
    })();

    const channel = client
      .channel('inquiries-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'inquiries' },
        (payload) => {
          const row = payload.new as Inquiry;
          setInquiries((prev) => [row, ...prev]);
          setSelectedId((curr) => curr ?? row.id);
        },
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') setConn('connected');
        else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') setConn('error');
      });

    return () => {
      mounted = false;
      client.removeChannel(channel);
    };
  }, []);

  const selected = inquiries.find((i) => i.id === selectedId) ?? null;
  const pendingCount = inquiries.filter((i) => i.status === 'pending').length;

  return (
    <div className="flex h-screen w-full bg-[#0A0C0F] text-white font-[Noto_Sans_KR,sans-serif]">
      {/* ── 좌측: 문의 리스트 (30%) ────────────────────────────────────── */}
      <aside className="w-[30%] min-w-[320px] border-r border-[#2A2F36] flex flex-col">
        <div className="px-5 py-4 border-b border-[#2A2F36] flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">🛡 해일미리 검수 콘솔</h1>
            <p className="text-xs text-[#8A9BA8] mt-0.5">
              미처리 <span className="text-[#4F8AFE] font-semibold">{pendingCount}</span>건 / 전체 {inquiries.length}건
            </p>
          </div>
          <ConnDot state={conn} />
        </div>

        <ul className="flex-1 overflow-auto">
          {inquiries.length === 0 && (
            <li className="px-5 py-8 text-sm text-[#8A9BA8]">
              아직 접수된 문의가 없습니다.
            </li>
          )}
          {inquiries.map((it) => (
            <li
              key={it.id}
              onClick={() => setSelectedId(it.id)}
              className={`px-5 py-3 border-b border-[#1A1F22] cursor-pointer transition-colors ${
                it.id === selectedId ? 'bg-[#1A1F22]' : 'hover:bg-[#1A1F22]/60'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-medium">
                  {it.sender_name}
                  <span className="text-[#8A9BA8] font-normal"> · {it.sender_dept}</span>
                </span>
                <ModeBadge mode={it.mode} />
              </div>
              <p className="text-xs text-[#8A9BA8] truncate">
                {it.original_question.slice(0, 30)}
                {it.original_question.length > 30 ? '…' : ''}
              </p>
              <div className="flex items-center justify-between mt-2">
                <StatusDot status={it.status} />
                <span className="text-[10px] text-[#5C6770]">{fmtTime(it.created_at)}</span>
              </div>
            </li>
          ))}
        </ul>
      </aside>

      {/* ── 우측: 상세 패널 (70%) ──────────────────────────────────────── */}
      <main className="flex-1 overflow-auto relative">
        {/* 보안 명세 토글 (우상단) */}
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={() => setShowSecurity((v) => !v)}
            className="text-xs px-3 py-1.5 rounded-md border border-[#2A2F36] bg-[#1A1F22] hover:bg-[#222A2F] transition"
          >
            🛡 본 PoC 보안 범위
          </button>
          {showSecurity && (
            <div className="mt-2 w-[340px] p-4 rounded-lg border border-[#2A2F36] bg-[#1A1F22] text-xs leading-relaxed shadow-2xl">
              <p className="font-semibold text-[#2ECC71] mb-2">현재 PoC 보안 범위</p>
              <ul className="space-y-1 text-[#8A9BA8]">
                <li>• 더미 데이터 한정 운영</li>
                <li>• Anthropic Cloud API (학습 미사용 SLA)</li>
                <li>• Supabase Cloud (실서비스 시 온프레미스 전환 전제)</li>
              </ul>
              <p className="font-semibold text-[#F39C12] mt-3 mb-2">실서비스 보강 항목</p>
              <ul className="space-y-1 text-[#8A9BA8]">
                <li>• IT보안팀 정보보호 정책 연동</li>
                <li>• 사번·성명 마스킹</li>
                <li>• 온프레미스 pgvector 전환</li>
              </ul>
            </div>
          )}
        </div>

        {!selected ? (
          <EmptyState conn={conn} />
        ) : selected.mode === 'AI_DRAFT' ? (
          <DraftPanel inquiry={selected} />
        ) : (
          <DirectPanel inquiry={selected} />
        )}
      </main>
    </div>
  );
}

// ── Action A (AI_DRAFT) 상세 패널 ─────────────────────────────────────────
function DraftPanel({ inquiry }: { inquiry: Inquiry }) {
  const [draft, setDraft] = useState(inquiry.ai_draft ?? '');
  useEffect(() => setDraft(inquiry.ai_draft ?? ''), [inquiry.id, inquiry.ai_draft]);

  const conf = Math.round((inquiry.ai_confidence ?? 0) * 100);

  return (
    <div className="p-8 max-w-3xl mx-auto pt-20">
      <SenderHeader inquiry={inquiry} />

      <Section title="원본 질문">
        <div className="p-4 rounded-lg border border-[#2A2F36] bg-[#1A1F22] text-sm leading-relaxed">
          {inquiry.original_question}
        </div>
      </Section>

      <Section title="💡 AI 추천 답변">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-xs text-[#8A9BA8]">Confidence</span>
          <div className="flex-1 h-2 rounded-full bg-[#1A1F22] overflow-hidden">
            <div className="h-full bg-[#2ECC71]" style={{ width: `${conf}%` }} />
          </div>
          <span className="text-sm font-semibold text-[#2ECC71]">{conf}%</span>
        </div>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="w-full min-h-[180px] p-4 rounded-lg border border-[#2A2F36] bg-[#1A1F22] text-sm leading-relaxed font-[Noto_Sans_KR,sans-serif] focus:outline-none focus:border-[#4F8AFE] resize-y"
        />
      </Section>

      <Section title="📚 참조한 과거 질문">
        <div className="space-y-2">
          {inquiry.sources.length === 0 && (
            <p className="text-sm text-[#8A9BA8]">참조한 과거 질문이 없습니다.</p>
          )}
          {inquiry.sources.map((s, i) => (
            <div
              key={i}
              className="flex items-start gap-3 p-3 rounded-md border border-[#2A2F36] bg-[#1A1F22]"
            >
              <span className="text-xs px-2 py-0.5 rounded bg-[#2A3B5C] text-[#7FA9F4] font-mono">
                {Math.round(s.similarity * 100)}%
              </span>
              <p className="text-sm text-[#E6EAEE] leading-relaxed">{s.matched_question}</p>
            </div>
          ))}
        </div>
      </Section>

      <div className="flex gap-3 pt-4 border-t border-[#2A2F36]">
        <Button variant="primary">✏️ 수정 후 발송</Button>
        <Button variant="secondary">✅ 그대로 발송</Button>
        <Button variant="warn">🔀 직접 응대로 전환</Button>
      </div>
    </div>
  );
}

// ── Action B (FIELD_DIRECT) 상세 패널 ─────────────────────────────────────
function DirectPanel({ inquiry }: { inquiry: Inquiry }) {
  const top = inquiry.sources[0];
  const sim = Math.round((inquiry.ai_confidence ?? top?.similarity ?? 0) * 100);
  const threshold = 85;

  return (
    <div className="p-8 max-w-3xl mx-auto pt-20">
      <SenderHeader inquiry={inquiry} />

      <Section title="원본 질문">
        <div className="p-4 rounded-lg border border-[#2A2F36] bg-[#1A1F22] text-sm leading-relaxed">
          {inquiry.original_question}
        </div>
      </Section>

      <div className="p-4 rounded-lg border border-[#F39C12] bg-[#2A1F0A] mb-6">
        <p className="font-semibold text-[#F39C12] mb-1">⚠️ AI가 답변할 수 없습니다</p>
        <p className="text-sm text-[#E6E0CC] leading-relaxed">
          유사한 과거 사례를 찾지 못해 Hallucination 방지를 위해 답변을 생성하지 않았습니다.
        </p>
        <div className="mt-3 space-y-1 text-xs text-[#8A9BA8]">
          <p>
            최고 유사도:{' '}
            <span className="font-mono text-[#F39C12]">{sim}%</span>
          </p>
          <p>
            임계값:{' '}
            <span className="font-mono text-[#F39C12]">{threshold}%</span>
          </p>
        </div>
      </div>

      <Section title="🔍 가장 가까운 과거 질문">
        <div className="p-4 rounded-lg border border-[#2A2F36] bg-[#1A1F22] text-sm">
          {top ? (
            <>
              <p className="text-[#E6EAEE] leading-relaxed mb-2">
                “{top.matched_question}”
              </p>
              <p className="text-xs font-mono text-[#8A9BA8]">
                유사도 {Math.round(top.similarity * 100)}%
              </p>
            </>
          ) : (
            <p className="text-[#8A9BA8]">매칭된 과거 질문이 없습니다.</p>
          )}
        </div>
      </Section>

      <div className="pt-4 border-t border-[#2A2F36] space-y-3">
        <div className="p-4 rounded-lg border border-[#2A2F36] bg-[#1A1F22] text-sm text-[#E6EAEE] leading-relaxed">
          Knox에서 직접 답변 후 말풍선 우클릭 → 위키에 추가하기로 플라이휠을 완성하세요.
        </div>
        <Button variant="primary">💬 Knox에서 직접 응대하기</Button>
      </div>
    </div>
  );
}

// ── 빈 상태 ────────────────────────────────────────────────────────────────
function EmptyState({ conn }: { conn: ConnState }) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-[#8A9BA8]">
      <div className="text-5xl mb-4">📭</div>
      <p className="text-sm">아직 접수된 문의가 없습니다</p>
      <p className="text-xs mt-2">
        Realtime 상태: <ConnLabel state={conn} />
      </p>
    </div>
  );
}

// ── 보조 컴포넌트 ───────────────────────────────────────────────────────────
function SenderHeader({ inquiry }: { inquiry: Inquiry }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="w-10 h-10 rounded-full bg-[#2A3B5C] text-[#7FA9F4] flex items-center justify-center font-semibold">
        {inquiry.sender_name?.[0] ?? '?'}
      </div>
      <div>
        <p className="text-sm font-semibold">{inquiry.sender_name}</p>
        <p className="text-xs text-[#8A9BA8]">
          {inquiry.sender_dept} · channel:
          <span className="font-mono ml-1">{inquiry.channel_id}</span>
        </p>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <h2 className="text-sm font-semibold text-[#E6EAEE] mb-2">{title}</h2>
      {children}
    </section>
  );
}

function ModeBadge({ mode }: { mode: Inquiry['mode'] }) {
  if (mode === 'AI_DRAFT') {
    return (
      <span className="text-[10px] px-2 py-0.5 rounded bg-[#0F2E1F] text-[#2ECC71] border border-[#2ECC71]/30">
        🤖 AI 초안
      </span>
    );
  }
  return (
    <span className="text-[10px] px-2 py-0.5 rounded bg-[#2A1F0A] text-[#F39C12] border border-[#F39C12]/30">
      👤 직접 응대
    </span>
  );
}

function StatusDot({ status }: { status: Inquiry['status'] }) {
  const map: Record<Inquiry['status'], { color: string; label: string }> = {
    pending:  { color: '#4F8AFE', label: '대기' },
    reviewed: { color: '#5C6770', label: '검토됨' },
    sent:     { color: '#5C6770', label: '발송됨' },
    routed:   { color: '#5C6770', label: '라우팅' },
  };
  const s = map[status];
  return (
    <span className="flex items-center gap-1.5 text-[10px] text-[#8A9BA8]">
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.color }} />
      {s.label}
    </span>
  );
}

function ConnDot({ state }: { state: ConnState }) {
  const c = state === 'connected' ? '#2ECC71' : state === 'connecting' ? '#F39C12' : '#E74C3C';
  return <span className="w-2 h-2 rounded-full" style={{ background: c }} title={state} />;
}

function ConnLabel({ state }: { state: ConnState }) {
  if (state === 'connected') return <span className="text-[#2ECC71]">● 연결됨</span>;
  if (state === 'connecting') return <span className="text-[#F39C12]">● 연결 중</span>;
  return <span className="text-[#E74C3C]">● 오류</span>;
}

function Button({
  children,
  variant,
}: {
  children: React.ReactNode;
  variant: 'primary' | 'secondary' | 'warn';
}) {
  const cls = {
    primary:   'bg-[#4F8AFE] hover:bg-[#3E78EA] text-white',
    secondary: 'bg-[#2ECC71] hover:bg-[#27B864] text-white',
    warn:      'bg-[#1A1F22] hover:bg-[#222A2F] text-[#F39C12] border border-[#F39C12]/40',
  }[variant];
  return (
    <button className={`px-4 py-2.5 rounded-lg text-sm font-medium transition ${cls}`}>
      {children}
    </button>
  );
}

function fmtTime(iso: string) {
  try {
    const d = new Date(iso);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  } catch {
    return '';
  }
}

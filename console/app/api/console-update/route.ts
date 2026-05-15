// console/app/api/console-update/route.ts
// n8n 워크플로우에서 처리 결과(Action A/B)를 수신하는 Next.js API Route.
// 수신 → Supabase inquiries 테이블 INSERT → Realtime이 콘솔 UI에 push.

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type Inquiry } from '@/lib/supabase';

// ── 수신 Body 타입 ──────────────────────────────────────────────────────────
type Source = { matched_question: string; similarity: number };

type ActionAPayload = {
  mode: 'AI_DRAFT';
  original_question: string;
  sender_name: string;
  sender_dept: string;
  channel_id: string;
  agent_response: {
    draft: string;
    confidence: number;
    sources: Source[];
  };
};

type ActionBPayload = {
  mode: 'FIELD_DIRECT';
  original_question: string;
  sender_name: string;
  sender_dept: string;
  channel_id: string;
  top_similarity: number;
  top_match: string;
};

type ConsoleUpdatePayload = ActionAPayload | ActionBPayload;

// ── POST /api/console-update ────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  // 1) 보안: 헤더 시크릿 검증
  const secret = req.headers.get('x-console-secret');
  const expected = process.env.CONSOLE_API_SECRET;
  if (!expected || secret !== expected) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  // 2) Body 파싱
  let body: ConsoleUpdatePayload;
  try {
    body = (await req.json()) as ConsoleUpdatePayload;
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 });
  }

  if (!body?.mode || (body.mode !== 'AI_DRAFT' && body.mode !== 'FIELD_DIRECT')) {
    return NextResponse.json({ ok: false, error: 'invalid_mode' }, { status: 400 });
  }

  // 3) inquiries 테이블 INSERT 페이로드 구성
  const base = {
    mode: body.mode,
    original_question: body.original_question,
    sender_name: body.sender_name,
    sender_dept: body.sender_dept,
    channel_id: body.channel_id,
    status: 'pending' as const,
  };

  let row: Omit<Inquiry, 'id' | 'created_at'>;
  if (body.mode === 'AI_DRAFT') {
    row = {
      ...base,
      ai_draft: body.agent_response.draft,
      ai_confidence: body.agent_response.confidence,
      sources: body.agent_response.sources ?? [],
    };
  } else {
    row = {
      ...base,
      ai_draft: null,
      ai_confidence: body.top_similarity,
      sources: [{ matched_question: body.top_match, similarity: body.top_similarity }],
    };
  }

  // 4) Supabase INSERT (service role)
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from('inquiries')
      .insert(row)
      .select('id')
      .single();

    if (error) {
      console.error('[console-update] supabase error:', error);
      return NextResponse.json({ ok: false, error: 'db_insert_failed' }, { status: 500 });
    }
    return NextResponse.json({ ok: true, id: data?.id });
  } catch (err) {
    console.error('[console-update] unexpected:', err);
    return NextResponse.json({ ok: false, error: 'server_error' }, { status: 500 });
  }
}

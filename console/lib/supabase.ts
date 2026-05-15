// console/lib/supabase.ts
// Supabase 클라이언트 팩토리 + 공통 타입.
// 브라우저용(anon key, 싱글톤) / 서버용(service role key, 매 호출 생성) 분리.

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// ── env 검증 ────────────────────────────────────────────────────────────────
function requiredEnv(key: string): string {
  const v = process.env[key];
  if (!v) {
    throw new Error(
      `[supabase] 환경변수 ${key} 가 설정되지 않았습니다. console/.env.local 을 확인하세요.`,
    );
  }
  return v;
}

// ── 브라우저용 (싱글톤) ─────────────────────────────────────────────────────
let browserClient: SupabaseClient | null = null;

export function createBrowserClient(): SupabaseClient {
  if (browserClient) return browserClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    throw new Error(
      '[supabase] NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY 가 누락되었습니다.',
    );
  }
  browserClient = createClient(url, anon, {
    realtime: { params: { eventsPerSecond: 10 } },
  });
  return browserClient;
}

// ── 서버용 (API Route, Service Role) ────────────────────────────────────────
// 매 호출마다 새 인스턴스 — Vercel 서버리스 환경에서 안전.
export function createServerClient(): SupabaseClient {
  const url = requiredEnv('NEXT_PUBLIC_SUPABASE_URL');
  const serviceKey = requiredEnv('SUPABASE_SERVICE_ROLE_KEY');
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// ── 공통 타입 ───────────────────────────────────────────────────────────────
export type InquirySource = {
  matched_question: string;
  similarity: number;
};

export interface Inquiry {
  id: string;
  mode: 'AI_DRAFT' | 'FIELD_DIRECT';
  original_question: string;
  sender_name: string;
  sender_dept: string;
  channel_id: string;
  ai_draft: string | null;
  ai_confidence: number | null;
  sources: InquirySource[];
  status: 'pending' | 'reviewed' | 'sent' | 'routed';
  created_at: string;
}

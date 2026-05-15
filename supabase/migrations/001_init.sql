-- ============================================================================
-- supabase/migrations/001_init.sql
-- Knox_Knox / 해일미리 — DB 초기화 (한 번 실행하면 전체 스키마 구성됨)
-- 멱등성 보장: IF NOT EXISTS / CREATE OR REPLACE 사용
-- ============================================================================

-- 1) pgvector 확장 ----------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pgcrypto;  -- gen_random_uuid()

-- 2) qa_pairs — RAG 지식베이스 ----------------------------------------------
CREATE TABLE IF NOT EXISTS public.qa_pairs (
  id          BIGSERIAL PRIMARY KEY,
  content     TEXT NOT NULL,                                -- 정규화된 질문(임베딩 대상)
  metadata    JSONB NOT NULL DEFAULT '{}'::jsonb,           -- answer_text, question_original, department, responder_id, responder_name, tags, archived_at
  embedding   VECTOR(1536),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3) inquiries — 검수 콘솔 ---------------------------------------------------
CREATE TABLE IF NOT EXISTS public.inquiries (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mode               TEXT NOT NULL CHECK (mode IN ('AI_DRAFT', 'FIELD_DIRECT')),
  original_question  TEXT NOT NULL,
  sender_name        TEXT,
  sender_dept        TEXT,
  channel_id         TEXT,
  ai_draft           TEXT,
  ai_confidence      FLOAT,
  sources            JSONB NOT NULL DEFAULT '[]'::jsonb,
  status             TEXT NOT NULL DEFAULT 'pending'
                       CHECK (status IN ('pending', 'reviewed', 'sent', 'routed')),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4) 인덱스 ------------------------------------------------------------------
-- 4-1) qa_pairs HNSW (cosine) — 벡터 유사도 검색
CREATE INDEX IF NOT EXISTS qa_pairs_embedding_hnsw_idx
  ON public.qa_pairs
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- 4-2) qa_pairs metadata.department — 부서 필터링 가속
CREATE INDEX IF NOT EXISTS qa_pairs_dept_idx
  ON public.qa_pairs ((metadata->>'department'));

-- 4-3) inquiries 상태 / 시간 정렬용
CREATE INDEX IF NOT EXISTS inquiries_status_idx     ON public.inquiries (status);
CREATE INDEX IF NOT EXISTS inquiries_created_at_idx ON public.inquiries (created_at DESC);

-- 5) updated_at 자동 갱신 트리거 (qa_pairs 전용) -----------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS qa_pairs_set_updated_at ON public.qa_pairs;
CREATE TRIGGER qa_pairs_set_updated_at
  BEFORE UPDATE ON public.qa_pairs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 6) RAG 검색 RPC — match_documents -----------------------------------------
-- query_embedding 과 cosine 유사도가 가장 높은 row 들을 반환.
-- filter 는 metadata @> filter 로 부분 매칭 (예: {"department":"모니모마케팅팀"}).
CREATE OR REPLACE FUNCTION public.match_documents(
  query_embedding VECTOR(1536),
  match_count     INT     DEFAULT 3,
  filter          JSONB   DEFAULT '{}'::jsonb
)
RETURNS TABLE (
  id         BIGINT,
  content    TEXT,
  metadata   JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    q.id,
    q.content,
    q.metadata,
    1 - (q.embedding <=> query_embedding) AS similarity
  FROM public.qa_pairs q
  WHERE q.embedding IS NOT NULL
    AND q.metadata @> filter
  ORDER BY q.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 7) Realtime 활성화 --------------------------------------------------------
-- 검수 콘솔이 INSERT 이벤트를 실시간 구독.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'inquiries'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.inquiries';
  END IF;
END $$;

-- 8) RLS (Row Level Security) -----------------------------------------------
ALTER TABLE public.qa_pairs  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

-- 8-1) qa_pairs: SELECT 공개 / 쓰기는 service role 만
DROP POLICY IF EXISTS qa_pairs_select_public ON public.qa_pairs;
CREATE POLICY qa_pairs_select_public
  ON public.qa_pairs FOR SELECT
  USING (true);

DROP POLICY IF EXISTS qa_pairs_write_service ON public.qa_pairs;
CREATE POLICY qa_pairs_write_service
  ON public.qa_pairs FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- 8-2) inquiries: 모든 작업 service role 만 (anon 은 읽기만)
DROP POLICY IF EXISTS inquiries_select_public ON public.inquiries;
CREATE POLICY inquiries_select_public
  ON public.inquiries FOR SELECT
  USING (true);

DROP POLICY IF EXISTS inquiries_write_service ON public.inquiries;
CREATE POLICY inquiries_write_service
  ON public.inquiries FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- ============================================================================
-- 완료. seed/qa_seed.sql 로 데모 시드 데이터를 적재하세요.
-- embedding 컬럼은 n8n 워크플로우 B(Wiki 적재)가 별도로 채웁니다.
-- ============================================================================

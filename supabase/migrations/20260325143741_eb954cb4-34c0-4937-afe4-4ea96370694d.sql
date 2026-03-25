
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- 1. knowledge_documents table
CREATE TABLE public.knowledge_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type text NOT NULL CHECK (source_type IN ('curriculum','phonics_rule','faq','assessment_logic','parent_help','ai_policy')),
  title text NOT NULL,
  level_no integer,
  week_no integer,
  day_no integer,
  topic text,
  audience text NOT NULL DEFAULT 'ai_internal' CHECK (audience IN ('student','parent','admin','ai_internal')),
  metadata jsonb NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.knowledge_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage knowledge documents"
  ON public.knowledge_documents FOR ALL TO authenticated
  USING (public.get_user_role(auth.uid()) = 'admin')
  WITH CHECK (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Authenticated users can read active knowledge documents"
  ON public.knowledge_documents FOR SELECT TO authenticated
  USING (status = 'active');

-- 2. knowledge_chunks table
CREATE TABLE public.knowledge_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.knowledge_documents(id) ON DELETE CASCADE,
  chunk_index integer NOT NULL,
  chunk_type text,
  content text NOT NULL,
  embedding extensions.vector(1536),
  tags text[] NOT NULL DEFAULT '{}',
  level_no integer,
  week_no integer,
  day_no integer,
  lesson_part integer,
  skill_code text,
  visibility text NOT NULL DEFAULT 'internal',
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.knowledge_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage knowledge chunks"
  ON public.knowledge_chunks FOR ALL TO authenticated
  USING (public.get_user_role(auth.uid()) = 'admin')
  WITH CHECK (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Authenticated users can read visible chunks"
  ON public.knowledge_chunks FOR SELECT TO authenticated
  USING (visibility IN ('public', 'internal'));

-- Create HNSW index for vector similarity search
CREATE INDEX ON public.knowledge_chunks USING hnsw (embedding extensions.vector_cosine_ops);

-- 3. ai_interactions table
CREATE TABLE public.ai_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id),
  student_id uuid,
  parent_id uuid,
  role_context text NOT NULL CHECK (role_context IN ('student','parent','admin')),
  interaction_type text NOT NULL CHECK (interaction_type IN ('chat','lesson_support','parent_insight','knowledge_search')),
  query text NOT NULL,
  retrieved_chunks jsonb NOT NULL DEFAULT '[]',
  mcp_tools_used jsonb NOT NULL DEFAULT '[]',
  response_text text,
  response_json jsonb NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'completed',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own interactions"
  ON public.ai_interactions FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own interactions"
  ON public.ai_interactions FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all interactions"
  ON public.ai_interactions FOR SELECT TO authenticated
  USING (public.get_user_role(auth.uid()) = 'admin');

-- 4. parent_ai_outputs table
CREATE TABLE public.parent_ai_outputs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid NOT NULL REFERENCES public.profiles(id),
  student_id uuid NOT NULL REFERENCES public.profiles(id),
  title text,
  summary text,
  strengths jsonb NOT NULL DEFAULT '[]',
  weak_areas jsonb NOT NULL DEFAULT '[]',
  home_support_steps jsonb NOT NULL DEFAULT '[]',
  generated_from jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.parent_ai_outputs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents can view own ai outputs"
  ON public.parent_ai_outputs FOR SELECT TO authenticated
  USING (parent_id = auth.uid());

CREATE POLICY "Parents can insert own ai outputs"
  ON public.parent_ai_outputs FOR INSERT TO authenticated
  WITH CHECK (parent_id = auth.uid());

CREATE POLICY "Admins can view all ai outputs"
  ON public.parent_ai_outputs FOR SELECT TO authenticated
  USING (public.get_user_role(auth.uid()) = 'admin');

-- 5. hidden_mastery_events table
CREATE TABLE public.hidden_mastery_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.profiles(id),
  skill_code text NOT NULL,
  curriculum_day_id uuid REFERENCES public.curriculum_days(id),
  lesson_part integer,
  score numeric,
  confidence numeric,
  source text NOT NULL DEFAULT 'ai_or_lesson_engine',
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.hidden_mastery_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own mastery events"
  ON public.hidden_mastery_events FOR SELECT TO authenticated
  USING (student_id = auth.uid());

CREATE POLICY "Students can insert own mastery events"
  ON public.hidden_mastery_events FOR INSERT TO authenticated
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Parents can view children mastery events"
  ON public.hidden_mastery_events FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.parent_children
    WHERE parent_children.parent_id = auth.uid()
    AND parent_children.child_id = hidden_mastery_events.student_id
  ));

CREATE POLICY "Admins can manage mastery events"
  ON public.hidden_mastery_events FOR ALL TO authenticated
  USING (public.get_user_role(auth.uid()) = 'admin')
  WITH CHECK (public.get_user_role(auth.uid()) = 'admin');

-- 6. rag_index_jobs table
CREATE TABLE public.rag_index_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid REFERENCES public.knowledge_documents(id),
  job_type text NOT NULL CHECK (job_type IN ('insert','update','reindex','delete')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','completed','failed')),
  payload jsonb NOT NULL DEFAULT '{}',
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.rag_index_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage index jobs"
  ON public.rag_index_jobs FOR ALL TO authenticated
  USING (public.get_user_role(auth.uid()) = 'admin')
  WITH CHECK (public.get_user_role(auth.uid()) = 'admin');

-- Vector similarity search function
CREATE OR REPLACE FUNCTION public.search_knowledge_chunks(
  query_embedding extensions.vector(1536),
  match_count integer DEFAULT 5,
  filter_level integer DEFAULT NULL,
  filter_week integer DEFAULT NULL,
  filter_day integer DEFAULT NULL,
  filter_audience text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  document_id uuid,
  chunk_index integer,
  content text,
  chunk_type text,
  level_no integer,
  week_no integer,
  day_no integer,
  lesson_part integer,
  skill_code text,
  tags text[],
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    kc.id,
    kc.document_id,
    kc.chunk_index,
    kc.content,
    kc.chunk_type,
    kc.level_no,
    kc.week_no,
    kc.day_no,
    kc.lesson_part,
    kc.skill_code,
    kc.tags,
    kc.metadata,
    1 - (kc.embedding <=> query_embedding) AS similarity
  FROM public.knowledge_chunks kc
  JOIN public.knowledge_documents kd ON kd.id = kc.document_id
  WHERE kd.status = 'active'
    AND (filter_level IS NULL OR kc.level_no = filter_level)
    AND (filter_week IS NULL OR kc.week_no = filter_week)
    AND (filter_day IS NULL OR kc.day_no = filter_day)
    AND (filter_audience IS NULL OR kd.audience = filter_audience OR kd.audience = 'ai_internal')
    AND kc.embedding IS NOT NULL
  ORDER BY kc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

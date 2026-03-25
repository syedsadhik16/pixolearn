-- Drop and recreate search_knowledge_chunks with extended filters and document metadata
CREATE OR REPLACE FUNCTION public.search_knowledge_chunks(
  query_embedding extensions.vector(1536),
  match_count integer DEFAULT 5,
  filter_level integer DEFAULT NULL,
  filter_week integer DEFAULT NULL,
  filter_day integer DEFAULT NULL,
  filter_audience text DEFAULT NULL,
  filter_lesson_part integer DEFAULT NULL,
  filter_skill_code text DEFAULT NULL,
  filter_source_type text DEFAULT NULL
)
RETURNS TABLE(
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
  similarity double precision,
  document_title text,
  source_type text,
  audience text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
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
    1 - (kc.embedding <=> query_embedding) AS similarity,
    kd.title AS document_title,
    kd.source_type,
    kd.audience
  FROM public.knowledge_chunks kc
  JOIN public.knowledge_documents kd ON kd.id = kc.document_id
  WHERE kd.status = 'active'
    AND (filter_level IS NULL OR kc.level_no = filter_level)
    AND (filter_week IS NULL OR kc.week_no = filter_week)
    AND (filter_day IS NULL OR kc.day_no = filter_day)
    AND (filter_audience IS NULL OR kd.audience = filter_audience OR kd.audience = 'ai_internal')
    AND (filter_lesson_part IS NULL OR kc.lesson_part = filter_lesson_part)
    AND (filter_skill_code IS NULL OR kc.skill_code = filter_skill_code)
    AND (filter_source_type IS NULL OR kd.source_type = filter_source_type)
    AND kc.embedding IS NOT NULL
  ORDER BY kc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
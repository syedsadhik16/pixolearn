
CREATE TABLE public.writing_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  prompt_id TEXT NOT NULL,
  prompt_title TEXT NOT NULL,
  writing_text TEXT NOT NULL,
  score INTEGER,
  grammar_feedback TEXT,
  vocabulary_feedback TEXT,
  creativity_feedback TEXT,
  suggestions JSONB DEFAULT '[]'::jsonb,
  corrected_text TEXT,
  xp_awarded INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.writing_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can insert own submissions"
  ON public.writing_submissions FOR INSERT
  TO authenticated
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can view own submissions"
  ON public.writing_submissions FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

CREATE POLICY "Parents can view children submissions"
  ON public.writing_submissions FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM parent_children
    WHERE parent_children.parent_id = auth.uid()
    AND parent_children.child_id = writing_submissions.student_id
  ));

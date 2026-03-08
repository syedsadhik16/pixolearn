
CREATE TABLE public.saved_words (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  word TEXT NOT NULL,
  meaning TEXT NOT NULL DEFAULT '',
  phonetic TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.saved_words ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own saved words" ON public.saved_words
  FOR SELECT TO authenticated USING (student_id = auth.uid());

CREATE POLICY "Students can insert own saved words" ON public.saved_words
  FOR INSERT TO authenticated WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can delete own saved words" ON public.saved_words
  FOR DELETE TO authenticated USING (student_id = auth.uid());

-- =========================================
-- PRACTICE SESSIONS
-- =========================================
CREATE TABLE IF NOT EXISTS public.practice_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  level_id UUID REFERENCES public.curriculum_levels(id) ON DELETE SET NULL,
  level_no INTEGER,
  skill_code TEXT NOT NULL DEFAULT 'phonics',
  topic_key TEXT NOT NULL,
  topic_label TEXT,
  current_stage TEXT NOT NULL DEFAULT 'warmup' CHECK (current_stage IN ('warmup','strides','sprint','laps','complete')),
  difficulty TEXT NOT NULL DEFAULT 'easy' CHECK (difficulty IN ('easy','medium','hard')),
  total_questions INTEGER NOT NULL DEFAULT 0,
  correct_count INTEGER NOT NULL DEFAULT 0,
  accuracy_percent NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','completed','abandoned')),
  resume_state JSONB NOT NULL DEFAULT '{}'::jsonb,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_practice_sessions_learner ON public.practice_sessions(learner_id, status);
CREATE INDEX IF NOT EXISTS idx_practice_sessions_topic ON public.practice_sessions(learner_id, skill_code, topic_key);

ALTER TABLE public.practice_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students manage own practice sessions" ON public.practice_sessions;
CREATE POLICY "Students manage own practice sessions"
ON public.practice_sessions FOR ALL TO authenticated
USING (learner_id = auth.uid())
WITH CHECK (learner_id = auth.uid());

DROP POLICY IF EXISTS "Parents view children practice sessions" ON public.practice_sessions;
CREATE POLICY "Parents view children practice sessions"
ON public.practice_sessions FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.parent_children WHERE parent_id = auth.uid() AND child_id = practice_sessions.learner_id));

-- =========================================
-- PRACTICE QUIZ ATTEMPTS (MCQ)
-- =========================================
CREATE TABLE IF NOT EXISTS public.practice_quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.practice_sessions(id) ON DELETE CASCADE,
  learner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  question_id UUID,
  question_text TEXT NOT NULL,
  selected_answer TEXT,
  correct_answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  difficulty TEXT NOT NULL DEFAULT 'easy',
  stage TEXT NOT NULL DEFAULT 'warmup',
  time_spent_seconds INTEGER NOT NULL DEFAULT 0,
  hint_used BOOLEAN NOT NULL DEFAULT false,
  skill_code TEXT NOT NULL DEFAULT 'phonics',
  topic_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pqa_session ON public.practice_quiz_attempts(session_id);
CREATE INDEX IF NOT EXISTS idx_pqa_learner ON public.practice_quiz_attempts(learner_id, created_at DESC);

ALTER TABLE public.practice_quiz_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students manage own quiz attempts" ON public.practice_quiz_attempts;
CREATE POLICY "Students manage own quiz attempts"
ON public.practice_quiz_attempts FOR ALL TO authenticated
USING (learner_id = auth.uid())
WITH CHECK (learner_id = auth.uid());

DROP POLICY IF EXISTS "Parents view children quiz attempts" ON public.practice_quiz_attempts;
CREATE POLICY "Parents view children quiz attempts"
ON public.practice_quiz_attempts FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.parent_children WHERE parent_id = auth.uid() AND child_id = practice_quiz_attempts.learner_id));

-- =========================================
-- QUESTION BANK
-- =========================================
CREATE TABLE IF NOT EXISTS public.question_bank (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level_no INTEGER,
  skill_code TEXT NOT NULL DEFAULT 'phonics',
  topic_key TEXT NOT NULL,
  difficulty TEXT NOT NULL DEFAULT 'easy' CHECK (difficulty IN ('easy','medium','hard')),
  question_text TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  correct_answer TEXT NOT NULL,
  hint TEXT,
  explanation TEXT,
  source_day_id UUID REFERENCES public.curriculum_days(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_question_bank_lookup ON public.question_bank(skill_code, topic_key, difficulty, is_active);
CREATE INDEX IF NOT EXISTS idx_question_bank_level ON public.question_bank(level_no, skill_code, difficulty);

ALTER TABLE public.question_bank ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can read active questions" ON public.question_bank;
CREATE POLICY "Authenticated can read active questions"
ON public.question_bank FOR SELECT TO authenticated
USING (is_active = true);

DROP POLICY IF EXISTS "Admins manage question bank" ON public.question_bank;
CREATE POLICY "Admins manage question bank"
ON public.question_bank FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- =========================================
-- STUDENT TOPIC STATE
-- =========================================
CREATE TABLE IF NOT EXISTS public.student_topic_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  skill_code TEXT NOT NULL DEFAULT 'phonics',
  topic_key TEXT NOT NULL,
  level_no INTEGER,
  current_difficulty TEXT NOT NULL DEFAULT 'easy' CHECK (current_difficulty IN ('easy','medium','hard')),
  recent_accuracy NUMERIC NOT NULL DEFAULT 0,
  total_attempts INTEGER NOT NULL DEFAULT 0,
  total_correct INTEGER NOT NULL DEFAULT 0,
  mastery_level TEXT NOT NULL DEFAULT 'developing' CHECK (mastery_level IN ('weak','developing','improving','strong')),
  consecutive_failures INTEGER NOT NULL DEFAULT 0,
  last_practiced_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(learner_id, skill_code, topic_key)
);

CREATE INDEX IF NOT EXISTS idx_topic_state_learner ON public.student_topic_state(learner_id, mastery_level);

ALTER TABLE public.student_topic_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students manage own topic state" ON public.student_topic_state;
CREATE POLICY "Students manage own topic state"
ON public.student_topic_state FOR ALL TO authenticated
USING (learner_id = auth.uid())
WITH CHECK (learner_id = auth.uid());

DROP POLICY IF EXISTS "Parents view children topic state" ON public.student_topic_state;
CREATE POLICY "Parents view children topic state"
ON public.student_topic_state FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.parent_children WHERE parent_id = auth.uid() AND child_id = student_topic_state.learner_id));

-- =========================================
-- TRIGGER: recompute topic state on each attempt
-- =========================================
CREATE OR REPLACE FUNCTION public.update_topic_state_on_attempt()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recent_correct INTEGER;
  recent_total INTEGER;
  recent_acc NUMERIC;
  new_difficulty TEXT;
  new_mastery TEXT;
  consec_fail INTEGER;
BEGIN
  SELECT
    COUNT(*) FILTER (WHERE is_correct),
    COUNT(*)
  INTO recent_correct, recent_total
  FROM (
    SELECT is_correct FROM public.practice_quiz_attempts
    WHERE learner_id = NEW.learner_id
      AND skill_code = NEW.skill_code
      AND topic_key = NEW.topic_key
    ORDER BY created_at DESC
    LIMIT 10
  ) recent;

  recent_acc := CASE WHEN recent_total > 0 THEN (recent_correct::numeric * 100 / recent_total) ELSE 0 END;

  new_difficulty := CASE
    WHEN recent_acc > 80 THEN 'hard'
    WHEN recent_acc >= 50 THEN 'medium'
    ELSE 'easy'
  END;

  new_mastery := CASE
    WHEN recent_acc >= 75 THEN 'strong'
    WHEN recent_acc >= 60 THEN 'improving'
    WHEN recent_acc >= 40 THEN 'developing'
    ELSE 'weak'
  END;

  SELECT COUNT(*) INTO consec_fail
  FROM (
    SELECT is_correct FROM public.practice_quiz_attempts
    WHERE learner_id = NEW.learner_id
      AND skill_code = NEW.skill_code
      AND topic_key = NEW.topic_key
    ORDER BY created_at DESC
    LIMIT 3
  ) last3
  WHERE NOT is_correct;

  INSERT INTO public.student_topic_state
    (learner_id, skill_code, topic_key, current_difficulty, recent_accuracy,
     total_attempts, total_correct, mastery_level, consecutive_failures, last_practiced_at)
  VALUES
    (NEW.learner_id, NEW.skill_code, NEW.topic_key, new_difficulty, recent_acc,
     1, CASE WHEN NEW.is_correct THEN 1 ELSE 0 END, new_mastery,
     CASE WHEN NEW.is_correct THEN 0 ELSE 1 END, now())
  ON CONFLICT (learner_id, skill_code, topic_key) DO UPDATE SET
    current_difficulty = new_difficulty,
    recent_accuracy = recent_acc,
    total_attempts = student_topic_state.total_attempts + 1,
    total_correct = student_topic_state.total_correct + CASE WHEN NEW.is_correct THEN 1 ELSE 0 END,
    mastery_level = new_mastery,
    consecutive_failures = consec_fail,
    last_practiced_at = now(),
    updated_at = now();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_topic_state ON public.practice_quiz_attempts;
CREATE TRIGGER trg_update_topic_state
AFTER INSERT ON public.practice_quiz_attempts
FOR EACH ROW EXECUTE FUNCTION public.update_topic_state_on_attempt();

DROP TRIGGER IF EXISTS trg_practice_sessions_updated ON public.practice_sessions;
CREATE TRIGGER trg_practice_sessions_updated
BEFORE UPDATE ON public.practice_sessions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_student_topic_state_updated ON public.student_topic_state;
CREATE TRIGGER trg_student_topic_state_updated
BEFORE UPDATE ON public.student_topic_state
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
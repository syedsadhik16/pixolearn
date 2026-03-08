
-- Learner profiles for extended student data (avatar, age, stage, goals)
CREATE TABLE public.learner_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  avatar_character text NOT NULL DEFAULT 'pixel',
  age_group text,
  school_stage text,
  learning_goals text[] DEFAULT '{}',
  onboarding_completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(student_id)
);

ALTER TABLE public.learner_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own learner profile" ON public.learner_profiles FOR SELECT USING (student_id = auth.uid());
CREATE POLICY "Students can insert own learner profile" ON public.learner_profiles FOR INSERT WITH CHECK (student_id = auth.uid());
CREATE POLICY "Students can update own learner profile" ON public.learner_profiles FOR UPDATE USING (student_id = auth.uid());
CREATE POLICY "Parents can view children learner profile" ON public.learner_profiles FOR SELECT USING (EXISTS (SELECT 1 FROM parent_children WHERE parent_id = auth.uid() AND child_id = learner_profiles.student_id));

-- Assessment results for Learning Launch Check
CREATE TABLE public.assessment_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  score integer NOT NULL DEFAULT 0,
  total_questions integer NOT NULL DEFAULT 15,
  assigned_level text NOT NULL DEFAULT 'beginner',
  time_taken_seconds integer,
  answers jsonb DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(student_id)
);

ALTER TABLE public.assessment_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own assessment" ON public.assessment_results FOR SELECT USING (student_id = auth.uid());
CREATE POLICY "Students can insert own assessment" ON public.assessment_results FOR INSERT WITH CHECK (student_id = auth.uid());
CREATE POLICY "Parents can view children assessment" ON public.assessment_results FOR SELECT USING (EXISTS (SELECT 1 FROM parent_children WHERE parent_id = auth.uid() AND child_id = assessment_results.student_id));

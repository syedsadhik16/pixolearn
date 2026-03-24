
-- ============================================
-- PIXO Learn Level 1 Curriculum Schema
-- ============================================

-- 1. Curriculum Levels
CREATE TABLE public.curriculum_levels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  level_code text NOT NULL UNIQUE,
  level_name text NOT NULL,
  age_group text NOT NULL DEFAULT '5-8',
  duration_days integer NOT NULL DEFAULT 180,
  duration_months integer NOT NULL DEFAULT 6,
  pedagogy_model text NOT NULL DEFAULT 'sound-first, confidence-first, adaptive, gamified, emotionally safe',
  hidden_mastery_rule text NOT NULL DEFAULT 'accuracy >= 80% and confidence/speaking >= 3/5',
  final_badge text NOT NULL DEFAULT 'Level 1 Sound Explorer',
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Curriculum Months
CREATE TABLE public.curriculum_months (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  level_id uuid NOT NULL REFERENCES public.curriculum_levels(id) ON DELETE CASCADE,
  month_number integer NOT NULL,
  month_title text NOT NULL,
  month_goal text,
  pedagogical_emphasis text,
  milestone_badge text NOT NULL,
  sort_order integer NOT NULL,
  UNIQUE(level_id, month_number)
);

-- 3. Curriculum Weeks
CREATE TABLE public.curriculum_weeks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  level_id uuid NOT NULL REFERENCES public.curriculum_levels(id) ON DELETE CASCADE,
  month_id uuid NOT NULL REFERENCES public.curriculum_months(id) ON DELETE CASCADE,
  week_number integer NOT NULL,
  week_title text NOT NULL,
  weekly_focus text NOT NULL,
  weekly_reward_label text NOT NULL,
  weekly_logic text,
  sort_order integer NOT NULL,
  UNIQUE(level_id, week_number)
);

-- 4. Curriculum Days
CREATE TABLE public.curriculum_days (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  level_id uuid NOT NULL REFERENCES public.curriculum_levels(id) ON DELETE CASCADE,
  month_id uuid NOT NULL REFERENCES public.curriculum_months(id) ON DELETE CASCADE,
  week_id uuid NOT NULL REFERENCES public.curriculum_weeks(id) ON DELETE CASCADE,
  day_number integer NOT NULL,
  title text NOT NULL,
  theme text NOT NULL,
  main_game text NOT NULL,
  reward_badge text NOT NULL,
  daily_xp integer NOT NULL DEFAULT 50,
  weekly_reward_path text,
  hidden_mastery_tags jsonb DEFAULT '[]'::jsonb,
  day_objective text,
  target_skills jsonb DEFAULT '[]'::jsonb,
  target_content jsonb DEFAULT '{}'::jsonb,
  success_criteria jsonb DEFAULT '[]'::jsonb,
  adaptive_logic jsonb DEFAULT '{}'::jsonb,
  end_of_day_outcome jsonb DEFAULT '[]'::jsonb,
  parent_todays_target text,
  parent_words_learned text,
  parent_confidence_note text,
  parent_home_practice text,
  parent_praise_line text,
  is_gate_day boolean NOT NULL DEFAULT false,
  is_milestone_day boolean NOT NULL DEFAULT false,
  unlock_type text NOT NULL DEFAULT 'sequential',
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(level_id, day_number)
);

-- 5. Curriculum Day Parts (6 parts per day)
CREATE TABLE public.curriculum_day_parts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  curriculum_day_id uuid NOT NULL REFERENCES public.curriculum_days(id) ON DELETE CASCADE,
  part_number integer NOT NULL CHECK (part_number BETWEEN 1 AND 6),
  part_name text NOT NULL,
  xp_value integer NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 5,
  interaction_type text NOT NULL DEFAULT 'listen',
  prompt_logic jsonb DEFAULT '{}'::jsonb,
  support_logic jsonb DEFAULT '{}'::jsonb,
  celebration_logic jsonb DEFAULT '{}'::jsonb,
  sort_order integer NOT NULL,
  UNIQUE(curriculum_day_id, part_number)
);

-- 6. Learner Curriculum Progress
CREATE TABLE public.learner_curriculum_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  level_id uuid NOT NULL REFERENCES public.curriculum_levels(id) ON DELETE CASCADE,
  current_month integer NOT NULL DEFAULT 1,
  current_week integer NOT NULL DEFAULT 1,
  current_day integer NOT NULL DEFAULT 1,
  current_part integer NOT NULL DEFAULT 1,
  total_xp integer NOT NULL DEFAULT 0,
  streak_count integer NOT NULL DEFAULT 0,
  treasure_progress integer NOT NULL DEFAULT 0,
  weekly_badges jsonb DEFAULT '[]'::jsonb,
  monthly_badges jsonb DEFAULT '[]'::jsonb,
  completion_percent numeric(5,2) NOT NULL DEFAULT 0.00,
  level_status text NOT NULL DEFAULT 'active',
  level_unlocked_next boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(learner_id, level_id)
);

-- 7. Learner Day Attempts
CREATE TABLE public.learner_day_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  curriculum_day_id uuid NOT NULL REFERENCES public.curriculum_days(id) ON DELETE CASCADE,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  completion_status text NOT NULL DEFAULT 'in_progress',
  total_xp_earned integer NOT NULL DEFAULT 0,
  stars_earned integer NOT NULL DEFAULT 0,
  confidence_score numeric(3,1) DEFAULT 0,
  speaking_score numeric(3,1) DEFAULT 0,
  accuracy_score numeric(5,2) DEFAULT 0,
  hesitation_time integer DEFAULT 0,
  support_needed boolean NOT NULL DEFAULT false,
  mastery_state text NOT NULL DEFAULT 'developing',
  part_progress jsonb DEFAULT '{}'::jsonb,
  parent_sync_status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 8. Learner Hidden Mastery
CREATE TABLE public.learner_hidden_mastery (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  concept_type text NOT NULL,
  concept_key text NOT NULL,
  mastery_score numeric(5,2) NOT NULL DEFAULT 0,
  confidence_score numeric(3,1) NOT NULL DEFAULT 0,
  last_seen_day integer NOT NULL DEFAULT 0,
  support_flag boolean NOT NULL DEFAULT false,
  recommended_review_day integer,
  strength_state text NOT NULL DEFAULT 'developing',
  confusion_pairs jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(learner_id, concept_type, concept_key)
);

-- 9. Learner Parent Outputs
CREATE TABLE public.learner_parent_outputs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  curriculum_day_id uuid NOT NULL REFERENCES public.curriculum_days(id) ON DELETE CASCADE,
  todays_target text NOT NULL,
  words_or_sounds_learned text NOT NULL,
  confidence_note text NOT NULL,
  home_practice text NOT NULL,
  praise_line text NOT NULL,
  generated_at timestamptz NOT NULL DEFAULT now(),
  opened_at timestamptz
);

-- 10. Learner Level Transitions
CREATE TABLE public.learner_level_transitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  from_level text NOT NULL,
  to_level text NOT NULL,
  readiness_summary text,
  strengths jsonb DEFAULT '[]'::jsonb,
  support_needs jsonb DEFAULT '[]'::jsonb,
  bridge_word_list jsonb DEFAULT '[]'::jsonb,
  family_support_plan text,
  transition_status text NOT NULL DEFAULT 'pending',
  generated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.curriculum_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curriculum_months ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curriculum_weeks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curriculum_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curriculum_day_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learner_curriculum_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learner_day_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learner_hidden_mastery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learner_parent_outputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learner_level_transitions ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Curriculum content is readable by all authenticated users
CREATE POLICY "Anyone can view curriculum levels" ON public.curriculum_levels FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can view curriculum months" ON public.curriculum_months FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can view curriculum weeks" ON public.curriculum_weeks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can view curriculum days" ON public.curriculum_days FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can view curriculum day parts" ON public.curriculum_day_parts FOR SELECT TO authenticated USING (true);

-- RLS Policies: Learner data is private
CREATE POLICY "Students can manage own curriculum progress" ON public.learner_curriculum_progress FOR ALL TO authenticated USING (learner_id = auth.uid()) WITH CHECK (learner_id = auth.uid());
CREATE POLICY "Parents can view children curriculum progress" ON public.learner_curriculum_progress FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM parent_children WHERE parent_id = auth.uid() AND child_id = learner_curriculum_progress.learner_id));

CREATE POLICY "Students can manage own day attempts" ON public.learner_day_attempts FOR ALL TO authenticated USING (learner_id = auth.uid()) WITH CHECK (learner_id = auth.uid());
CREATE POLICY "Parents can view children day attempts" ON public.learner_day_attempts FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM parent_children WHERE parent_id = auth.uid() AND child_id = learner_day_attempts.learner_id));

CREATE POLICY "Students can manage own hidden mastery" ON public.learner_hidden_mastery FOR ALL TO authenticated USING (learner_id = auth.uid()) WITH CHECK (learner_id = auth.uid());
CREATE POLICY "Parents can view children hidden mastery" ON public.learner_hidden_mastery FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM parent_children WHERE parent_id = auth.uid() AND child_id = learner_hidden_mastery.learner_id));

CREATE POLICY "Students can manage own parent outputs" ON public.learner_parent_outputs FOR ALL TO authenticated USING (learner_id = auth.uid()) WITH CHECK (learner_id = auth.uid());
CREATE POLICY "Parents can view children parent outputs" ON public.learner_parent_outputs FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM parent_children WHERE parent_id = auth.uid() AND child_id = learner_parent_outputs.learner_id));

CREATE POLICY "Students can manage own level transitions" ON public.learner_level_transitions FOR ALL TO authenticated USING (learner_id = auth.uid()) WITH CHECK (learner_id = auth.uid());
CREATE POLICY "Parents can view children level transitions" ON public.learner_level_transitions FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM parent_children WHERE parent_id = auth.uid() AND child_id = learner_level_transitions.learner_id));

-- Update trigger for learner_curriculum_progress
CREATE TRIGGER update_learner_curriculum_progress_updated_at
  BEFORE UPDATE ON public.learner_curriculum_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_learner_hidden_mastery_updated_at
  BEFORE UPDATE ON public.learner_hidden_mastery
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable pg_net extension for HTTP calls from triggers
CREATE EXTENSION IF NOT EXISTS pg_net SCHEMA extensions;

-- Create function to send email via edge function when notification is inserted
CREATE OR REPLACE FUNCTION public.send_notification_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  parent_email TEXT;
  child_name TEXT;
  supabase_url TEXT;
  anon_key TEXT;
BEGIN
  -- Get parent email
  SELECT email INTO parent_email
  FROM public.profiles WHERE id = NEW.parent_id;

  -- Get child name
  SELECT COALESCE(full_name, email) INTO child_name
  FROM public.profiles WHERE id = NEW.child_id;

  -- Get Supabase URL and anon key from vault or hardcode project URL
  supabase_url := 'https://zwtrdbjoxomacuughodn.supabase.co';
  anon_key := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3dHJkYmpveG9tYWN1dWdob2RuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2NTkxMzksImV4cCI6MjA4MjIzNTEzOX0.HeoDWmiblYRAwNIpaHdc6nM0QP4MuUlmFrkwdKDqdM8';

  -- Call edge function via pg_net
  PERFORM extensions.http_post(
    url := supabase_url || '/functions/v1/send-parent-email',
    body := jsonb_build_object(
      'to', parent_email,
      'subject', NEW.title,
      'childName', child_name,
      'type', NEW.type,
      'metadata', NEW.metadata
    )::text,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || anon_key
    )::jsonb
  );

  RETURN NEW;
END;
$$;

-- Create trigger on notifications table
DROP TRIGGER IF EXISTS on_notification_send_email ON public.notifications;
CREATE TRIGGER on_notification_send_email
  AFTER INSERT ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.send_notification_email();

-- ============================================
-- GAMIFICATION TABLES
-- ============================================

-- Student XP tracking
CREATE TABLE public.student_xp (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  total_xp INTEGER NOT NULL DEFAULT 0,
  xp_level INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(student_id)
);

ALTER TABLE public.student_xp ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own XP" ON public.student_xp
  FOR SELECT TO authenticated USING (student_id = auth.uid());

CREATE POLICY "Students can insert own XP" ON public.student_xp
  FOR INSERT TO authenticated WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can update own XP" ON public.student_xp
  FOR UPDATE TO authenticated USING (student_id = auth.uid());

CREATE POLICY "Parents can view children XP" ON public.student_xp
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM parent_children WHERE parent_id = auth.uid() AND child_id = student_xp.student_id
  ));

-- Badges catalog
CREATE TABLE public.badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '🏆',
  xp_reward INTEGER NOT NULL DEFAULT 0,
  requirement_type TEXT NOT NULL DEFAULT 'xp',
  requirement_value INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view badges" ON public.badges
  FOR SELECT TO authenticated USING (true);

-- Student earned badges
CREATE TABLE public.student_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(student_id, badge_id)
);

ALTER TABLE public.student_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own badges" ON public.student_badges
  FOR SELECT TO authenticated USING (student_id = auth.uid());

CREATE POLICY "Students can earn badges" ON public.student_badges
  FOR INSERT TO authenticated WITH CHECK (student_id = auth.uid());

CREATE POLICY "Parents can view children badges" ON public.student_badges
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM parent_children WHERE parent_id = auth.uid() AND child_id = student_badges.student_id
  ));

-- Daily challenges
CREATE TABLE public.daily_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  challenge_type TEXT NOT NULL DEFAULT 'lesson',
  xp_reward INTEGER NOT NULL DEFAULT 10,
  target_count INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.daily_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active challenges" ON public.daily_challenges
  FOR SELECT TO authenticated USING (is_active = true);

-- Student challenge progress
CREATE TABLE public.student_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES public.daily_challenges(id) ON DELETE CASCADE,
  challenge_date DATE NOT NULL DEFAULT CURRENT_DATE,
  current_count INTEGER NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT false,
  xp_claimed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(student_id, challenge_id, challenge_date)
);

ALTER TABLE public.student_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own challenges" ON public.student_challenges
  FOR SELECT TO authenticated USING (student_id = auth.uid());

CREATE POLICY "Students can insert own challenges" ON public.student_challenges
  FOR INSERT TO authenticated WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can update own challenges" ON public.student_challenges
  FOR UPDATE TO authenticated USING (student_id = auth.uid());

-- XP history for tracking gains
CREATE TABLE public.xp_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  xp_amount INTEGER NOT NULL,
  source TEXT NOT NULL,
  source_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.xp_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own XP history" ON public.xp_history
  FOR SELECT TO authenticated USING (student_id = auth.uid());

CREATE POLICY "Students can insert own XP history" ON public.xp_history
  FOR INSERT TO authenticated WITH CHECK (student_id = auth.uid());

-- Seed default badges
INSERT INTO public.badges (name, description, icon, xp_reward, requirement_type, requirement_value) VALUES
('First Steps', 'Complete your first lesson', '👶', 10, 'lessons_completed', 1),
('Getting Started', 'Complete 5 lessons', '🌱', 25, 'lessons_completed', 5),
('On a Roll', 'Complete 10 lessons', '🔥', 50, 'lessons_completed', 10),
('Dedicated Learner', 'Complete 25 lessons', '📚', 100, 'lessons_completed', 25),
('Half Way There', 'Complete 50 lessons', '🎯', 200, 'lessons_completed', 50),
('Century Mark', 'Complete 100 lessons', '💯', 500, 'lessons_completed', 100),
('Master Reader', 'Complete all 180 lessons', '🏆', 1000, 'lessons_completed', 180),
('3-Day Streak', 'Practice 3 days in a row', '⚡', 15, 'streak', 3),
('Week Warrior', 'Practice 7 days in a row', '🗓️', 50, 'streak', 7),
('Two Week Champion', 'Practice 14 days in a row', '💪', 100, 'streak', 14),
('Monthly Master', 'Practice 30 days in a row', '👑', 250, 'streak', 30),
('Word Collector', 'Save 10 words to your dictionary', '📖', 20, 'saved_words', 10),
('Vocabulary Pro', 'Save 50 words to your dictionary', '🧠', 75, 'saved_words', 50),
('High Scorer', 'Get 90%+ on a lesson', '⭐', 30, 'high_score', 90),
('Perfect Score', 'Get 100% on a lesson', '🌟', 100, 'perfect_score', 100),
('XP Rookie', 'Earn 100 XP total', '🎮', 0, 'total_xp', 100),
('XP Pro', 'Earn 500 XP total', '🚀', 0, 'total_xp', 500),
('XP Legend', 'Earn 2000 XP total', '🏅', 0, 'total_xp', 2000);

-- Seed daily challenges
INSERT INTO public.daily_challenges (title, description, challenge_type, xp_reward, target_count) VALUES
('Daily Lesson', 'Complete 1 lesson today', 'lesson', 15, 1),
('Double Up', 'Complete 2 lessons today', 'lesson', 30, 2),
('Word Hunter', 'Look up 3 words in the dictionary', 'dictionary', 10, 3),
('Practice Makes Perfect', 'Record yourself 2 times in the studio', 'studio', 15, 2),
('Chat Champion', 'Send 5 messages in AI Chat', 'chat', 10, 5),
('Role Player', 'Complete 1 roleplay scenario', 'roleplay', 20, 1);

-- Function to award XP and auto-create XP record
CREATE OR REPLACE FUNCTION public.award_xp(
  _student_id UUID,
  _xp_amount INTEGER,
  _source TEXT,
  _source_id TEXT DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_total INTEGER;
  new_level INTEGER;
BEGIN
  -- Ensure student_xp record exists
  INSERT INTO public.student_xp (student_id, total_xp, xp_level)
  VALUES (_student_id, 0, 1)
  ON CONFLICT (student_id) DO NOTHING;

  -- Update XP
  UPDATE public.student_xp
  SET total_xp = total_xp + _xp_amount,
      xp_level = GREATEST(1, FLOOR(SQRT((total_xp + _xp_amount) / 50.0)) + 1)::INTEGER,
      updated_at = now()
  WHERE student_id = _student_id
  RETURNING total_xp INTO new_total;

  -- Log XP gain
  INSERT INTO public.xp_history (student_id, xp_amount, source, source_id)
  VALUES (_student_id, _xp_amount, _source, _source_id);

  RETURN new_total;
END;
$$;

-- Auto-award XP on lesson completion
CREATE OR REPLACE FUNCTION public.award_xp_on_lesson_completion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Award 20 XP per lesson completion
  PERFORM public.award_xp(NEW.student_id, 20, 'lesson_completion', NEW.lesson_id::TEXT);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_lesson_completion_award_xp ON public.lesson_completions;
CREATE TRIGGER on_lesson_completion_award_xp
  AFTER INSERT ON public.lesson_completions
  FOR EACH ROW
  EXECUTE FUNCTION public.award_xp_on_lesson_completion();

-- Create trigger for updated_at on student_xp
CREATE TRIGGER update_student_xp_updated_at
  BEFORE UPDATE ON public.student_xp
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

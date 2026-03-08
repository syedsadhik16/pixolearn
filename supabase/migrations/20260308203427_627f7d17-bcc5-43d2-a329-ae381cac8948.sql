
-- Daily login rewards table
CREATE TABLE public.daily_login_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  login_date date NOT NULL DEFAULT CURRENT_DATE,
  consecutive_days integer NOT NULL DEFAULT 1,
  xp_rewarded integer NOT NULL DEFAULT 5,
  claimed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(student_id, login_date)
);

ALTER TABLE public.daily_login_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own login rewards"
ON public.daily_login_rewards FOR SELECT
USING (student_id = auth.uid());

CREATE POLICY "Students can insert own login rewards"
ON public.daily_login_rewards FOR INSERT
WITH CHECK (student_id = auth.uid());

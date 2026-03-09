
-- Learning sessions table for time tracking
CREATE TABLE public.learning_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER DEFAULT 0,
  session_type TEXT NOT NULL DEFAULT 'lesson',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.learning_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can manage own sessions" ON public.learning_sessions
  FOR ALL TO authenticated
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Parents can view children sessions" ON public.learning_sessions
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM parent_children
    WHERE parent_children.parent_id = auth.uid()
    AND parent_children.child_id = learning_sessions.student_id
  ));

-- Parent goals table
CREATE TABLE public.parent_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  daily_minutes_goal INTEGER DEFAULT 30,
  daily_lessons_goal INTEGER DEFAULT 1,
  daily_practice_goal INTEGER DEFAULT 3,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(parent_id, child_id)
);

ALTER TABLE public.parent_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents can manage own goals" ON public.parent_goals
  FOR ALL TO authenticated
  USING (parent_id = auth.uid())
  WITH CHECK (parent_id = auth.uid());

-- Enable realtime for learning_sessions
ALTER PUBLICATION supabase_realtime ADD TABLE public.learning_sessions;

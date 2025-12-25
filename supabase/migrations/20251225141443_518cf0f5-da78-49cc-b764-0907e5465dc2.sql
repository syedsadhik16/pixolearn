-- Create user role enum
CREATE TYPE public.user_role AS ENUM ('student', 'parent', 'admin');

-- Create subscription type enum
CREATE TYPE public.subscription_type AS ENUM ('free', 'premium');

-- Create level enum
CREATE TYPE public.lesson_level AS ENUM ('beginner', 'intermediate');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role user_role NOT NULL DEFAULT 'student',
  subscription_type subscription_type NOT NULL DEFAULT 'free',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create parent_children relationship table
CREATE TABLE public.parent_children (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(parent_id, child_id)
);

-- Create lessons table
CREATE TABLE public.lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level lesson_level NOT NULL DEFAULT 'beginner',
  day_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  vocabulary JSONB NOT NULL DEFAULT '[]'::jsonb,
  sentences JSONB NOT NULL DEFAULT '[]'::jsonb,
  read_aloud_text TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(level, day_number)
);

-- Create student progress table
CREATE TABLE public.student_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  current_level lesson_level NOT NULL DEFAULT 'beginner',
  current_day INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(student_id)
);

-- Create lesson completions table
CREATE TABLE public.lesson_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  pronunciation_score INTEGER CHECK (pronunciation_score >= 0 AND pronunciation_score <= 100),
  fluency_score INTEGER CHECK (fluency_score >= 0 AND fluency_score <= 100),
  clarity_score INTEGER CHECK (clarity_score >= 0 AND clarity_score <= 100),
  confidence_score INTEGER CHECK (confidence_score >= 0 AND confidence_score <= 100),
  practice_count INTEGER NOT NULL DEFAULT 1,
  UNIQUE(student_id, lesson_id)
);

-- Create attendance table
CREATE TABLE public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_present BOOLEAN NOT NULL DEFAULT true,
  lesson_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(student_id, date)
);

-- Create practice attempts table
CREATE TABLE public.practice_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  attempt_type TEXT NOT NULL, -- 'vocabulary', 'sentence', 'read_aloud'
  content TEXT NOT NULL,
  pronunciation_score INTEGER CHECK (pronunciation_score >= 0 AND pronunciation_score <= 100),
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_children ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_attempts ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Parents can view children profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.parent_children 
      WHERE parent_id = auth.uid() AND child_id = profiles.id
    )
  );

-- Parent children policies
CREATE POLICY "Parents can view own relationships" ON public.parent_children
  FOR SELECT USING (parent_id = auth.uid());

CREATE POLICY "Parents can create relationships" ON public.parent_children
  FOR INSERT WITH CHECK (parent_id = auth.uid());

CREATE POLICY "Parents can delete relationships" ON public.parent_children
  FOR DELETE USING (parent_id = auth.uid());

-- Lessons policies (public read for active lessons)
CREATE POLICY "Anyone can view active lessons" ON public.lessons
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage lessons" ON public.lessons
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Student progress policies
CREATE POLICY "Students can view own progress" ON public.student_progress
  FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Students can update own progress" ON public.student_progress
  FOR UPDATE USING (student_id = auth.uid());

CREATE POLICY "Students can insert own progress" ON public.student_progress
  FOR INSERT WITH CHECK (student_id = auth.uid());

CREATE POLICY "Parents can view children progress" ON public.student_progress
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.parent_children 
      WHERE parent_id = auth.uid() AND child_id = student_progress.student_id
    )
  );

-- Lesson completions policies
CREATE POLICY "Students can manage own completions" ON public.lesson_completions
  FOR ALL USING (student_id = auth.uid());

CREATE POLICY "Parents can view children completions" ON public.lesson_completions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.parent_children 
      WHERE parent_id = auth.uid() AND child_id = lesson_completions.student_id
    )
  );

-- Attendance policies
CREATE POLICY "Students can manage own attendance" ON public.attendance
  FOR ALL USING (student_id = auth.uid());

CREATE POLICY "Parents can view children attendance" ON public.attendance
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.parent_children 
      WHERE parent_id = auth.uid() AND child_id = attendance.student_id
    )
  );

-- Practice attempts policies
CREATE POLICY "Students can manage own attempts" ON public.practice_attempts
  FOR ALL USING (student_id = auth.uid());

CREATE POLICY "Parents can view children attempts" ON public.practice_attempts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.parent_children 
      WHERE parent_id = auth.uid() AND child_id = practice_attempts.student_id
    )
  );

-- Function to handle profile creation on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    COALESCE((NEW.raw_user_meta_data ->> 'role')::user_role, 'student')
  );
  
  -- If student, create initial progress record
  IF COALESCE((NEW.raw_user_meta_data ->> 'role')::user_role, 'student') = 'student' THEN
    INSERT INTO public.student_progress (student_id, current_level, current_day)
    VALUES (NEW.id, 'beginner', 1);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lessons_updated_at
  BEFORE UPDATE ON public.lessons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_student_progress_updated_at
  BEFORE UPDATE ON public.student_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
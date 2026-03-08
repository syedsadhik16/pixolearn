
-- Create notification preferences table
CREATE TABLE public.notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  lesson_completed boolean NOT NULL DEFAULT true,
  streak_milestone boolean NOT NULL DEFAULT true,
  level_up boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(parent_id)
);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents can view own preferences"
  ON public.notification_preferences FOR SELECT
  USING (parent_id = auth.uid());

CREATE POLICY "Parents can insert own preferences"
  ON public.notification_preferences FOR INSERT
  WITH CHECK (parent_id = auth.uid());

CREATE POLICY "Parents can update own preferences"
  ON public.notification_preferences FOR UPDATE
  USING (parent_id = auth.uid());

-- Auto-create preferences for new parent signups via trigger
CREATE OR REPLACE FUNCTION public.create_parent_notification_preferences()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.role = 'parent' THEN
    INSERT INTO public.notification_preferences (parent_id)
    VALUES (NEW.id)
    ON CONFLICT (parent_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_parent_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.create_parent_notification_preferences();

-- Update the lesson completion notification trigger to respect preferences
CREATE OR REPLACE FUNCTION public.notify_parents_on_lesson_completion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  parent_record RECORD;
  child_name TEXT;
  lesson_title TEXT;
  pref_enabled BOOLEAN;
BEGIN
  SELECT COALESCE(full_name, email) INTO child_name
  FROM public.profiles WHERE id = NEW.student_id;

  SELECT title INTO lesson_title
  FROM public.lessons WHERE id = NEW.lesson_id;

  FOR parent_record IN
    SELECT parent_id FROM public.parent_children WHERE child_id = NEW.student_id
  LOOP
    -- Check if parent has lesson_completed preference enabled (default true)
    SELECT COALESCE(np.lesson_completed, true) INTO pref_enabled
    FROM public.notification_preferences np
    WHERE np.parent_id = parent_record.parent_id;

    -- If no preferences row exists, default to enabled
    IF NOT FOUND THEN
      pref_enabled := true;
    END IF;

    IF pref_enabled THEN
      INSERT INTO public.notifications (parent_id, child_id, type, title, message, metadata)
      VALUES (
        parent_record.parent_id,
        NEW.student_id,
        'lesson_completed',
        'Lesson Completed! 🎉',
        child_name || ' completed "' || COALESCE(lesson_title, 'a lesson') || '"',
        jsonb_build_object(
          'lesson_id', NEW.lesson_id,
          'pronunciation_score', NEW.pronunciation_score,
          'fluency_score', NEW.fluency_score,
          'clarity_score', NEW.clarity_score,
          'confidence_score', NEW.confidence_score
        )
      );
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

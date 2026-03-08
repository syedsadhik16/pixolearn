
-- Create notifications table
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  child_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'lesson_completed',
  title text NOT NULL,
  message text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Parents can view their own notifications
CREATE POLICY "Parents can view own notifications"
  ON public.notifications FOR SELECT
  USING (parent_id = auth.uid());

-- Parents can update own notifications (mark as read)
CREATE POLICY "Parents can update own notifications"
  ON public.notifications FOR UPDATE
  USING (parent_id = auth.uid());

-- System can insert notifications (via trigger, security definer)
-- No direct insert policy needed since trigger uses SECURITY DEFINER

-- Create function to notify parents on lesson completion
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
BEGIN
  -- Get child's name
  SELECT COALESCE(full_name, email) INTO child_name
  FROM public.profiles WHERE id = NEW.student_id;

  -- Get lesson title
  SELECT title INTO lesson_title
  FROM public.lessons WHERE id = NEW.lesson_id;

  -- Insert notification for each linked parent
  FOR parent_record IN
    SELECT parent_id FROM public.parent_children WHERE child_id = NEW.student_id
  LOOP
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
  END LOOP;

  RETURN NEW;
END;
$$;

-- Create trigger on lesson_completions
CREATE TRIGGER on_lesson_completion_notify_parents
  AFTER INSERT ON public.lesson_completions
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_parents_on_lesson_completion();

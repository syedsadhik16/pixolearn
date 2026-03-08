
CREATE OR REPLACE FUNCTION public.check_streak_milestone()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  streak_count INTEGER := 0;
  check_date DATE;
  parent_record RECORD;
  child_name TEXT;
  pref_enabled BOOLEAN;
  milestone INTEGER;
  milestones INTEGER[] := ARRAY[3, 7, 14, 30];
BEGIN
  -- Only check when student is present
  IF NOT NEW.is_present THEN
    RETURN NEW;
  END IF;

  -- Count consecutive days backwards from the new attendance date
  check_date := NEW.date;
  LOOP
    IF EXISTS (
      SELECT 1 FROM public.attendance
      WHERE student_id = NEW.student_id
        AND date = check_date
        AND is_present = true
    ) THEN
      streak_count := streak_count + 1;
      check_date := check_date - 1;
    ELSE
      EXIT;
    END IF;
  END LOOP;

  -- Check if streak matches any milestone
  FOREACH milestone IN ARRAY milestones
  LOOP
    IF streak_count = milestone THEN
      -- Get child name
      SELECT COALESCE(full_name, email) INTO child_name
      FROM public.profiles WHERE id = NEW.student_id;

      -- Notify each parent
      FOR parent_record IN
        SELECT parent_id FROM public.parent_children WHERE child_id = NEW.student_id
      LOOP
        -- Check streak_milestone preference
        SELECT COALESCE(np.streak_milestone, true) INTO pref_enabled
        FROM public.notification_preferences np
        WHERE np.parent_id = parent_record.parent_id;

        IF NOT FOUND THEN
          pref_enabled := true;
        END IF;

        IF pref_enabled THEN
          INSERT INTO public.notifications (parent_id, child_id, type, title, message, metadata)
          VALUES (
            parent_record.parent_id,
            NEW.student_id,
            'streak_milestone',
            'Streak Milestone! 🔥',
            child_name || ' has reached a ' || streak_count || '-day streak!',
            jsonb_build_object('streak_count', streak_count)
          );
        END IF;
      END LOOP;

      EXIT; -- Only one milestone per attendance
    END IF;
  END LOOP;

  RETURN NEW;
END;
$function$;

-- Create trigger on attendance table
DROP TRIGGER IF EXISTS on_attendance_check_streak ON public.attendance;
CREATE TRIGGER on_attendance_check_streak
  AFTER INSERT ON public.attendance
  FOR EACH ROW
  EXECUTE FUNCTION public.check_streak_milestone();

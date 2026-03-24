CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    CASE
      WHEN COALESCE((NEW.raw_user_meta_data ->> 'role'), '') IN ('student', 'parent') 
      THEN (NEW.raw_user_meta_data ->> 'role')::user_role
      ELSE 'student'::user_role
    END
  );
  
  IF COALESCE((NEW.raw_user_meta_data ->> 'role'), 'student') = 'student' 
     OR COALESCE((NEW.raw_user_meta_data ->> 'role'), '') NOT IN ('student', 'parent') THEN
    INSERT INTO public.student_progress (student_id, current_level, current_day)
    VALUES (NEW.id, 'beginner', 1);
  END IF;
  
  RETURN NEW;
END;
$$;
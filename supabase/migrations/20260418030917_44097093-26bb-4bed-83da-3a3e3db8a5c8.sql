CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  resolved_role public.user_role;
BEGIN
  resolved_role := CASE
    WHEN COALESCE((NEW.raw_user_meta_data ->> 'role'), '') IN ('student', 'parent') 
      THEN (NEW.raw_user_meta_data ->> 'role')::public.user_role
    ELSE 'student'::public.user_role
  END;

  BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
      resolved_role
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user profile insert failed for %: %', NEW.id, SQLERRM;
    RETURN NEW;
  END;

  IF resolved_role = 'student'::public.user_role THEN
    BEGIN
      INSERT INTO public.student_progress (student_id, current_level, current_day)
      VALUES (NEW.id, 'beginner', 1);
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'handle_new_user student_progress insert failed for %: %', NEW.id, SQLERRM;
    END;
  END IF;

  RETURN NEW;
END;
$function$;

-- Also harden the AFTER INSERT helpers so a single failure doesn't break signups
CREATE OR REPLACE FUNCTION public.create_user_entitlement()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  BEGIN
    INSERT INTO public.user_entitlements (user_id, email)
    VALUES (NEW.id, NEW.email)
    ON CONFLICT (user_id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'create_user_entitlement failed for %: %', NEW.id, SQLERRM;
  END;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.sync_profile_role_to_user_roles()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  BEGIN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, NEW.role::public.app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'sync_profile_role_to_user_roles failed for %: %', NEW.id, SQLERRM;
  END;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_parent_notification_preferences()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.role = 'parent'::public.user_role THEN
    BEGIN
      INSERT INTO public.notification_preferences (parent_id)
      VALUES (NEW.id)
      ON CONFLICT (parent_id) DO NOTHING;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'create_parent_notification_preferences failed for %: %', NEW.id, SQLERRM;
    END;
  END IF;
  RETURN NEW;
END;
$function$;

-- Fix 1: Add trigger to prevent role changes (bulletproof approach)
CREATE OR REPLACE FUNCTION public.prevent_role_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'Role changes are not allowed';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_role_change_trigger ON public.profiles;
CREATE TRIGGER prevent_role_change_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_role_change();

-- Fix 2: Explicitly deny INSERT on student_xp for authenticated users
-- (RLS already blocks this since there's no INSERT policy, but adding explicit deny for scanner clarity)
-- The award_xp SECURITY DEFINER function bypasses RLS and handles all inserts.
-- No action needed - RLS default-deny is already in effect.

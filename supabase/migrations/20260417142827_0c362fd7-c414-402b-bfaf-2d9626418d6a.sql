
-- ============================================================
-- 1. Add child_code + invite_token to profiles
-- ============================================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS child_code TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS invite_token UUID UNIQUE DEFAULT gen_random_uuid();

-- Generator: 6-char uppercase alphanumeric, collision-safe
CREATE OR REPLACE FUNCTION public.generate_child_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_code TEXT;
  attempts INT := 0;
BEGIN
  LOOP
    new_code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 6));
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE child_code = new_code) THEN
      RETURN new_code;
    END IF;
    attempts := attempts + 1;
    IF attempts > 20 THEN
      RAISE EXCEPTION 'Could not generate unique child code';
    END IF;
  END LOOP;
END;
$$;

-- Backfill codes for existing students
UPDATE public.profiles
SET child_code = public.generate_child_code()
WHERE role = 'student' AND child_code IS NULL;

-- Backfill invite_tokens (defaults take care of new rows but ensure existing ones)
UPDATE public.profiles
SET invite_token = gen_random_uuid()
WHERE invite_token IS NULL;

-- Trigger: auto-assign child_code for new student profiles
CREATE OR REPLACE FUNCTION public.assign_child_code_on_student_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role = 'student' AND NEW.child_code IS NULL THEN
    NEW.child_code := public.generate_child_code();
  END IF;
  IF NEW.invite_token IS NULL THEN
    NEW.invite_token := gen_random_uuid();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_assign_child_code ON public.profiles;
CREATE TRIGGER trg_assign_child_code
BEFORE INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.assign_child_code_on_student_signup();

-- ============================================================
-- 2. Secure RPC for linking lookup (does NOT expose other profiles)
-- ============================================================
CREATE OR REPLACE FUNCTION public.lookup_child_for_linking(
  _method TEXT,
  _value TEXT
)
RETURNS TABLE (
  child_id UUID,
  child_email TEXT,
  child_name TEXT,
  child_role TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_id UUID := auth.uid();
BEGIN
  -- Caller must be authenticated and have parent role
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  IF NOT public.has_role(caller_id, 'parent'::app_role) THEN
    RAISE EXCEPTION 'Only parents can lookup children';
  END IF;

  IF _method = 'email' THEN
    RETURN QUERY
    SELECT p.id, p.email, p.full_name, p.role::TEXT
    FROM public.profiles p
    WHERE lower(p.email) = lower(trim(_value))
      AND p.role = 'student'
    LIMIT 1;
  ELSIF _method = 'code' THEN
    RETURN QUERY
    SELECT p.id, p.email, p.full_name, p.role::TEXT
    FROM public.profiles p
    WHERE upper(trim(p.child_code)) = upper(trim(_value))
      AND p.role = 'student'
    LIMIT 1;
  ELSIF _method = 'token' THEN
    BEGIN
      RETURN QUERY
      SELECT p.id, p.email, p.full_name, p.role::TEXT
      FROM public.profiles p
      WHERE p.invite_token = trim(_value)::uuid
        AND p.role = 'student'
      LIMIT 1;
    EXCEPTION WHEN invalid_text_representation THEN
      -- bad UUID, return nothing
      RETURN;
    END;
  ELSE
    RAISE EXCEPTION 'Invalid lookup method: %', _method;
  END IF;
END;
$$;

-- ============================================================
-- 3. Secure RPC for actual linking (one-shot)
-- ============================================================
CREATE OR REPLACE FUNCTION public.link_child_to_parent(
  _method TEXT,
  _value TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_id UUID := auth.uid();
  found_child RECORD;
  existing_link UUID;
  new_link_id UUID;
BEGIN
  IF caller_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required');
  END IF;
  IF NOT public.has_role(caller_id, 'parent'::app_role) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Only parents can link children');
  END IF;

  SELECT * INTO found_child FROM public.lookup_child_for_linking(_method, _value);
  IF found_child IS NULL OR found_child.child_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'No student found with the provided ' || _method);
  END IF;

  IF found_child.child_id = caller_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'You cannot link yourself');
  END IF;

  -- Already linked?
  SELECT id INTO existing_link
  FROM public.parent_children
  WHERE parent_id = caller_id AND child_id = found_child.child_id
  LIMIT 1;

  IF existing_link IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', true,
      'already_linked', true,
      'child_id', found_child.child_id,
      'child_email', found_child.child_email,
      'child_name', found_child.child_name
    );
  END IF;

  INSERT INTO public.parent_children (parent_id, child_id)
  VALUES (caller_id, found_child.child_id)
  RETURNING id INTO new_link_id;

  RETURN jsonb_build_object(
    'success', true,
    'already_linked', false,
    'link_id', new_link_id,
    'child_id', found_child.child_id,
    'child_email', found_child.child_email,
    'child_name', found_child.child_name
  );
END;
$$;

-- ============================================================
-- 4. Allow parents to read entitlement of linked children
-- ============================================================
DROP POLICY IF EXISTS "Parents can view children entitlements" ON public.user_entitlements;
CREATE POLICY "Parents can view children entitlements"
ON public.user_entitlements
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.parent_children pc
    WHERE pc.parent_id = auth.uid() AND pc.child_id = user_entitlements.user_id
  )
);

-- Allow admins to view all entitlements (for admin Subscriptions tab)
DROP POLICY IF EXISTS "Admins can view all entitlements" ON public.user_entitlements;
CREATE POLICY "Admins can view all entitlements"
ON public.user_entitlements
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- ============================================================
-- 5. Enable realtime for parent dashboard live updates
-- ============================================================
ALTER TABLE public.lesson_completions REPLICA IDENTITY FULL;
ALTER TABLE public.student_xp REPLICA IDENTITY FULL;
ALTER TABLE public.attendance REPLICA IDENTITY FULL;
ALTER TABLE public.learner_curriculum_progress REPLICA IDENTITY FULL;

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.lesson_completions;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.student_xp;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.learner_curriculum_progress;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

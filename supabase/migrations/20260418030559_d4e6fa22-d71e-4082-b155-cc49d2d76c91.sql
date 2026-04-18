-- Add phone column (nullable, unique when set, normalized digits-only stored)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone text;

-- Partial unique index so multiple NULLs are fine
CREATE UNIQUE INDEX IF NOT EXISTS profiles_phone_unique_idx
  ON public.profiles ((regexp_replace(phone, '\D', '', 'g')))
  WHERE phone IS NOT NULL AND length(regexp_replace(phone, '\D', '', 'g')) >= 7;

-- Replace lookup function to support phone
CREATE OR REPLACE FUNCTION public.lookup_child_for_linking(_method text, _value text)
 RETURNS TABLE(child_id uuid, child_email text, child_name text, child_role text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  caller_id UUID := auth.uid();
  normalized_phone TEXT;
BEGIN
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
  ELSIF _method = 'phone' THEN
    normalized_phone := regexp_replace(coalesce(_value, ''), '\D', '', 'g');
    IF length(normalized_phone) < 7 THEN
      RETURN;
    END IF;
    RETURN QUERY
    SELECT p.id, p.email, p.full_name, p.role::TEXT
    FROM public.profiles p
    WHERE p.phone IS NOT NULL
      AND regexp_replace(p.phone, '\D', '', 'g') = normalized_phone
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
      RETURN;
    END;
  ELSE
    RAISE EXCEPTION 'Invalid lookup method: %', _method;
  END IF;
END;
$function$;
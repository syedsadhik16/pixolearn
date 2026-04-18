
-- ========================================
-- 1. PRIVILEGE_ESCALATION: Lock down profile self-modification of sensitive fields
-- ========================================
CREATE OR REPLACE FUNCTION public.protect_profile_sensitive_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Allow service_role to update anything
  IF current_setting('request.jwt.claim.role', true) = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- Block changes to immutable / privileged fields by the user themselves
  IF NEW.id IS DISTINCT FROM OLD.id THEN
    RAISE EXCEPTION 'Cannot modify profile id';
  END IF;
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'Cannot modify role; managed by admins only';
  END IF;
  IF NEW.subscription_type IS DISTINCT FROM OLD.subscription_type THEN
    RAISE EXCEPTION 'Cannot modify subscription_type; managed by payment system';
  END IF;
  IF NEW.trial_started_at IS DISTINCT FROM OLD.trial_started_at THEN
    RAISE EXCEPTION 'Cannot modify trial_started_at';
  END IF;
  IF NEW.trial_expires_at IS DISTINCT FROM OLD.trial_expires_at THEN
    RAISE EXCEPTION 'Cannot modify trial_expires_at';
  END IF;
  IF NEW.child_code IS DISTINCT FROM OLD.child_code THEN
    RAISE EXCEPTION 'Cannot modify child_code';
  END IF;
  IF NEW.invite_token IS DISTINCT FROM OLD.invite_token THEN
    RAISE EXCEPTION 'Cannot modify invite_token';
  END IF;
  IF NEW.email IS DISTINCT FROM OLD.email THEN
    RAISE EXCEPTION 'Cannot modify email; use auth flow';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_sensitive_fields_trg ON public.profiles;
CREATE TRIGGER protect_profile_sensitive_fields_trg
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.protect_profile_sensitive_fields();

-- ========================================
-- 2. CLIENT_SIDE_AUTH: enforce role_context server-side on ai_interactions
-- ========================================
CREATE OR REPLACE FUNCTION public.enforce_ai_interaction_role_context()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  caller_role public.user_role;
BEGIN
  -- Service role inserts (from edge functions) keep their declared role_context
  IF current_setting('request.jwt.claim.role', true) = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- For authenticated client inserts, derive role_context from profiles
  SELECT role INTO caller_role FROM public.profiles WHERE id = auth.uid();
  IF caller_role IS NULL THEN
    RAISE EXCEPTION 'No profile found for caller';
  END IF;

  -- Force user_id to auth.uid()
  NEW.user_id := auth.uid();
  -- Override role_context with server-verified value
  NEW.role_context := caller_role::text;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_ai_interaction_role_context_trg ON public.ai_interactions;
CREATE TRIGGER enforce_ai_interaction_role_context_trg
BEFORE INSERT ON public.ai_interactions
FOR EACH ROW
EXECUTE FUNCTION public.enforce_ai_interaction_role_context();

-- ========================================
-- 3. EXPOSED_INTERNAL_KNOWLEDGE_BASE: restrict to admins / public
-- ========================================
DROP POLICY IF EXISTS "Authenticated users can read visible chunks" ON public.knowledge_chunks;
CREATE POLICY "Public chunks readable by authenticated users"
ON public.knowledge_chunks
FOR SELECT
TO authenticated
USING (
  visibility = 'public'
  OR public.get_user_role(auth.uid()) = 'admin'::public.user_role
);

DROP POLICY IF EXISTS "Authenticated users can read active knowledge documents" ON public.knowledge_documents;
CREATE POLICY "Public knowledge documents readable by authenticated users"
ON public.knowledge_documents
FOR SELECT
TO authenticated
USING (
  status = 'active'
  AND (
    audience IN ('public', 'student', 'parent')
    OR public.get_user_role(auth.uid()) = 'admin'::public.user_role
  )
);

-- Note: edge functions (search-knowledge, pixo-ai-chat) use service_role and bypass these policies.

-- ========================================
-- 4. MISSING_REALTIME_AUTHORIZATION: scope realtime channels per-user
-- ========================================
-- Enable RLS on realtime.messages (idempotent)
ALTER TABLE IF EXISTS realtime.messages ENABLE ROW LEVEL SECURITY;

-- Drop any prior PIXO policies (idempotent re-runs)
DROP POLICY IF EXISTS "pixo_realtime_authenticated_topic_scope" ON realtime.messages;

-- Allow authenticated users to receive realtime broadcasts ONLY when:
-- - the topic equals their own auth.uid()::text (per-user channel), OR
-- - the topic is a parent-child channel they own (pattern: parent:<parent_uid> for parents that have linked children)
CREATE POLICY "pixo_realtime_authenticated_topic_scope"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  -- Per-user channel: clients must subscribe to a channel named exactly their own user id
  (realtime.topic() = auth.uid()::text)
  OR
  -- Parent channel: parent:<parent_uid>
  (realtime.topic() = ('parent:' || auth.uid()::text))
  OR
  -- Admins can listen on the admin firehose channel
  (
    realtime.topic() = 'admin'
    AND public.get_user_role(auth.uid()) = 'admin'::public.user_role
  )
);

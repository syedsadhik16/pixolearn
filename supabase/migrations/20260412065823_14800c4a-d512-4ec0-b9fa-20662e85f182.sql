-- =============================================================
-- FIX 1: Entitlement payment bypass - trigger to protect payment fields
-- =============================================================
CREATE OR REPLACE FUNCTION public.protect_entitlement_payment_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF current_setting('request.jwt.claim.role', true) = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF NEW.is_paid IS DISTINCT FROM OLD.is_paid THEN
    RAISE EXCEPTION 'Cannot modify payment status';
  END IF;
  IF NEW.payment_status IS DISTINCT FROM OLD.payment_status THEN
    RAISE EXCEPTION 'Cannot modify payment status field';
  END IF;
  IF NEW.entitlement_status IS DISTINCT FROM OLD.entitlement_status THEN
    RAISE EXCEPTION 'Cannot modify entitlement status';
  END IF;
  IF NEW.payment_id IS DISTINCT FROM OLD.payment_id THEN
    RAISE EXCEPTION 'Cannot modify payment ID';
  END IF;
  IF NEW.order_id IS DISTINCT FROM OLD.order_id THEN
    RAISE EXCEPTION 'Cannot modify order ID';
  END IF;
  IF NEW.amount_paid IS DISTINCT FROM OLD.amount_paid THEN
    RAISE EXCEPTION 'Cannot modify amount paid';
  END IF;
  IF NEW.paid_at IS DISTINCT FROM OLD.paid_at THEN
    RAISE EXCEPTION 'Cannot modify paid timestamp';
  END IF;
  IF NEW.entitlement_start_date IS DISTINCT FROM OLD.entitlement_start_date THEN
    RAISE EXCEPTION 'Cannot modify entitlement start date';
  END IF;
  IF NEW.entitlement_expiry_date IS DISTINCT FROM OLD.entitlement_expiry_date THEN
    RAISE EXCEPTION 'Cannot modify entitlement expiry date';
  END IF;
  IF NEW.plan_duration_months IS DISTINCT FROM OLD.plan_duration_months THEN
    RAISE EXCEPTION 'Cannot modify plan duration';
  END IF;
  IF NEW.currency IS DISTINCT FROM OLD.currency THEN
    RAISE EXCEPTION 'Cannot modify currency';
  END IF;
  IF NEW.override_flag IS DISTINCT FROM OLD.override_flag THEN
    RAISE EXCEPTION 'Cannot modify override flag';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_entitlement_payment_fields ON public.user_entitlements;

CREATE TRIGGER protect_entitlement_payment_fields
  BEFORE UPDATE ON public.user_entitlements
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_entitlement_payment_fields();

-- =============================================================
-- FIX 2: Realtime data leak - remove learning_sessions from publication
-- =============================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND schemaname = 'public'
    AND tablename = 'learning_sessions'
  ) THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.learning_sessions;
  END IF;
END;
$$;

-- =============================================================
-- FIX 3: Parent-child linking - require parent role
-- =============================================================
DROP POLICY IF EXISTS "Parents can create relationships" ON public.parent_children;

CREATE POLICY "Parents can create relationships"
  ON public.parent_children
  FOR INSERT
  TO authenticated
  WITH CHECK (
    parent_id = auth.uid()
    AND public.has_role(auth.uid(), 'parent')
  );
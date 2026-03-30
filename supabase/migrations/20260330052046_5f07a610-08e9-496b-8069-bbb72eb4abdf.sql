
-- Create user_entitlements table for MVP access control
CREATE TABLE public.user_entitlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  launch_check_completed boolean NOT NULL DEFAULT false,
  recommended_level text,
  selected_level text,
  selected_plan text,
  plan_duration_months integer,
  payment_status text NOT NULL DEFAULT 'unpaid',
  payment_id text,
  order_id text,
  amount_paid integer DEFAULT 0,
  currency text DEFAULT 'INR',
  paid_at timestamp with time zone,
  is_paid boolean NOT NULL DEFAULT false,
  entitlement_status text NOT NULL DEFAULT 'inactive',
  entitlement_start_date timestamp with time zone,
  entitlement_expiry_date timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_entitlements ENABLE ROW LEVEL SECURITY;

-- Users can view own entitlement
CREATE POLICY "Users can view own entitlement"
  ON public.user_entitlements FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can insert own entitlement
CREATE POLICY "Users can insert own entitlement"
  ON public.user_entitlements FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can update own entitlement
CREATE POLICY "Users can update own entitlement"
  ON public.user_entitlements FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Admins can view all entitlements
CREATE POLICY "Admins can view all entitlements"
  ON public.user_entitlements FOR SELECT
  TO authenticated
  USING (public.get_user_role(auth.uid()) = 'admin'::user_role);

-- Auto-create entitlement row on new user signup
CREATE OR REPLACE FUNCTION public.create_user_entitlement()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.user_entitlements (user_id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_profile_created_entitlement
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.create_user_entitlement();

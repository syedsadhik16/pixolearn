
-- Fix 1: Change lessons RLS policy from public to authenticated only
-- and add subscription/entitlement check for premium content (day_number > 2)
DROP POLICY IF EXISTS "Anyone can view active lessons" ON public.lessons;

CREATE POLICY "Authenticated users can view lessons" ON public.lessons
FOR SELECT TO authenticated
USING (
  is_active = true AND (
    day_number <= 2 OR
    (SELECT subscription_type FROM public.profiles WHERE id = auth.uid()) = 'premium' OR
    EXISTS (
      SELECT 1 FROM public.user_entitlements
      WHERE user_id = auth.uid()
        AND is_paid = true
        AND entitlement_status = 'active'
        AND entitlement_expiry_date > now()
    )
  )
);

-- Fix 2: Admins can still view all lessons (already exists but re-confirm)
-- The existing "Admins can manage lessons" policy covers this.

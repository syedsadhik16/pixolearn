import { supabase } from '@/integrations/supabase/client';

export interface UserEntitlement {
  id: string;
  user_id: string;
  email: string | null;
  launch_check_completed: boolean;
  recommended_level: string | null;
  selected_level: string | null;
  selected_plan: string | null;
  plan_duration_months: number | null;
  payment_status: string;
  payment_id: string | null;
  order_id: string | null;
  amount_paid: number;
  currency: string;
  paid_at: string | null;
  is_paid: boolean;
  entitlement_status: string;
  entitlement_start_date: string | null;
  entitlement_expiry_date: string | null;
  created_at: string;
  updated_at: string;
}

export type UserAccessState =
  | 'unauthenticated'
  | 'launch_check_pending'
  | 'level_selection_pending'
  | 'unpaid'
  | 'paid_active'
  | 'paid_expired';

export function isEntitlementActive(entitlement: UserEntitlement | null): boolean {
  if (!entitlement) return false;
  if (!entitlement.is_paid) return false;
  if (entitlement.entitlement_status !== 'active') return false;
  if (!entitlement.entitlement_expiry_date) return false;
  return new Date(entitlement.entitlement_expiry_date) > new Date();
}

export function getUserAccessState(
  isAuthenticated: boolean,
  entitlement: UserEntitlement | null,
  profileSubscription?: string
): UserAccessState {
  if (!isAuthenticated) return 'unauthenticated';

  // Check if premium via trial or direct subscription (backward compat)
  if (profileSubscription === 'premium') {
    return 'paid_active';
  }

  if (!entitlement) return 'launch_check_pending';

  if (!entitlement.launch_check_completed) return 'launch_check_pending';
  if (!entitlement.selected_level) return 'level_selection_pending';

  if (isEntitlementActive(entitlement)) return 'paid_active';

  if (entitlement.is_paid && entitlement.entitlement_expiry_date) {
    if (new Date(entitlement.entitlement_expiry_date) <= new Date()) {
      return 'paid_expired';
    }
  }

  return 'unpaid';
}

export function getRedirectForState(state: UserAccessState): string {
  switch (state) {
    case 'unauthenticated': return '/auth';
    case 'launch_check_pending': return '/launch-check';
    case 'level_selection_pending': return '/level-selection';
    case 'unpaid': return '/pricing';
    case 'paid_expired': return '/pricing';
    case 'paid_active': return '/student';
  }
}

export async function syncEntitlementFromDatabase(userId: string): Promise<UserEntitlement | null> {
  const { data, error } = await supabase
    .from('user_entitlements')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data) return null;
  return data as unknown as UserEntitlement;
}

export async function handlePaymentSuccess(params: {
  userId: string;
  email: string;
  selectedPlan: string;
  selectedLevel: string;
  planDurationMonths: number;
  paymentId: string;
  orderId: string;
  amountPaid: number;
  currency: string;
}): Promise<void> {
  const now = new Date();
  const expiryDate = new Date(now);
  expiryDate.setMonth(expiryDate.getMonth() + params.planDurationMonths);

  await supabase
    .from('user_entitlements')
    .upsert({
      user_id: params.userId,
      email: params.email,
      selected_plan: params.selectedPlan,
      selected_level: params.selectedLevel,
      plan_duration_months: params.planDurationMonths,
      payment_status: 'success',
      payment_id: params.paymentId,
      order_id: params.orderId,
      amount_paid: params.amountPaid,
      currency: params.currency,
      paid_at: now.toISOString(),
      is_paid: true,
      entitlement_status: 'active',
      entitlement_start_date: now.toISOString(),
      entitlement_expiry_date: expiryDate.toISOString(),
      updated_at: now.toISOString(),
    }, { onConflict: 'user_id' });

  // Also set sessionStorage for immediate frontend unlock
  sessionStorage.setItem('isPaid', 'true');
  sessionStorage.setItem('selectedLevel', params.selectedLevel);
  sessionStorage.setItem('selectedPlan', params.selectedPlan);
  sessionStorage.setItem('expiryDate', expiryDate.toISOString());
}

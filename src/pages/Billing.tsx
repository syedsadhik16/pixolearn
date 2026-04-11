import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { BottomNav } from '@/components/layout/BottomNav';
import { HamburgerMenu } from '@/components/layout/HamburgerMenu';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/useTranslation';
import { buildInvoiceData, downloadInvoicePDF } from '@/lib/invoice';
import {
  Crown,
  Calendar,
  CreditCard,
  ArrowRight,
  Shield,
  Clock,
  FileText,
  AlertTriangle,
  Download,
} from 'lucide-react';

interface PaymentRecord {
  id: string;
  plan_id: string;
  amount: number;
  currency: string;
  status: string;
  razorpay_payment_id: string;
  created_at: string;
}

interface EntitlementData {
  selected_plan: string | null;
  selected_level: string | null;
  entitlement_start_date: string | null;
  entitlement_expiry_date: string | null;
  entitlement_status: string;
  is_paid: boolean;
  amount_paid: number | null;
  plan_duration_months: number | null;
}

export default function Billing() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [entitlement, setEntitlement] = useState<EntitlementData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase
        .from('payment_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('user_entitlements')
        .select('selected_plan, selected_level, entitlement_start_date, entitlement_expiry_date, entitlement_status, is_paid, amount_paid, plan_duration_months')
        .eq('user_id', user.id)
        .maybeSingle(),
    ]).then(([paymentsRes, entitlementRes]) => {
      if (paymentsRes.data) setPayments(paymentsRes.data as unknown as PaymentRecord[]);
      if (entitlementRes.data) setEntitlement(entitlementRes.data as unknown as EntitlementData);
      setLoading(false);
    });
  }, [user]);

  const isActive = entitlement?.is_paid && entitlement?.entitlement_status === 'active' &&
    entitlement?.entitlement_expiry_date && new Date(entitlement.entitlement_expiry_date) > new Date();

  const isExpired = entitlement?.is_paid && entitlement?.entitlement_expiry_date &&
    new Date(entitlement.entitlement_expiry_date) <= new Date();

  const daysRemaining = entitlement?.entitlement_expiry_date
    ? Math.max(0, Math.ceil((new Date(entitlement.entitlement_expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  const formatDate = (dateStr: string | null) =>
    dateStr ? new Date(dateStr).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-pulse text-center">
            <CreditCard className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">{t('loadingBilling')}</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 pb-24 max-w-2xl">
        <h1 className="text-2xl font-display font-bold mb-6">{t('billingSubscriptions')}</h1>

        {/* Current Plan */}
        <div className={`pixo-card mb-6 ${isActive ? 'bg-gradient-to-r from-pixo-green/5 to-pixo-blue/5 border-pixo-green/20' : isExpired ? 'bg-gradient-to-r from-destructive/5 to-pixo-orange/5 border-destructive/20' : ''}`}>
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isActive ? 'bg-pixo-green/10' : 'bg-muted'}`}>
              {isActive ? <Crown className="h-6 w-6 text-pixo-green" /> : <AlertTriangle className="h-6 w-6 text-muted-foreground" />}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="font-display font-bold text-lg">
                  {entitlement?.selected_plan || t('noPlan')}
                </h2>
                {isActive && (
                  <span className="text-xs bg-pixo-green/10 text-pixo-green font-bold px-2 py-0.5 rounded-full">
                    {t('active')}
                  </span>
                )}
                {isExpired && (
                  <span className="text-xs bg-destructive/10 text-destructive font-bold px-2 py-0.5 rounded-full">
                    {t('expired')}
                  </span>
                )}
              </div>
              {entitlement?.selected_level && (
                <p className="text-sm text-muted-foreground mb-2">{entitlement.selected_level}</p>
              )}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{t('startDate')}: {formatDate(entitlement?.entitlement_start_date || null)}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{t('expiryDate')}: {formatDate(entitlement?.entitlement_expiry_date || null)}</span>
                </div>
              </div>
              {isActive && (
                <div className="mt-3 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-pixo-green" />
                  <span className="text-sm font-semibold text-pixo-green">
                    {daysRemaining} {t('daysRemaining')}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Upgrade / Renew */}
        {(!isActive || isExpired) && (
          <div className="pixo-card mb-6 text-center">
            <h3 className="font-display font-bold mb-2">{isExpired ? t('renewSubscription') : t('upgradePlan')}</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {isExpired ? t('subscriptionExpiredMsg') : t('choosePlanToStart')}
            </p>
            <Button variant="gradient" size="lg" onClick={() => navigate('/pricing')}>
              {isExpired ? t('renewNow') : t('viewPlans')}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}

        {/* Available Upgrades */}
        {isActive && (
          <div className="pixo-card mb-6">
            <h3 className="font-display font-bold mb-3">{t('availableUpgrades')}</h3>
            <div className="space-y-3">
              {[
                { name: 'PIXO Explorer (12 Months)', price: '₹9,999' },
                { name: 'PIXO Master (18 Months)', price: '₹14,999' },
              ].map((plan) => (
                <div key={plan.name} className="flex items-center justify-between p-3 bg-muted rounded-xl">
                  <div>
                    <p className="font-semibold text-sm">{plan.name}</p>
                    <p className="text-xs text-muted-foreground">{plan.price}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => navigate('/pricing')}>
                    {t('upgrade')}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Billing History */}
        <div className="pixo-card">
          <h3 className="font-display font-bold mb-4">{t('billingHistory')}</h3>
          {payments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">{t('noPaymentsYet')}</p>
          ) : (
            <div className="space-y-3">
              {payments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-semibold text-sm">{payment.plan_id}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(payment.created_at)} • {payment.razorpay_payment_id?.slice(0, 12)}...
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm">₹{(payment.amount / 100).toLocaleString()}</p>
                    <span className={`text-xs font-medium ${payment.status === 'success' ? 'text-pixo-green' : 'text-destructive'}`}>
                      {payment.status === 'success' ? '✓ Paid' : payment.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <HamburgerMenu />
      <BottomNav />
    </Layout>
  );
}

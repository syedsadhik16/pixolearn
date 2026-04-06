import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { handlePaymentSuccess } from '@/lib/entitlement';
import { useToast } from '@/hooks/use-toast';
import pixoLogo from '@/assets/pixo-logo.png';
import { Check, ArrowRight, Star, Sparkles, ArrowLeft, Loader2, Shield, Clock } from 'lucide-react';
import { ComparisonTable } from '@/components/pricing/ComparisonTable';
import { PricingFAQ } from '@/components/pricing/PricingFAQ';
import { Testimonials } from '@/components/pricing/Testimonials';
import { WhyParentsChoose } from '@/components/pricing/WhyParentsChoose';
import { ComingSoonTracks } from '@/components/pricing/ComingSoonTracks';
import { ScrollReveal } from '@/components/shared/ScrollReveal';
import { WhatsAppButton } from '@/components/shared/WhatsAppButton';
import { StickyPricingBar } from '@/components/pricing/StickyPricingBar';

declare global {
  interface Window {
    Razorpay: any;
  }
}

const plans = [
  {
    id: '6-months',
    name: '6 Months',
    price: '₹5,999',
    priceAmount: 5999,
    duration: '6 Months',
    tagline: 'Access any 1 level',
    originalPrice: null,
    levelCount: 1,
    levelOptions: ['Level 1', 'Level 2', 'Level 3'],
    features: [
      '6 months of full access',
      'Any 1 level of your choice',
      '180 lessons in chosen level',
      'Advanced AI speech scoring',
      'Unlimited AI practice',
      'Parent Mastery Hub',
      'Role play studio',
    ],
    supportingLine: 'Best for parents who want to begin with one focused level',
    cta: 'Make Payment',
    highlighted: false,
  },
  {
    id: '12-months',
    name: '12 Months',
    price: '₹9,999',
    priceAmount: 9999,
    duration: '12 Months',
    tagline: 'Access any 2 levels',
    originalPrice: null,
    levelCount: 2,
    levelOptions: ['Level 1 + Level 2', 'Level 2 + Level 3', 'Level 1 + Level 3'],
    features: [
      '12 months of full access',
      'Any 2 levels of your choice',
      '360 lessons across 2 levels',
      'Advanced AI speech scoring',
      'Unlimited AI practice',
      'Parent Mastery Hub',
      'Weekly progress reports',
      'Priority support',
    ],
    supportingLine: 'Best for deeper structured learning',
    cta: 'Make Payment',
    highlighted: true,
    badge: 'Popular',
  },
  {
    id: '18-months',
    name: '18 Months',
    price: '₹14,999',
    priceAmount: 14999,
    duration: '18 Months',
    tagline: 'Access all 3 levels',
    originalPrice: null,
    levelCount: 3,
    levelOptions: ['Level 1 + Level 2 + Level 3'],
    features: [
      '18 months of full access',
      'All 3 levels included',
      '540 lessons — complete curriculum',
      'Advanced AI speech scoring',
      'Unlimited AI practice',
      'Parent Mastery Hub',
      'Creative Studio access',
      'Expert PDF reports',
      'Family sharing (2 kids)',
      'Early feature access',
    ],
    supportingLine: 'Best for the complete learning journey',
    cta: 'Make Payment',
    highlighted: false,
    badge: 'Best Value',
  },
];

export default function Pricing() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [freemiumState, setFreemiumState] = useState<'none' | 'active' | 'ended' | 'loading'>('loading');
  const [freemiumTimeLeft, setFreemiumTimeLeft] = useState<string>('');

  // Check freemium status on mount and update countdown
  useEffect(() => {
    if (!profile) {
      setFreemiumState('none');
      return;
    }

    const checkFreemium = () => {
      if (profile.subscription_type === 'premium' && profile.trial_started_at) {
        const expiresAt = profile.trial_expires_at ? new Date(profile.trial_expires_at) : null;
        if (expiresAt && expiresAt > new Date()) {
          setFreemiumState('active');
          const diff = expiresAt.getTime() - Date.now();
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          setFreemiumTimeLeft(`${hours} hours ${minutes} minutes`);
        } else if (profile.trial_started_at) {
          setFreemiumState('ended');
        } else {
          setFreemiumState('none');
        }
      } else if (profile.trial_started_at) {
        // Freemium was used but subscription is no longer premium (expired)
        setFreemiumState('ended');
      } else {
        setFreemiumState('none');
      }
    };

    checkFreemium();
    const interval = setInterval(checkFreemium, 30000);
    return () => clearInterval(interval);
  }, [profile]);

  useEffect(() => {
    if (searchParams.get('proceed') === 'payment' && user) {
      const stored = sessionStorage.getItem('selectedPlan');
      if (stored) {
        try {
          const plan = JSON.parse(stored);
          initiatePayment(plan.id, plan.name, plan.priceAmount, plan.duration);
        } catch {}
      }
    }
  }, [searchParams, user]);

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.Razorpay) { resolve(true); return; }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const initiatePayment = async (planId: string, planName: string, priceAmount: number, duration: string) => {
    if (!user) return;
    setLoadingPlan(planId);
    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) throw new Error('Failed to load Razorpay. Please check your internet connection.');

      const { data, error } = await supabase.functions.invoke('create-razorpay-order', {
        body: {
          amount: priceAmount,
          currency: 'INR',
          plan_id: planId,
          user_id: user.id,
          user_email: profile?.email,
          user_name: profile?.full_name,
        },
      });
      if (error || !data?.order_id) throw new Error(data?.error || error?.message || 'Failed to create order');

      const keyId = data.key_id;
      if (!keyId) {
        throw new Error('Payment configuration error. Please contact support.');
      }

      const options = {
        key: keyId,
        amount: data.amount,
        currency: data.currency,
        name: 'PIXO Learn',
        description: `${planName} Plan - ${duration}`,
        image: pixoLogo,
        order_id: data.order_id,
        handler: async (response: any) => {
          try {
            const { data: verifyData, error: verifyError } = await supabase.functions.invoke('verify-razorpay-payment', {
              body: {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                user_id: user.id,
                plan_id: planId,
              },
            });
            if (verifyError || !verifyData?.success) throw new Error(verifyData?.error || 'Payment verification failed');

            const planDurationMap: Record<string, number> = {
              '6-months': 6,
              '12-months': 12,
              '18-months': 18,
            };
            const durationMonths = planDurationMap[planId] || 6;

            await handlePaymentSuccess({
              userId: user.id,
              email: profile?.email || user.email || '',
              selectedPlan: planName,
              selectedLevel: sessionStorage.getItem('selectedLevel') || 'beginner',
              planDurationMonths: durationMonths,
              paymentId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id,
              amountPaid: priceAmount,
              currency: 'INR',
            });

            sessionStorage.setItem('paymentId', response.razorpay_payment_id);
            sessionStorage.setItem('orderId', response.razorpay_order_id);
            sessionStorage.removeItem('selectedPlan');
            navigate('/payment-success');
          } catch (err: any) {
            console.error('Verification error:', err);
            toast({ title: 'Verification Issue', description: 'Payment received but verification pending. Please contact support.', variant: 'destructive' });
            navigate('/payment-success');
          }
        },
        prefill: { name: profile?.full_name || '', email: profile?.email || '' },
        theme: { color: '#F97316' },
        modal: { ondismiss: () => setLoadingPlan(null) },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on('payment.failed', (response: any) => {
        console.error('Payment failed:', response.error);
        toast({ title: 'Payment Failed', description: response.error?.description || 'Something went wrong. Please try again.', variant: 'destructive' });
        setLoadingPlan(null);
      });
      razorpay.open();
    } catch (err: any) {
      console.error('Payment error:', err);
      toast({ title: 'Error', description: err.message || 'Failed to initiate payment', variant: 'destructive' });
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleFreemiumClick = async () => {
    if (!user) {
      navigate('/auth?signup=true');
      return;
    }

    // If freemium is active, show remaining time and allow access
    if (freemiumState === 'active') {
      toast({
        title: 'Your Freemium access is active ✨',
        description: `Time remaining: ${freemiumTimeLeft}`,
      });
      navigate('/student');
      return;
    }

    // If freemium ended, redirect to assessment flow
    if (freemiumState === 'ended') {
      toast({
        title: 'Your Freemium access has ended',
        description: 'Upgrade to Premium to continue your learning journey with PIXO Learn.',
      });
      navigate('/launch-check');
      return;
    }

    if (profile?.subscription_type === 'premium') {
      navigate('/student');
      return;
    }
    setLoadingPlan('freemium');
    try {
      const { data, error } = await supabase.functions.invoke('activate-trial', {
        body: { user_id: user.id },
      });

      if (error || !data?.success) {
        let msg = data?.error || '';
        if (!msg && error) {
          try { msg = JSON.parse((error as any)?.context?.body || '{}')?.error || ''; } catch {}
          if (!msg) msg = error.message || 'Could not activate Freemium access';
        }
        if (msg.toLowerCase().includes('already been used')) {
          toast({
            title: 'Freemium access already used',
            description: 'Upgrade to Premium to continue your learning journey with PIXO Learn.',
          });
          navigate('/launch-check');
          return;
        }
        throw new Error(msg);
      }
      toast({ title: '🎉 Freemium Access Activated!', description: 'Enjoy 24 hours of full access to explore PIXO Learn.' });
      navigate('/student');
    } catch (err: any) {
      toast({ title: 'Activation Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleSelectPlan = (plan: typeof plans[0]) => {
    if (!user) {
      sessionStorage.setItem('selectedPlan', JSON.stringify({
        id: plan.id,
        name: plan.name,
        priceAmount: plan.priceAmount,
        duration: plan.duration,
        levelCount: plan.levelCount,
      }));
      navigate('/auth?signup=true&redirect=launch-check');
      return;
    }

    initiatePayment(plan.id, plan.name, plan.priceAmount, plan.duration);
  };

  const isPremium = profile?.subscription_type === 'premium' && freemiumState !== 'active';

  return (
    <Layout>
      {!isPremium && freemiumState !== 'active' && <StickyPricingBar onFreemiumClick={handleFreemiumClick} loading={loadingPlan === 'freemium'} />}
      <div className="min-h-screen">
        {/* Hero */}
        <section className="py-16 md:py-24 text-center relative overflow-hidden">
          <div className="absolute inset-0 gradient-bg opacity-5" />
          <div className="container mx-auto px-4 relative">
            <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8">
              <ArrowLeft className="h-4 w-4" /> Back to Home
            </Link>
            <div className="flex items-center justify-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="text-sm font-semibold text-primary">Simple, transparent pricing</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
              Invest in Your Child's <span className="gradient-text">Confidence</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-3">
              Choose a plan that works for your family. Each plan includes a Learning Launch Check to find the perfect starting level.
            </p>
            <p className="text-sm text-muted-foreground/80 max-w-xl mx-auto italic">
              Choose freely. Start wisely. PIXO recommends the best level after assessment, but the final choice is yours.
            </p>
          </div>
        </section>

        {/* Premium Active / Freemium Active / Freemium CTA */}
        <section className="pb-10">
          <div className="container mx-auto px-4 text-center">
            {isPremium ? (
              <div className="max-w-md mx-auto pixo-card p-6 animate-slide-up bg-gradient-to-r from-pixo-green/10 to-pixo-blue/10 border-pixo-green/30">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Shield className="h-5 w-5 text-pixo-green" />
                  <h2 className="text-lg font-display font-bold">Premium Access Active ✨</h2>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  You have full access to the complete learning program. Keep learning!
                </p>
                <Button
                  variant="gradient"
                  size="lg"
                  className="w-full"
                  onClick={() => navigate('/student')}
                >
                  Go to Dashboard
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            ) : freemiumState === 'active' ? (
              <div className="max-w-md mx-auto pixo-card p-6 animate-slide-up bg-gradient-to-r from-pixo-yellow/10 to-pixo-orange/10 border-pixo-yellow/30">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Clock className="h-5 w-5 text-pixo-orange" />
                  <h2 className="text-lg font-display font-bold">Your Freemium access is active ✨</h2>
                </div>
                <p className="text-sm text-muted-foreground mb-1">
                  Time remaining: <strong className="text-foreground">{freemiumTimeLeft}</strong>
                </p>
                <p className="text-xs text-muted-foreground/70 mb-4">
                  Upgrade to Premium before your Freemium access ends to keep learning!
                </p>
                <Button
                  variant="gradient"
                  size="lg"
                  className="w-full"
                  onClick={() => navigate('/student')}
                >
                  Continue Learning
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            ) : freemiumState === 'ended' ? (
              <div className="max-w-md mx-auto pixo-card p-6 animate-slide-up bg-gradient-to-r from-destructive/10 to-pixo-orange/10 border-destructive/30">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Clock className="h-5 w-5 text-destructive" />
                  <h2 className="text-lg font-display font-bold">Your Freemium access has ended</h2>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Upgrade to Premium to continue your learning journey with PIXO Learn.
                </p>
              </div>
            ) : (
              <div className="max-w-md mx-auto pixo-card p-6 animate-slide-up">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-display font-bold">Not sure yet?</h2>
                </div>
                <p className="text-sm text-muted-foreground mb-1">
                  Explore PIXO Learn free for 24 hours — no payment required.
                </p>
                <p className="text-xs text-muted-foreground/70 mb-4">
                  Experience a real lesson before choosing a plan.
                </p>
                <Button
                  variant="gradient"
                  size="lg"
                  className="w-full"
                  disabled={loadingPlan === 'freemium'}
                  onClick={handleFreemiumClick}
                >
                  {loadingPlan === 'freemium' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      Start Freemium Access
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </section>

        {/* Level Selection Guidance */}
        <section className="pb-6">
          <div className="container mx-auto px-4 text-center">
            <div className="max-w-lg mx-auto bg-primary/5 border border-primary/10 rounded-2xl p-5">
              <p className="text-sm font-semibold text-foreground mb-1">
                Choose your child's level manually or follow PIXO's recommended level based on the assessment.
              </p>
              <p className="text-xs text-muted-foreground">
                Not sure where to begin? Take the Learning Launch Check and PIXO will recommend the best starting level for your child.
              </p>
            </div>
          </div>
        </section>

        {/* Plans */}
        <section className="pb-20">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {plans.map((plan, index) => (
                <div
                  key={plan.id}
                  className={`relative pixo-card flex flex-col animate-slide-up ${
                    plan.highlighted ? 'ring-2 ring-primary shadow-lg scale-[1.02]' : ''
                  }`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {plan.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className={`text-white text-xs font-bold px-4 py-1.5 rounded-full ${
                        plan.badge === 'Best Value'
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                          : 'gradient-bg'
                      }`}>
                        {plan.badge}
                      </span>
                    </div>
                  )}

                  <div className="text-center mb-6 pt-2">
                    <h3 className="text-xl font-display font-bold mb-1">{plan.name}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{plan.tagline}</p>
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-4xl font-display font-bold">{plan.price}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">for {plan.duration}</p>
                  </div>

                  <ul className="space-y-3 mb-4 flex-1">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm">
                        <Check className="h-4 w-4 text-pixo-green flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <p className="text-xs text-muted-foreground text-center mb-4 italic">
                    {plan.supportingLine}
                  </p>

                  <Button
                    variant={plan.highlighted ? 'gradient' : 'outline'}
                    className="w-full"
                    size="lg"
                    disabled={loadingPlan === plan.id || isPremium}
                    onClick={() => handleSelectPlan(plan)}
                  >
                    {loadingPlan === plan.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : isPremium ? (
                      'Premium Access Active'
                    ) : (
                      <>
                        {plan.cta}
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Comparison Table */}
        <ScrollReveal>
          <ComparisonTable />
        </ScrollReveal>

        {/* Why Parents Choose PIXO */}
        <ScrollReveal>
          <WhyParentsChoose />
        </ScrollReveal>

        {/* Testimonials */}
        <Testimonials />

        {/* Coming Soon Tracks */}
        <ComingSoonTracks />

        {/* FAQ */}
        <ScrollReveal>
          <PricingFAQ />
        </ScrollReveal>

        {/* Trust */}
        <section className="py-12 border-t border-border">
          <div className="container mx-auto px-4 text-center">
            <div className="flex items-center justify-center gap-6 flex-wrap text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Shield className="h-4 w-4 text-pixo-green" />
                <span>Secure payment</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 text-pixo-yellow fill-pixo-yellow" />
                <span>4.9/5 rating</span>
              </div>
            </div>
          </div>
        </section>
      </div>
      <WhatsAppButton />
    </Layout>
  );
}

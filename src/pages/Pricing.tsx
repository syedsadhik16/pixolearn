import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import pixoLogo from '@/assets/pixo-logo.png';
import { Check, ArrowRight, Star, Sparkles, ArrowLeft, Loader2, Shield } from 'lucide-react';
import { ComparisonTable } from '@/components/pricing/ComparisonTable';
import { PricingFAQ } from '@/components/pricing/PricingFAQ';
import { Testimonials } from '@/components/pricing/Testimonials';
import { ScrollReveal } from '@/components/shared/ScrollReveal';
import { WhatsAppButton } from '@/components/shared/WhatsAppButton';

declare global {
  interface Window {
    Razorpay: any;
  }
}

const plans = [
  {
    id: 'beginner',
    name: 'Level 1 – Beginner',
    price: '₹5,999',
    priceAmount: 5999,
    period: '',
    tagline: '6 months program',
    originalPrice: '₹7,999',
    features: [
      'Goal: Sounds, phonics, 3-letter & 5-letter words',
      'Master letter sounds',
      'Read 2 & 3 letter words',
      'Early pronunciation confidence',
    ],
    cta: 'Choose Path',
    highlighted: false,
  },
  {
    id: 'intermediate',
    name: 'Level 2 – Intermediate',
    price: '₹9,999',
    priceAmount: 9999,
    period: '',
    tagline: '12 months program',
    originalPrice: '₹12,999',
    features: [
      'Goal: Sentences, stories, daily speaking',
      'Speak full sentences',
      'Read short stories',
      'Daily speaking practice',
    ],
    cta: 'Choose Path',
    highlighted: true,
    badge: 'Most Popular',
  },
  {
    id: 'advanced',
    name: 'Level 3 – Advanced',
    price: '₹14,999',
    priceAmount: 14999,
    period: '',
    tagline: '18 months program',
    originalPrice: '₹19,999',
    features: [
      'Goal: Fluency, storytelling, confidence',
      'Storytelling fluency',
      'Independent reading',
      'Real-life speaking confidence',
    ],
    cta: 'Choose Path',
    highlighted: false,
    badge: 'Most Value',
  },
];

export default function Pricing() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleSelectPlan = async (plan: typeof plans[0]) => {
    if (!user) {
      navigate('/auth?signup=true');
      return;
    }

    setLoadingPlan(plan.id);

    try {
      // Load Razorpay script
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        throw new Error('Failed to load Razorpay. Please check your internet connection.');
      }

      // Create order via edge function
      const { data, error } = await supabase.functions.invoke('create-razorpay-order', {
        body: {
          amount: plan.priceAmount,
          currency: 'INR',
          plan_id: plan.id,
          user_id: user.id,
          user_email: profile?.email,
          user_name: profile?.full_name,
        },
      });

      if (error || !data?.order_id) {
        throw new Error(data?.error || error?.message || 'Failed to create order');
      }

      // Open Razorpay checkout
      const options = {
        key: data.key_id,
        amount: data.amount,
        currency: data.currency,
        name: 'PIXO',
        description: `${plan.name} Plan - ${plan.period ? plan.period.replace('/', '') : 'subscription'}`,
        image: pixoLogo,
        order_id: data.order_id,
        handler: async (response: any) => {
          try {
            // Verify payment
            const { data: verifyData, error: verifyError } = await supabase.functions.invoke('verify-razorpay-payment', {
              body: {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                user_id: user.id,
                plan_id: plan.id,
              },
            });

            if (verifyError || !verifyData?.success) {
              throw new Error(verifyData?.error || 'Payment verification failed');
            }

            toast({
              title: 'Payment Successful! 🎉',
              description: `Welcome to PIXO ${plan.name}! Your premium features are now active.`,
            });

            // Navigate to dashboard
            navigate('/student');
          } catch (err: any) {
            console.error('Verification error:', err);
            toast({
              title: 'Verification Issue',
              description: 'Payment received but verification pending. Please contact support.',
              variant: 'destructive',
            });
            navigate('/student');
          }
        },
        prefill: {
          name: profile?.full_name || '',
          email: profile?.email || '',
        },
        theme: {
          color: '#F97316',
        },
        modal: {
          ondismiss: () => {
            setLoadingPlan(null);
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on('payment.failed', (response: any) => {
        console.error('Payment failed:', response.error);
        toast({
          title: 'Payment Failed',
          description: response.error?.description || 'Something went wrong. Please try again.',
          variant: 'destructive',
        });
        setLoadingPlan(null);
      });
      razorpay.open();
    } catch (err: any) {
      console.error('Payment error:', err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to initiate payment',
        variant: 'destructive',
      });
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <Layout>
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
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Choose the plan that works for your family. Cancel anytime, no questions asked.
            </p>
          </div>
        </section>

        {/* Free Trial CTA */}
        <section className="pb-10">
          <div className="container mx-auto px-4 text-center">
            <div className="max-w-md mx-auto pixo-card p-6 animate-slide-up">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-display font-bold">Not sure yet?</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Try PIXO free for 24 hours — no payment required!
              </p>
              <Button
                variant="gradient"
                size="lg"
                className="w-full"
                disabled={loadingPlan === 'trial'}
                onClick={async () => {
                  if (!user) {
                    navigate('/auth?signup=true&trial=true');
                    return;
                  }
                  setLoadingPlan('trial');
                  try {
                    const { data, error } = await supabase.functions.invoke('activate-trial', {
                      body: { user_id: user.id },
                    });
                    if (error || !data?.success) {
                      throw new Error(data?.error || error?.message || 'Failed to activate trial');
                    }
                    toast({ title: '🎉 Free Trial Activated!', description: 'Enjoy 24 hours of full premium access.' });
                    navigate('/student');
                  } catch (err: any) {
                    toast({ title: 'Trial Error', description: err.message, variant: 'destructive' });
                  } finally {
                    setLoadingPlan(null);
                  }
                }}
              >
                {loadingPlan === 'trial' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Start 1-Day Free Trial
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
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
                    plan.highlighted
                      ? 'ring-2 ring-primary shadow-lg scale-[1.02]'
                      : ''
                  }`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {plan.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className={`text-white text-xs font-bold px-4 py-1.5 rounded-full ${
                        plan.badge === 'Most Value'
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
                      {plan.originalPrice && (
                        <span className="text-lg text-muted-foreground line-through mr-2">{plan.originalPrice}</span>
                      )}
                      <span className="text-4xl font-display font-bold">{plan.price}</span>
                      {plan.period && <span className="text-muted-foreground">{plan.period}</span>}
                    </div>
                  </div>

                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm">
                        <Check className="h-4 w-4 text-pixo-green flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    variant={plan.highlighted ? 'gradient' : 'outline'}
                    className="w-full"
                    size="lg"
                    disabled={loadingPlan === plan.id}
                    onClick={() => handleSelectPlan(plan)}
                  >
                    {loadingPlan === plan.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
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

        {/* Testimonials */}
        <Testimonials />

        {/* FAQ */}
        <ScrollReveal>
          <PricingFAQ />
        </ScrollReveal>


        <section className="py-12 border-t border-border">
          <div className="container mx-auto px-4 text-center">
            <div className="flex items-center justify-center gap-6 flex-wrap text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Shield className="h-4 w-4 text-pixo-green" />
                <span>Secured by Razorpay</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 text-pixo-yellow fill-pixo-yellow" />
                <span>4.9/5 rating</span>
              </div>
              <span>•</span>
              <span>30-day money-back guarantee</span>
              <span>•</span>
              <span>Cancel anytime</span>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}

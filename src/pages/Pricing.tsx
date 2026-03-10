import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
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
    cta: 'Choose Plan',
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
    cta: 'Choose Plan',
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
    cta: 'Choose Plan',
    highlighted: false,
    badge: 'Best Value',
  },
];

export default function Pricing() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleTrialClick = async () => {
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
  };

  const handleSelectPlan = (plan: typeof plans[0]) => {
    if (!user) {
      // Store selected plan in sessionStorage, redirect to auth then back
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

    // Store selected plan and redirect to Learning Launch Check
    sessionStorage.setItem('selectedPlan', JSON.stringify({
      id: plan.id,
      name: plan.name,
      priceAmount: plan.priceAmount,
      duration: plan.duration,
      levelCount: plan.levelCount,
    }));
    navigate('/launch-check?from=pricing');
  };

  return (
    <Layout>
      <StickyPricingBar onTrialClick={handleTrialClick} loading={loadingPlan === 'trial'} />
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
              Choose a plan that works for your family. Each plan includes a Learning Launch Check to find the perfect starting level.
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
                onClick={handleTrialClick}
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
              <span>•</span>
              <span>30-day money-back guarantee</span>
              <span>•</span>
              <span>Cancel anytime</span>
            </div>
          </div>
        </section>
      </div>
      <WhatsAppButton />
    </Layout>
  );
}

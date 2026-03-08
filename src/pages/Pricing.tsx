import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import pixoLogo from '@/assets/pixo-logo.png';
import { Check, ArrowRight, Star, Sparkles, ArrowLeft } from 'lucide-react';

const plans = [
  {
    id: 'free',
    name: 'Explorer',
    price: 'Free',
    period: '',
    tagline: 'Try PIXO risk-free',
    features: [
      '3 lessons per level',
      'Basic speech feedback',
      'Daily login rewards',
      'Limited AI chat',
    ],
    cta: 'Start Free',
    highlighted: false,
  },
  {
    id: 'monthly',
    name: 'Adventurer',
    price: '₹499',
    period: '/month',
    tagline: 'Most flexible option',
    features: [
      'All 180 lessons per level',
      'Advanced AI speech scoring',
      'Unlimited AI practice',
      'Parent Mastery Hub',
      'Role play studio',
      'Weekly progress reports',
      'Priority support',
    ],
    cta: 'Choose Plan',
    highlighted: true,
    badge: 'Popular',
  },
  {
    id: 'yearly',
    name: 'Achiever',
    price: '₹2,999',
    period: '/year',
    tagline: 'Save 50% • Best value',
    originalPrice: '₹5,988',
    features: [
      'Everything in Adventurer',
      'All 3 levels unlocked',
      'Creative Studio access',
      'Expert PDF reports',
      'Offline lesson download',
      'Family sharing (2 kids)',
      'Early feature access',
    ],
    cta: 'Choose Plan',
    highlighted: false,
    badge: 'Best Value',
  },
];

export default function Pricing() {
  const { user } = useAuth();

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
                      <span className="gradient-bg text-white text-xs font-bold px-4 py-1.5 rounded-full">
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

                  <Link to={user ? '/student' : '/auth?signup=true'}>
                    <Button
                      variant={plan.highlighted ? 'gradient' : 'outline'}
                      className="w-full"
                      size="lg"
                    >
                      {plan.cta}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Trust */}
        <section className="py-12 border-t border-border">
          <div className="container mx-auto px-4 text-center">
            <div className="flex items-center justify-center gap-6 flex-wrap text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 text-pixo-yellow fill-pixo-yellow" />
                <span>4.9/5 rating</span>
              </div>
              <span>•</span>
              <span>30-day money-back guarantee</span>
              <span>•</span>
              <span>Cancel anytime</span>
              <span>•</span>
              <span>Secure payment</span>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}

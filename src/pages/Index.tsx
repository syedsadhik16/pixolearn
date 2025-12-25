import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import pixoLogo from '@/assets/pixo-logo.png';
import {
  Mic,
  BookOpen,
  Users,
  Trophy,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Star,
  Play,
} from 'lucide-react';

export default function Index() {
  const { user, profile } = useAuth();

  const getDashboardPath = () => {
    if (!profile) return '/auth';
    switch (profile.role) {
      case 'admin': return '/admin';
      case 'parent': return '/parent';
      default: return '/student';
    }
  };

  const features = [
    {
      icon: Mic,
      title: 'Speak & Practice',
      description: 'AI-powered speech evaluation gives you instant feedback on pronunciation and clarity.',
      color: 'text-pixo-orange',
      bg: 'bg-pixo-orange/10',
    },
    {
      icon: BookOpen,
      title: 'Daily Lessons',
      description: 'Structured curriculum with vocabulary, sentences, and read-aloud exercises.',
      color: 'text-pixo-yellow',
      bg: 'bg-pixo-yellow/10',
    },
    {
      icon: Trophy,
      title: 'Track Progress',
      description: 'See your improvement over time with detailed speaking scores and streaks.',
      color: 'text-pixo-green',
      bg: 'bg-pixo-green/10',
    },
    {
      icon: Users,
      title: 'Parent Monitoring',
      description: 'Parents can track their child\'s learning progress and achievements.',
      color: 'text-pixo-blue',
      bg: 'bg-pixo-blue/10',
    },
  ];

  const benefits = [
    'Unlimited practice attempts',
    'AI speech evaluation',
    'Daily lesson reminders',
    'Progress tracking',
    'Parent dashboard',
    'Attendance streaks',
  ];

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-32">
        <div className="absolute inset-0 gradient-bg opacity-5" />
        <div className="container mx-auto px-4 relative">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1 text-center lg:text-left animate-fade-in">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Sparkles className="h-4 w-4" />
                AI-Powered English Learning
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-6 leading-tight">
                Master Spoken English with{' '}
                <span className="gradient-text">Confidence</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-8 max-w-xl mx-auto lg:mx-0">
                Interactive lessons designed to improve your pronunciation, fluency, and speaking confidence through daily practice.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                {user ? (
                  <Link to={getDashboardPath()}>
                    <Button variant="gradient" size="xl">
                      Go to Dashboard
                      <ArrowRight className="h-5 w-5 ml-2" />
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link to="/auth?signup=true">
                      <Button variant="gradient" size="xl">
                        Start Learning Free
                        <ArrowRight className="h-5 w-5 ml-2" />
                      </Button>
                    </Link>
                    <Link to="/auth">
                      <Button variant="outline" size="xl">
                        Sign In
                      </Button>
                    </Link>
                  </>
                )}
              </div>
              <div className="flex items-center gap-6 mt-8 justify-center lg:justify-start text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-pixo-yellow fill-pixo-yellow" />
                  <span>4.9/5 rating</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>1M+ students</span>
                </div>
              </div>
            </div>
            <div className="flex-1 relative animate-float">
              <div className="relative">
                <div className="absolute inset-0 gradient-bg rounded-3xl blur-3xl opacity-20" />
                <div className="relative bg-card rounded-3xl p-8 shadow-2xl border border-border">
                  <img src={pixoLogo} alt="PIXO" className="w-64 mx-auto mb-6" />
                  <div className="text-center">
                    <p className="text-2xl font-display font-bold gradient-text mb-2">
                      Energy. Learn. Grow.
                    </p>
                    <p className="text-muted-foreground">
                      Your journey to fluent English starts here
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Why Students Love PIXO
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our interactive approach makes learning English fun and effective
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="pixo-card text-center animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className={`w-16 h-16 rounded-2xl ${feature.bg} flex items-center justify-center mx-auto mb-4`}>
                  <feature.icon className={`h-8 w-8 ${feature.color}`} />
                </div>
                <h3 className="font-display font-bold text-lg mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              How PIXO Works
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Simple, structured learning in just 15 minutes a day
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { step: 1, title: 'Learn New Words', desc: 'Practice vocabulary with pronunciation guides', icon: BookOpen },
              { step: 2, title: 'Speak Sentences', desc: 'Record yourself and get instant feedback', icon: Mic },
              { step: 3, title: 'Track Progress', desc: 'Watch your confidence grow daily', icon: Trophy },
            ].map((item, index) => (
              <div key={item.step} className="text-center animate-slide-up" style={{ animationDelay: `${index * 0.15}s` }}>
                <div className="relative inline-block mb-4">
                  <div className="w-20 h-20 rounded-full gradient-bg flex items-center justify-center">
                    <item.icon className="h-10 w-10 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-card border-2 border-primary rounded-full flex items-center justify-center font-bold text-sm">
                    {item.step}
                  </div>
                </div>
                <h3 className="font-display font-bold text-xl mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-display font-bold mb-6">
                Everything You Need to <span className="gradient-text">Speak Confidently</span>
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                PIXO provides a complete learning experience with all the tools you need to master spoken English.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {benefits.map((benefit, index) => (
                  <div key={benefit} className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-pixo-green flex-shrink-0" />
                    <span className="text-sm">{benefit}</span>
                  </div>
                ))}
              </div>
              <div className="mt-8">
                {!user && (
                  <Link to="/auth?signup=true">
                    <Button variant="gradient" size="lg">
                      Start Your Free Trial
                      <Play className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                )}
              </div>
            </div>
            <div className="relative">
              <div className="pixo-card p-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-muted rounded-xl">
                    <div className="w-12 h-12 rounded-full gradient-bg flex items-center justify-center">
                      <Mic className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold">Daily Speaking Practice</p>
                      <p className="text-sm text-muted-foreground">15 min/day</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-muted rounded-xl">
                    <div className="w-12 h-12 rounded-full bg-pixo-green/20 flex items-center justify-center">
                      <Trophy className="h-6 w-6 text-pixo-green" />
                    </div>
                    <div>
                      <p className="font-semibold">Speaking Score: 92%</p>
                      <p className="text-sm text-muted-foreground">+12% this week</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-muted rounded-xl">
                    <div className="w-12 h-12 rounded-full bg-pixo-orange/20 flex items-center justify-center">
                      <Sparkles className="h-6 w-6 text-pixo-orange" />
                    </div>
                    <div>
                      <p className="font-semibold">7 Day Streak! 🔥</p>
                      <p className="text-sm text-muted-foreground">Keep it up!</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="pixo-card gradient-bg text-white text-center py-16 px-8">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Ready to Start Speaking English?
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Join over 1 million students who have improved their English speaking skills with PIXO.
            </p>
            {user ? (
              <Link to={getDashboardPath()}>
                <Button variant="outline" size="xl" className="border-white text-white hover:bg-white hover:text-primary">
                  Go to Dashboard
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </Link>
            ) : (
              <Link to="/auth?signup=true">
                <Button variant="outline" size="xl" className="border-white text-white hover:bg-white hover:text-primary">
                  Get Started for Free
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <img src={pixoLogo} alt="PIXO" className="h-8" />
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} PIXO. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </Layout>
  );
}

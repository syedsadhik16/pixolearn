import { Link, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import pixoLogo from '@/assets/pixo-logo.png';
import { UpcomingPrograms } from '@/components/home/UpcomingPrograms';
import {
  Mic,
  BookOpen,
  Users,
  Trophy,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Play,
  Headphones,
  PenTool,
  Puzzle,
  Gamepad2,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from '@/hooks/useTranslation';
import { syncEntitlementFromDatabase, getUserAccessState, getRedirectForState } from '@/lib/entitlement';

export default function Index() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [hasCompletedLaunchCheck, setHasCompletedLaunchCheck] = useState(false);

  useEffect(() => {
    if (user) {
      supabase.from('assessment_results').select('id').eq('student_id', user.id).maybeSingle()
        .then(({ data }) => setHasCompletedLaunchCheck(!!data));
    }
  }, [user]);

  const getDashboardPath = () => {
    if (!profile) return '/auth';
    switch (profile.role) {
      case 'admin': return '/admin';
      case 'parent': return '/parent';
      default: return '/student';
    }
  };

  const handlePrimaryCTA = async () => {
    if (!user) {
      navigate('/auth?signup=true');
      return;
    }
    if (profile?.role === 'admin') { navigate('/admin'); return; }
    if (profile?.role === 'parent') { navigate('/parent'); return; }

    // For students: check entitlement state
    if (profile?.subscription_type === 'premium') {
      navigate('/student');
      return;
    }

    const entitlement = await syncEntitlementFromDatabase(user.id);
    const state = getUserAccessState(true, entitlement, profile?.subscription_type);
    navigate(getRedirectForState(state));
  };

  const features = [
    {
      icon: Mic,
      title: t('speakPractice'),
      description: t('speakPracticeDesc'),
      color: 'text-pixo-orange',
      bg: 'bg-pixo-orange/10',
    },
    {
      icon: BookOpen,
      title: t('dailyLessons'),
      description: t('dailyLessonsDesc'),
      color: 'text-pixo-yellow',
      bg: 'bg-pixo-yellow/10',
    },
    {
      icon: Trophy,
      title: t('trackProgress'),
      description: t('trackProgressDesc'),
      color: 'text-pixo-green',
      bg: 'bg-pixo-green/10',
    },
    {
      icon: Users,
      title: t('parentMonitoring'),
      description: t('parentMonitoringDesc'),
      color: 'text-pixo-blue',
      bg: 'bg-pixo-blue/10',
    },
  ];

  const dailyBlocks = [
    { icon: BookOpen, label: t('reading'), time: `5 ${t('min')}`, color: 'text-pixo-blue', bg: 'bg-pixo-blue/10' },
    { icon: Headphones, label: t('listening'), time: `5 ${t('min')}`, color: 'text-pixo-purple', bg: 'bg-pixo-purple/10' },
    { icon: Mic, label: t('pronunciation'), time: `5 ${t('min')}`, color: 'text-pixo-orange', bg: 'bg-pixo-orange/10' },
    { icon: PenTool, label: t('wordBuilding'), time: `5 ${t('min')}`, color: 'text-pixo-green', bg: 'bg-pixo-green/10' },
    { icon: Puzzle, label: t('miniQuiz'), time: `5 ${t('min')}`, color: 'text-pixo-yellow', bg: 'bg-pixo-yellow/10' },
    { icon: Gamepad2, label: t('funActivity'), time: `5 ${t('min')}`, color: 'text-pixo-red', bg: 'bg-pixo-red/10' },
  ];

  const benefits = [
    t('unlimitedPractice'),
    t('aiSpeechEval'),
    t('dailyReminders'),
    t('progressTracking'),
    t('parentDashboard'),
    t('attendanceStreaks'),
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
                {t('heroTagline')}
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-6 leading-tight">
                {t('heroTitle')}{' '}
                <span className="gradient-text">{t('heroTitleHighlight')}</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-8 max-w-xl mx-auto lg:mx-0">
                {t('heroDescription')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                {user ? (
                  <>
                    <Button variant="gradient" size="xl" onClick={handlePrimaryCTA}>
                      {hasCompletedLaunchCheck ? t('goToDashboard') : t('startLaunchCheck')}
                      <ArrowRight className="h-5 w-5 ml-2" />
                    </Button>
                    {!hasCompletedLaunchCheck && (
                      <Link to={getDashboardPath()}>
                        <Button variant="outline" size="xl">
                          {t('goToDashboard')}
                        </Button>
                      </Link>
                    )}
                  </>
                ) : (
                  <>
                    <Link to="/auth?signup=true">
                      <Button variant="gradient" size="xl">
                        {t('startLearningFree')}
                        <ArrowRight className="h-5 w-5 ml-2" />
                      </Button>
                    </Link>
                    <Link to="/pricing">
                      <Button variant="outline" size="xl">
                        {t('viewPricing')}
                      </Button>
                    </Link>
                  </>
                )}
              </div>
              <div className="flex items-center gap-6 mt-8 justify-center lg:justify-start text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Sparkles className="h-4 w-4 text-pixo-yellow" />
                  <span>{t('helpingStudents')}</span>
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
                      {t('energyLearnGrow')}
                    </p>
                    <p className="text-muted-foreground">
                      {t('childJourneyStarts')}
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
              {t('whyParentsChoose')}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t('whyParentsChooseDesc')}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
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
              {t('howPixoWorks')}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t('howPixoWorksDesc')}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { step: 1, title: t('takeLaunchCheck'), desc: t('takeLaunchCheckDesc'), icon: Sparkles },
              { step: 2, title: t('learnPracticeDaily'), desc: t('learnPracticeDailyDesc'), icon: Mic },
              { step: 3, title: t('watchConfidenceGrow'), desc: t('watchConfidenceGrowDesc'), icon: Trophy },
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

      {/* Daily Learning Model Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              {t('thirtyMinDay')} <span className="gradient-text">{t('sixFunActivities')}</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t('dailyBlocksDesc')}
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 max-w-5xl mx-auto">
            {dailyBlocks.map((block, index) => (
              <div
                key={index}
                className="pixo-card text-center py-6 animate-slide-up"
                style={{ animationDelay: `${index * 0.08}s` }}
              >
                <div className={`w-14 h-14 rounded-2xl ${block.bg} flex items-center justify-center mx-auto mb-3`}>
                  <block.icon className={`h-7 w-7 ${block.color}`} />
                </div>
                <h3 className="font-display font-bold text-sm mb-1">{block.label}</h3>
                <p className="text-xs text-muted-foreground">{block.time}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <p className="text-sm text-muted-foreground">
              🎯 Structured daily habit · 📈 Progressive difficulty · 🎮 Gamified experience
            </p>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-display font-bold mb-6">
                {t('everythingChildNeeds')} <span className="gradient-text">{t('speakConfidently')}</span>
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                {t('completeExperience')}
              </p>
              <div className="grid grid-cols-2 gap-4">
                {benefits.map((benefit) => (
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
                      {t('startFreeTrial')}
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
                      <p className="text-sm text-muted-foreground">30 min/day</p>
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

      {/* Upcoming Programs */}
      <UpcomingPrograms />

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="pixo-card gradient-bg text-white text-center py-16 px-8">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              {t('readyToBuild')}
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              {t('readyToBuildDesc')}
            </p>
            {user ? (
              <Button
                variant="outline"
                size="xl"
                className="border-white text-white hover:bg-white hover:text-primary"
                onClick={handlePrimaryCTA}
              >
                {hasCompletedLaunchCheck ? t('goToDashboard') : t('startLaunchCheck')}
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            ) : (
              <Link to="/auth?signup=true">
                <Button variant="outline" size="xl" className="border-white text-white hover:bg-white hover:text-primary">
                  {t('getStartedFree')}
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
              © {new Date().getFullYear()} PIXO. {t('allRightsReserved')}
            </p>
          </div>
        </div>
      </footer>
    </Layout>
  );
}

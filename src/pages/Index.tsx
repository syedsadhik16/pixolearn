import { Link, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import pixoLogo from '@/assets/pixo-logo.png';
import heroLearning from '@/assets/illustrations/hero-learning.png';
import bestTeachers from '@/assets/illustrations/best-teachers.png';
import personalisedPath from '@/assets/illustrations/personalised-path.png';
import parentInsights from '@/assets/illustrations/parent-insights.png';
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
  Star,
  Zap,
  Heart,
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

    if (profile?.subscription_type === 'premium') {
      navigate('/student');
      return;
    }

    const entitlement = await syncEntitlementFromDatabase(user.id);
    const state = getUserAccessState(true, entitlement, profile?.subscription_type);
    navigate(getRedirectForState(state));
  };

  const valueCards = [
    {
      title: 'Best Teachers',
      subtitle: 'in India',
      desc: 'Engaging videos that make learning simple and fun',
      img: bestTeachers,
      blob: 'pixo-blob-coral',
    },
    {
      title: 'Personalised',
      subtitle: 'Learning',
      desc: 'Unique learning journeys created just for you',
      img: personalisedPath,
      blob: 'pixo-blob-yellow',
    },
    {
      title: 'Detailed',
      subtitle: 'Insights',
      desc: 'Customized feedback with recommendations at every step',
      img: parentInsights,
      blob: 'pixo-blob-sky',
    },
  ];

  const features = [
    { icon: Mic, title: t('speakPractice'), description: t('speakPracticeDesc'), color: 'text-pixo-orange', bg: 'bg-pixo-orange/10' },
    { icon: BookOpen, title: t('dailyLessons'), description: t('dailyLessonsDesc'), color: 'text-pixo-yellow', bg: 'bg-pixo-yellow/10' },
    { icon: Trophy, title: t('trackProgress'), description: t('trackProgressDesc'), color: 'text-pixo-green', bg: 'bg-pixo-green/10' },
    { icon: Users, title: t('parentMonitoring'), description: t('parentMonitoringDesc'), color: 'text-pixo-blue', bg: 'bg-pixo-blue/10' },
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
      {/* HERO — BYJU-style with illustration on right + organic blobs */}
      <section className="relative overflow-hidden pt-16 pb-24 md:pt-24 md:pb-32">
        {/* Decorative blobs */}
        <div className="pixo-blob pixo-blob-coral w-72 h-72 -top-16 -left-16" />
        <div className="pixo-blob pixo-blob-yellow w-96 h-96 top-1/2 -right-32 opacity-30" />
        <div className="pixo-blob pixo-blob-sky w-64 h-64 bottom-0 left-1/3 opacity-30" />

        <div className="container mx-auto px-4 relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left animate-fade-in">
              <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur text-primary px-4 py-2 rounded-full text-sm font-semibold mb-6 shadow-pixo-sm border border-border/40">
                <Sparkles className="h-4 w-4" />
                {t('heroTagline')}
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-6 leading-[1.1] tracking-tight">
                {t('heroTitle')}{' '}
                <span className="gradient-text">{t('heroTitleHighlight')}</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                {t('heroDescription')}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                {user ? (
                  <Button variant="gradient" size="xl" onClick={handlePrimaryCTA} className="rounded-full">
                    {hasCompletedLaunchCheck ? t('goToDashboard') : t('startLaunchCheck')}
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>
                ) : (
                  <>
                    <Link to="/auth?signup=true">
                      <Button variant="gradient" size="xl" className="rounded-full w-full sm:w-auto">
                        {t('startLearningFree')}
                        <ArrowRight className="h-5 w-5 ml-2" />
                      </Button>
                    </Link>
                    <Link to="/pricing">
                      <Button variant="outline" size="xl" className="rounded-full w-full sm:w-auto bg-white/60 backdrop-blur">
                        {t('viewPricing')}
                      </Button>
                    </Link>
                  </>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-6 mt-8 justify-center lg:justify-start text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-pixo-yellow text-pixo-yellow" />
                    ))}
                  </div>
                  <span className="font-medium">4.9 • Loved by parents</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-pixo-yellow" />
                  <span>{t('helpingStudents')}</span>
                </div>
              </div>
            </div>

            {/* Hero illustration */}
            <div className="relative animate-float">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-[80%] h-[80%] rounded-full bg-gradient-to-br from-pixo-pink/40 to-pixo-yellow/30 blur-2xl" />
              </div>
              <img
                src={heroLearning}
                alt="Child learning English with PIXO"
                className="relative w-full max-w-lg mx-auto drop-shadow-2xl"
                width={1024}
                height={1024}
              />
            </div>
          </div>
        </div>
      </section>

      {/* THREE-CARD VALUE PROPS — BYJU phone-screens style */}
      <section className="py-20 pixo-surface relative overflow-hidden">
        <div className="container mx-auto px-4 relative">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-3">
              Why kids love <span className="gradient-text">PIXO Learn</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Three reasons families across India trust PIXO every single day
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
            {valueCards.map((card, i) => (
              <div
                key={card.title}
                className="pixo-card-premium relative overflow-hidden text-center animate-slide-up"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className={`pixo-blob ${card.blob} w-48 h-48 -top-12 left-1/2 -translate-x-1/2 opacity-40`} />
                <div className="relative">
                  <div className="h-56 flex items-center justify-center mb-4">
                    <img
                      src={card.img}
                      alt={card.title}
                      loading="lazy"
                      className="h-full w-auto object-contain drop-shadow-lg"
                      width={1024}
                      height={1024}
                    />
                  </div>
                  <h3 className="font-display font-bold text-2xl mb-1">{card.title}</h3>
                  <p className="font-display text-xl text-muted-foreground mb-3">{card.subtitle}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-6 px-2">{card.desc}</p>
                  <div className="flex items-center justify-center gap-1.5">
                    {[0, 1, 2].map((d) => (
                      <span key={d} className={`h-1.5 rounded-full transition-all ${d === i ? 'w-6 bg-primary' : 'w-1.5 bg-border'}`} />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES BENTO */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-3">
              {t('whyParentsChoose')}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t('whyParentsChooseDesc')}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <div
                key={index}
                className="pixo-card text-center animate-slide-up bg-white"
                style={{ animationDelay: `${index * 0.08}s` }}
              >
                <div className={`w-16 h-16 rounded-2xl ${feature.bg} flex items-center justify-center mx-auto mb-4`}>
                  <feature.icon className={`h-8 w-8 ${feature.color}`} />
                </div>
                <h3 className="font-display font-bold text-lg mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-20 pixo-surface-soft">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-3">
              {t('howPixoWorks')}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t('howPixoWorksDesc')}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              { step: 1, title: t('takeLaunchCheck'), desc: t('takeLaunchCheckDesc'), icon: Sparkles, color: 'from-pixo-orange to-pixo-yellow' },
              { step: 2, title: t('learnPracticeDaily'), desc: t('learnPracticeDailyDesc'), icon: Mic, color: 'from-pixo-red to-pixo-orange' },
              { step: 3, title: t('watchConfidenceGrow'), desc: t('watchConfidenceGrowDesc'), icon: Trophy, color: 'from-pixo-green to-pixo-blue' },
            ].map((item, index) => (
              <div key={item.step} className="relative text-center animate-slide-up" style={{ animationDelay: `${index * 0.15}s` }}>
                <div className="pixo-card-premium pt-12">
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2">
                    <div className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-pixo-lg rotate-3`}>
                      <item.icon className="h-10 w-10 text-white" />
                    </div>
                  </div>
                  <div className="text-xs font-bold text-primary tracking-wider mb-2">STEP {item.step}</div>
                  <h3 className="font-display font-bold text-xl mb-3">{item.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DAILY 6-BLOCK MODEL */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-3">
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
                className="pixo-tile bg-white text-center animate-slide-up"
                style={{ animationDelay: `${index * 0.06}s` }}
              >
                <div className={`w-14 h-14 rounded-2xl ${block.bg} flex items-center justify-center mx-auto mb-3`}>
                  <block.icon className={`h-7 w-7 ${block.color}`} />
                </div>
                <h3 className="font-display font-bold text-sm mb-1">{block.label}</h3>
                <p className="text-xs text-muted-foreground font-medium">{block.time}</p>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 mt-10 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><Zap className="h-4 w-4 text-pixo-yellow" /> Structured habit</span>
            <span className="flex items-center gap-1.5"><Trophy className="h-4 w-4 text-pixo-green" /> Progressive difficulty</span>
            <span className="flex items-center gap-1.5"><Heart className="h-4 w-4 text-pixo-red" /> Gamified joy</span>
          </div>
        </div>
      </section>

      {/* BENEFITS + LIVE PREVIEW */}
      <section className="py-20 pixo-surface">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            <div>
              <h2 className="text-3xl md:text-4xl font-display font-bold mb-6 leading-tight">
                {t('everythingChildNeeds')} <span className="gradient-text">{t('speakConfidently')}</span>
              </h2>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                {t('completeExperience')}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                {benefits.map((benefit) => (
                  <div key={benefit} className="flex items-center gap-2.5 bg-white/60 backdrop-blur rounded-xl px-4 py-3 border border-border/30">
                    <CheckCircle2 className="h-5 w-5 text-pixo-green flex-shrink-0" />
                    <span className="text-sm font-medium">{benefit}</span>
                  </div>
                ))}
              </div>
              {!user && (
                <Link to="/auth?signup=true">
                  <Button variant="gradient" size="lg" className="rounded-full">
                    {t('startFreeTrial')}
                    <Play className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              )}
            </div>
            <div className="relative">
              <div className="pixo-blob pixo-blob-yellow w-64 h-64 -top-8 -right-8 opacity-40" />
              <div className="pixo-card-premium relative">
                <div className="space-y-3">
                  <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-pixo-orange/10 to-pixo-yellow/10 rounded-2xl">
                    <div className="w-12 h-12 rounded-2xl gradient-bg flex items-center justify-center shadow-pixo-md">
                      <Mic className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">Daily Speaking Practice</p>
                      <p className="text-sm text-muted-foreground">30 min/day</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-pixo-green/10 to-pixo-sky/10 rounded-2xl">
                    <div className="w-12 h-12 rounded-2xl bg-pixo-green/20 flex items-center justify-center">
                      <Trophy className="h-6 w-6 text-pixo-green" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">Speaking Score: 92%</p>
                      <p className="text-sm text-muted-foreground">+12% this week</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-pixo-red/10 to-pixo-pink/10 rounded-2xl">
                    <div className="w-12 h-12 rounded-2xl bg-pixo-orange/20 flex items-center justify-center">
                      <Sparkles className="h-6 w-6 text-pixo-orange" />
                    </div>
                    <div className="flex-1">
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

      <UpcomingPrograms />

      {/* FINAL CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="relative overflow-hidden rounded-[2.5rem] gradient-bg text-white text-center py-20 px-8 shadow-pixo-xl">
            <div className="pixo-blob bg-white w-72 h-72 -top-16 -left-16 opacity-10" />
            <div className="pixo-blob bg-white w-96 h-96 -bottom-24 -right-24 opacity-10" />
            <div className="relative">
              <h2 className="text-3xl md:text-5xl font-display font-bold mb-4 max-w-3xl mx-auto leading-tight">
                {t('readyToBuild')}
              </h2>
              <p className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl mx-auto">
                {t('readyToBuildDesc')}
              </p>
              {user ? (
                <Button
                  variant="outline"
                  size="xl"
                  className="rounded-full border-white text-white bg-white/10 backdrop-blur hover:bg-white hover:text-primary"
                  onClick={handlePrimaryCTA}
                >
                  {hasCompletedLaunchCheck ? t('goToDashboard') : t('startLaunchCheck')}
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              ) : (
                <Link to="/auth?signup=true">
                  <Button variant="outline" size="xl" className="rounded-full border-white text-white bg-white/10 backdrop-blur hover:bg-white hover:text-primary">
                    {t('getStartedFree')}
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="mb-10">
            <div className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl shadow-pixo-lg border border-border bg-muted aspect-video">
              <video
                src="/footer-banner.mp4"
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                poster={pixoLogo}
                aria-label="PIXO Learn promotional banner"
                className="h-full w-full object-cover"
              />
            </div>
          </div>
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

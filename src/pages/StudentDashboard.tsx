import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { BottomNav } from '@/components/layout/BottomNav';
import { HamburgerMenu } from '@/components/layout/HamburgerMenu';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/shared/StatCard';
import { ProgressRing } from '@/components/shared/ProgressRing';
import { StreakDisplay } from '@/components/shared/StreakDisplay';
import { 
  BookOpen, 
  Calendar, 
  Trophy, 
  Mic, 
  Play, 
  Lock, 
  CheckCircle2,
  Sparkles,
  Target,
  TrendingUp,
  MessageCircle,
  BarChart3,
  Crown
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { GamificationPanel } from '@/components/shared/GamificationPanel';
import { DailyLoginReward } from '@/components/shared/DailyLoginReward';
import { checkAndAwardBadges } from '@/lib/gamification';
import { useCompanion } from '@/hooks/useCompanion';
import { TrialCountdown } from '@/components/shared/TrialCountdown';
import { useCurriculumProgress } from '@/hooks/useCurriculumProgress';
import { useTranslation } from '@/hooks/useTranslation';

export default function StudentDashboard() {
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const companion = useCompanion();
  const { t } = useTranslation();
  
  const { progress: currProgress, todaysDay, completedDayIds, days: currDays, loading: currLoading, error: currError } = useCurriculumProgress(user?.id);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    } else if (!authLoading && profile && profile.role !== 'student') {
      navigate(profile.role === 'parent' ? '/parent' : '/admin');
    }
  }, [user, profile, authLoading, navigate]);

  useEffect(() => {
    if (user && profile?.role === 'student') {
      fetchStreakAndBadges();
    }
  }, [user, profile]);

  const fetchStreakAndBadges = async () => {
    if (!user) return;
    try {
      checkAndAwardBadges(user.id);
      const { data: attendanceData } = await supabase
        .from('attendance')
        .select('*')
        .eq('student_id', user.id)
        .eq('lesson_completed', true)
        .order('date', { ascending: false });

      if (attendanceData) {
        let currentStreak = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        for (let i = 0; i < attendanceData.length; i++) {
          const attendanceDate = new Date(attendanceData[i].date);
          attendanceDate.setHours(0, 0, 0, 0);
          const expectedDate = new Date(today);
          expectedDate.setDate(expectedDate.getDate() - i);
          if (attendanceDate.getTime() === expectedDate.getTime()) {
            currentStreak++;
          } else {
            break;
          }
        }
        setStreak(currentStreak);
      }
    } catch (error) {
      console.error('Error fetching streak:', error);
    }
  };

  const loading = authLoading || currLoading;

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-pulse text-center">
            <div className="text-4xl mb-3">🚀</div>
            <p className="text-muted-foreground">{t('loadingPIXO')}</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (currError || (!currLoading && currDays.length === 0)) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center pixo-card p-8 max-w-md">
            <div className="text-4xl mb-3">📚</div>
            <h2 className="font-display font-bold text-xl mb-2">{t('noCurriculumData')}</h2>
            <p className="text-muted-foreground text-sm mb-4">
              {currError || t('noCurriculumDesc')}
            </p>
            <div className="flex flex-col gap-2">
              <Button variant="gradient" onClick={() => window.location.reload()}>
                {t('retry')}
              </Button>
              <Button variant="outline" onClick={() => navigate('/launch-check')}>
                {t('reassignLevel')}
              </Button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const currentDay = currProgress?.current_day || 1;
  const completedCount = completedDayIds.size;
  const totalXp = currProgress?.total_xp || 0;
  const progressPercent = currProgress?.completion_percent || Math.round((currentDay / 180) * 100);

  // Get nearby days for the lesson list
  const visibleDays = currDays.slice(0, Math.min(currentDay + 5, currDays.length));

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 pb-24">
        {/* Trial Countdown */}
        {profile?.trial_expires_at && (
          <div className="mb-6">
            <TrialCountdown trialExpiresAt={profile.trial_expires_at} />
          </div>
        )}
        {/* Daily Login Reward */}
        <div className="mb-6">
          <DailyLoginReward />
        </div>
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <img 
                src={companion.image} 
                alt={companion.name} 
                className="w-16 h-16 object-contain animate-float hidden sm:block" 
              />
              <div>
                <h1 className="text-3xl md:text-4xl font-display font-bold">
                  {t('welcomeBackName')} <span className="gradient-text">{profile?.full_name?.split(' ')[0] || t('learner')}</span>! 👋
                </h1>
                <p className="text-muted-foreground mt-2">
                  {companion.name} says: {todaysDay 
                    ? t('letsKeepLearning') 
                    : t('allCaughtUp')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {profile?.subscription_type === 'premium' ? (
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full gradient-bg text-white text-xs font-bold">
                  <Crown className="h-3.5 w-3.5" /> {t('premium')}
                </span>
              ) : (
                <button
                  onClick={() => navigate('/pricing')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-muted-foreground text-xs font-semibold hover:bg-primary/10 hover:text-primary transition-colors"
                >
                  <Crown className="h-3.5 w-3.5" /> {t('freePlan')}
                </button>
              )}
              <StreakDisplay streak={streak} />
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <StatCard
              title={t('completedDays')}
              value={completedCount}
              subtitle={`${t('of')} 180 in Level 1`}
              icon={BookOpen}
              colorClass="bg-pixo-orange/10 text-pixo-orange"
            />
          </div>
          <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <StatCard
              title={t('totalXP')}
              value={totalXp}
              subtitle={t('keepEarning')}
              icon={Sparkles}
              trend={totalXp > 100 ? 'up' : 'neutral'}
              trendValue={t('keepPracticing')}
              colorClass="bg-pixo-green/10 text-pixo-green"
            />
          </div>
          <div className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <StatCard
              title={t('progress')}
              value={`${progressPercent}%`}
              subtitle={t('levelCompletion')}
              icon={Calendar}
              colorClass="bg-pixo-blue/10 text-pixo-blue"
            />
          </div>
          <div className="animate-slide-up" style={{ animationDelay: '0.4s' }}>
            <StatCard
              title="Current Day"
              value={`Day ${currentDay}`}
              subtitle="Phonics Foundation"
              icon={Trophy}
              colorClass="bg-pixo-yellow/10 text-pixo-yellow"
            />
          </div>
        </div>

        {/* Today's Lesson Card */}
        {todaysDay && (
          <div className="mb-8 animate-scale-in" style={{ animationDelay: '0.5s' }}>
            <div className="pixo-card gradient-bg p-8 text-white">
              <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-5 w-5 text-white/80" />
                    <span className="text-sm font-medium text-white/80">Today's Mission</span>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-display font-bold mb-2">
                    Day {todaysDay.day_number}: {todaysDay.title}
                  </h2>
                  <p className="text-white/90 mb-4">{todaysDay.day_objective || todaysDay.theme}</p>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Target className="h-4 w-4" />
                      <span>{todaysDay.theme}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <BookOpen className="h-4 w-4" />
                      <span>{todaysDay.main_game}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Sparkles className="h-4 w-4" />
                      <span>{todaysDay.daily_xp} XP</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-4">
                  <ProgressRing 
                    progress={completedDayIds.has(todaysDay.id) ? 100 : 0} 
                    size={100}
                  >
                    {completedDayIds.has(todaysDay.id) ? (
                      <CheckCircle2 className="h-8 w-8 text-white" />
                    ) : (
                      <Play className="h-8 w-8 text-white" />
                    )}
                  </ProgressRing>
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-white text-white hover:bg-white hover:text-primary"
                    onClick={() => navigate(`/lesson/${todaysDay.id}`)}
                  >
                    {completedDayIds.has(todaysDay.id) ? 'Practice Again' : 'Start Lesson'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Weekly Report Link */}
        <div className="mb-8 animate-fade-in" style={{ animationDelay: '0.52s' }}>
          <div className="pixo-card bg-gradient-to-r from-pixo-blue/10 to-pixo-purple/10 border-pixo-blue/20">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-pixo-blue/10 flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-pixo-blue" />
              </div>
              <div className="flex-1">
                <h3 className="font-display font-bold">Weekly Progress Report</h3>
                <p className="text-sm text-muted-foreground">View your lessons, XP, and streak charts</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate('/weekly-report')}>
                View
              </Button>
            </div>
          </div>
        </div>

        {/* AI Practice Section */}
        <div className="mb-8 animate-fade-in" style={{ animationDelay: '0.55s' }}>
          <div className={`pixo-card bg-gradient-to-r from-accent/20 to-secondary/20 border-accent/30 ${profile?.subscription_type === 'free' ? 'relative overflow-hidden' : ''}`}>
            {profile?.subscription_type === 'free' && (
              <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] z-10 flex items-center justify-center">
                <div className="text-center">
                  <Lock className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm font-semibold text-muted-foreground mb-2">Premium Feature</p>
                  <Button variant="gradient" size="sm" onClick={() => navigate('/pricing')}>
                    <Crown className="h-4 w-4 mr-1" /> Upgrade to Unlock
                  </Button>
                </div>
              </div>
            )}
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex items-center gap-4 flex-1">
                <div className="w-14 h-14 rounded-xl bg-accent/20 flex items-center justify-center">
                  <MessageCircle className="h-7 w-7 text-accent" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg">AI Practice Simulations</h3>
                  <p className="text-sm text-muted-foreground">
                    Practice real conversations with AI in restaurants, shops, interviews & more
                  </p>
                </div>
              </div>
              <Button 
                variant="gradient" 
                size="lg"
                onClick={() => navigate('/practice')}
                disabled={profile?.subscription_type === 'free'}
              >
                <MessageCircle className="h-5 w-5 mr-2" />
                Start Practicing
              </Button>
            </div>
          </div>
        </div>

        {/* Lesson List - from curriculum_days */}
        <div className="animate-fade-in" style={{ animationDelay: '0.6s' }}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-display font-bold">Your Lessons</h3>
            <span className="text-sm text-muted-foreground">
              Level 1: Phonics Foundation
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {visibleDays.map((day, index) => {
              const completed = completedDayIds.has(day.id);
              const accessible = day.day_number <= currentDay;
              const isCurrent = day.day_number === currentDay;
              const premiumLocked = profile?.subscription_type === 'free' && day.day_number > 2;

              return (
                <div
                  key={day.id}
                  className={`pixo-card relative overflow-hidden transition-all duration-300 ${
                    !accessible || premiumLocked ? 'opacity-60' : ''
                  } ${isCurrent ? 'ring-2 ring-primary' : ''}`}
                  style={{ animationDelay: `${0.7 + index * 0.05}s` }}
                >
                  {isCurrent && (
                    <div className="absolute top-0 left-0 right-0 h-1 gradient-bg" />
                  )}
                  
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold bg-muted px-2 py-1 rounded-full">
                        Day {day.day_number}
                      </span>
                      {completed && (
                        <CheckCircle2 className="h-5 w-5 text-pixo-green" />
                      )}
                    </div>
                    {premiumLocked ? (
                      <Crown className="h-5 w-5 text-pixo-orange" />
                    ) : !accessible ? (
                      <Lock className="h-5 w-5 text-muted-foreground" />
                    ) : null}
                  </div>

                  <h4 className="font-semibold mb-2">{day.title}</h4>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                    {day.day_objective || day.theme}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                    <span>🎮 {day.main_game}</span>
                    <span>•</span>
                    <span>⭐ {day.daily_xp} XP</span>
                  </div>

                  <Button
                    variant={completed ? 'outline' : accessible && !premiumLocked ? 'default' : 'ghost'}
                    size="sm"
                    className="w-full"
                    disabled={!accessible || premiumLocked}
                    onClick={() => {
                      if (premiumLocked) {
                        navigate('/pricing');
                        return;
                      }
                      navigate(`/lesson/${day.id}`);
                    }}
                  >
                    {premiumLocked ? (
                      <>
                        <Crown className="h-4 w-4 mr-1" />
                        Upgrade
                      </>
                    ) : !accessible ? (
                      <>
                        <Lock className="h-4 w-4 mr-1" />
                        Locked
                      </>
                    ) : completed ? (
                      <>
                        <TrendingUp className="h-4 w-4 mr-1" />
                        Practice Again
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-1" />
                        Start
                      </>
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Gamification Panel */}
        <div className="mb-8 mt-8 animate-fade-in" style={{ animationDelay: '0.65s' }}>
          <h3 className="text-xl font-display font-bold mb-4">🎮 Your Progress & Rewards</h3>
          <GamificationPanel />
        </div>

        {/* Premium Upsell */}
        {profile?.subscription_type === 'free' && (
          <div className="mt-8 animate-fade-in">
            <div className="pixo-card bg-gradient-to-r from-pixo-purple/10 to-pixo-blue/10 border-pixo-purple/20">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex-1">
                  <h3 className="font-display font-bold text-lg mb-1">
                    Unlock Unlimited Learning 🚀
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Get access to all 180 days, unlimited practice sessions, and advanced progress tracking.
                  </p>
                </div>
                <Button variant="gradient" onClick={() => navigate('/pricing')}>
                  <Crown className="h-4 w-4 mr-2" /> Upgrade to Premium
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
      <HamburgerMenu />
      <BottomNav />
    </Layout>
  );
}

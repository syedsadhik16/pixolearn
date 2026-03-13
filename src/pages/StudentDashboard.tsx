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

interface Lesson {
  id: string;
  level: string;
  day_number: number;
  title: string;
  description: string | null;
  vocabulary: unknown;
  sentences: unknown;
  read_aloud_text: string | null;
}

interface StudentProgress {
  current_level: string;
  current_day: number;
}

interface LessonCompletion {
  lesson_id: string;
  pronunciation_score: number | null;
  fluency_score: number | null;
  clarity_score: number | null;
  confidence_score: number | null;
  practice_count: number;
}

export default function StudentDashboard() {
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const companion = useCompanion();
  
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progress, setProgress] = useState<StudentProgress | null>(null);
  const [completions, setCompletions] = useState<LessonCompletion[]>([]);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    } else if (!authLoading && profile && profile.role !== 'student') {
      navigate(profile.role === 'parent' ? '/parent' : '/admin');
    }
  }, [user, profile, authLoading, navigate]);

  useEffect(() => {
    if (user && profile?.role === 'student') {
      fetchData();
    }
  }, [user, profile]);

  const fetchData = async () => {
    try {
      // Fetch student progress
      const { data: progressData, error: progressError } = await supabase
        .from('student_progress')
        .select('*')
        .eq('student_id', user!.id)
        .single();

      if (progressError && progressError.code !== 'PGRST116') {
        throw progressError;
      }

      const currentProgress = progressData || { current_level: 'beginner', current_day: 1 };
      setProgress(currentProgress);

      // Fetch lessons for current level
      const { data: lessonsData, error: lessonsError } = await supabase
        .from('lessons')
        .select('*')
        .eq('level', currentProgress.current_level)
        .eq('is_active', true)
        .order('day_number');

      if (lessonsError) throw lessonsError;
      setLessons(lessonsData || []);

      // Fetch completions
      const { data: completionsData, error: completionsError } = await supabase
        .from('lesson_completions')
        .select('*')
        .eq('student_id', user!.id);

      if (completionsError) throw completionsError;
      setCompletions(completionsData || []);

      // Check and award badges
      checkAndAwardBadges(user!.id);

      // Calculate streak from attendance
      const { data: attendanceData } = await supabase
        .from('attendance')
        .select('*')
        .eq('student_id', user!.id)
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
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load your dashboard data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getTodaysLesson = () => {
    if (!progress || lessons.length === 0) return null;
    return lessons.find(l => l.day_number === progress.current_day);
  };

  const isLessonCompleted = (lessonId: string) => {
    return completions.some(c => c.lesson_id === lessonId);
  };

  const isLessonAccessible = (dayNumber: number) => {
    if (!progress) return false;
    return dayNumber <= progress.current_day;
  };

  const getAverageScore = () => {
    if (completions.length === 0) return 0;
    const scores = completions.flatMap(c => [
      c.pronunciation_score,
      c.fluency_score,
      c.clarity_score,
      c.confidence_score,
    ]).filter((s): s is number => s !== null);
    
    if (scores.length === 0) return 0;
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  };

  const getTotalPracticeTime = () => {
    const totalAttempts = completions.reduce((sum, c) => sum + c.practice_count, 0);
    return totalAttempts * 5; // Estimate 5 minutes per practice
  };

  const todaysLesson = getTodaysLesson();

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-pulse text-center">
            <div className="w-16 h-16 bg-primary/20 rounded-full mx-auto mb-4" />
            <p className="text-muted-foreground">Loading your dashboard...</p>
          </div>
        </div>
      </Layout>
    );
  }

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
                  Welcome back, <span className="gradient-text">{profile?.full_name?.split(' ')[0] || 'Learner'}</span>! 👋
                </h1>
                <p className="text-muted-foreground mt-2">
                  {companion.name} says: {todaysLesson 
                    ? "Let's keep learning today!" 
                    : "Great job! You're all caught up!"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {profile?.subscription_type === 'premium' ? (
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full gradient-bg text-white text-xs font-bold">
                  <Crown className="h-3.5 w-3.5" /> Premium
                </span>
              ) : (
                <button
                  onClick={() => navigate('/pricing')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-muted-foreground text-xs font-semibold hover:bg-primary/10 hover:text-primary transition-colors"
                >
                  <Crown className="h-3.5 w-3.5" /> Free Plan
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
              title="Completed Lessons"
              value={completions.length}
              subtitle={`of ${lessons.length} in ${progress?.current_level === 'beginner' ? 'Level 1' : progress?.current_level === 'intermediate' ? 'Level 2' : 'Level 3'}`}
              icon={BookOpen}
              colorClass="bg-pixo-orange/10 text-pixo-orange"
            />
          </div>
          <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <StatCard
              title="Speaking Score"
              value={`${getAverageScore()}%`}
              subtitle="Average performance"
              icon={Mic}
              trend={getAverageScore() > 70 ? 'up' : 'neutral'}
              trendValue="Keep practicing!"
              colorClass="bg-pixo-green/10 text-pixo-green"
            />
          </div>
          <div className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <StatCard
              title="Practice Time"
              value={`${getTotalPracticeTime()}m`}
              subtitle="Total this month"
              icon={Calendar}
              colorClass="bg-pixo-blue/10 text-pixo-blue"
            />
          </div>
          <div className="animate-slide-up" style={{ animationDelay: '0.4s' }}>
            <StatCard
              title="Current Level"
              value={progress?.current_level === 'beginner' ? 'Beginner' : progress?.current_level === 'intermediate' ? 'Intermediate' : 'Advanced'}
              subtitle={`Day ${progress?.current_day || 1}`}
              icon={Trophy}
              colorClass="bg-pixo-yellow/10 text-pixo-yellow"
            />
          </div>
        </div>

        {/* Today's Lesson Card */}
        {todaysLesson && (
          <div className="mb-8 animate-scale-in" style={{ animationDelay: '0.5s' }}>
            <div className="pixo-card gradient-bg p-8 text-white">
              <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-5 w-5 text-white/80" />
                    <span className="text-sm font-medium text-white/80">Today's Lesson</span>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-display font-bold mb-2">
                    Day {todaysLesson.day_number}: {todaysLesson.title}
                  </h2>
                  <p className="text-white/90 mb-4">{todaysLesson.description}</p>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <BookOpen className="h-4 w-4" />
                      <span>{Array.isArray(todaysLesson.vocabulary) ? todaysLesson.vocabulary.length : 0} vocabulary words</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Target className="h-4 w-4" />
                      <span>{Array.isArray(todaysLesson.sentences) ? todaysLesson.sentences.length : 0} sentences to practice</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Mic className="h-4 w-4" />
                      <span>Read-aloud exercise</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-4">
                  <ProgressRing 
                    progress={isLessonCompleted(todaysLesson.id) ? 100 : 0} 
                    size={100}
                  >
                    {isLessonCompleted(todaysLesson.id) ? (
                      <CheckCircle2 className="h-8 w-8 text-white" />
                    ) : (
                      <Play className="h-8 w-8 text-white" />
                    )}
                  </ProgressRing>
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-white text-white hover:bg-white hover:text-primary"
                    onClick={() => navigate(`/lesson/${todaysLesson.id}`)}
                  >
                    {isLessonCompleted(todaysLesson.id) ? 'Practice Again' : 'Start Lesson'}
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

        {/* Lesson List */}
        <div className="animate-fade-in" style={{ animationDelay: '0.6s' }}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-display font-bold">Your Lessons</h3>
            <span className="text-sm text-muted-foreground">
              Level: {progress?.current_level === 'beginner' ? 'Beginner' : progress?.current_level === 'intermediate' ? 'Intermediate' : 'Advanced'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lessons.map((lesson, index) => {
              const completed = isLessonCompleted(lesson.id);
              const accessible = isLessonAccessible(lesson.day_number);
              const isCurrent = lesson.day_number === progress?.current_day;

              return (
                <div
                  key={lesson.id}
                  className={`pixo-card relative overflow-hidden transition-all duration-300 ${
                    !accessible ? 'opacity-60' : ''
                  } ${isCurrent ? 'ring-2 ring-primary' : ''}`}
                  style={{ animationDelay: `${0.7 + index * 0.05}s` }}
                >
                  {isCurrent && (
                    <div className="absolute top-0 left-0 right-0 h-1 gradient-bg" />
                  )}
                  
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold bg-muted px-2 py-1 rounded-full">
                        Day {lesson.day_number}
                      </span>
                      {completed && (
                        <CheckCircle2 className="h-5 w-5 text-pixo-green" />
                      )}
                    </div>
                    {!accessible && <Lock className="h-5 w-5 text-muted-foreground" />}
                  </div>

                  <h4 className="font-semibold mb-2">{lesson.title}</h4>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                    {lesson.description}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                    <span>{Array.isArray(lesson.vocabulary) ? lesson.vocabulary.length : 0} words</span>
                    <span>•</span>
                    <span>{Array.isArray(lesson.sentences) ? lesson.sentences.length : 0} sentences</span>
                  </div>

                  <Button
                    variant={completed ? 'outline' : accessible ? 'default' : 'ghost'}
                    size="sm"
                    className="w-full"
                    disabled={!accessible}
                    onClick={() => navigate(`/lesson/${lesson.id}`)}
                  >
                    {!accessible ? (
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
        <div className="mb-8 animate-fade-in" style={{ animationDelay: '0.65s' }}>
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
                    Get access to all lessons, unlimited practice sessions, and advanced progress tracking.
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
      <BottomNav />
    </Layout>
  );
}

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { BottomNav } from '@/components/layout/BottomNav';
import { HamburgerMenu } from '@/components/layout/HamburgerMenu';
import { useAuth } from '@/contexts/AuthContext';
import { CheckCircle2, Lock, Sparkles, Play, ChevronDown, ChevronUp, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PageBreadcrumb } from '@/components/shared/PageBreadcrumb';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useCompanion } from '@/hooks/useCompanion';
import { useCurriculumProgress } from '@/hooks/useCurriculumProgress';

const milestones = [7, 15, 30, 60, 90, 100, 120, 150, 180];

export default function Journey() {
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const companion = useCompanion();
  const { progress, days, months, weeks, completedDayIds, loading: currLoading, error: currError } = useCurriculumProgress(user?.id);
  const [expandedMonth, setExpandedMonth] = useState<number | null>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  const currentDay = progress?.current_day || 1;

  // Auto-expand the month containing the current day
  useEffect(() => {
    if (months.length > 0 && days.length > 0) {
      const monthIndex = months.findIndex((m) => {
        const monthDays = days.filter(d => d.month_id === m.id);
        return monthDays.some(d => d.day_number === currentDay);
      });
      setExpandedMonth(monthIndex >= 0 ? monthIndex : 0);
    }
  }, [currentDay, months, days]);

  const loading = authLoading || currLoading;

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-6 pb-28">
          <div className="flex items-center gap-3 mb-6">
            <Skeleton className="w-12 h-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
          <Skeleton className="h-16 rounded-2xl mb-6" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-2xl" />
            ))}
          </div>
        </div>
        <HamburgerMenu />
        <BottomNav />
      </Layout>
    );
  }

  if (currError || days.length === 0) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center pixo-card p-8 max-w-md">
            <div className="text-4xl mb-3">🗺️</div>
            <h2 className="font-display font-bold text-xl mb-2">No Curriculum Data Found</h2>
            <p className="text-muted-foreground text-sm mb-4">
              {currError || "We couldn't load your learning journey. Please try again."}
            </p>
            <Button variant="gradient" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  const completedCount = completedDayIds.size;
  const progressPercent = Math.round((currentDay / 180) * 100);

  // Map month emojis
  const monthEmojis = ['👂', '🔤', '📖', '🚀', '🧠', '🎓'];
  const monthColors = [
    'from-pixo-red/20 to-pixo-orange/20 border-pixo-orange/30',
    'from-pixo-orange/20 to-pixo-yellow/20 border-pixo-yellow/30',
    'from-pixo-yellow/20 to-pixo-green/20 border-pixo-green/30',
    'from-pixo-green/20 to-pixo-blue/20 border-pixo-blue/30',
    'from-pixo-blue/20 to-pixo-purple/20 border-pixo-purple/30',
    'from-pixo-purple/20 to-pixo-red/20 border-pixo-red/30',
  ];

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 pb-28">
        <PageBreadcrumb segments={[
          { label: 'Dashboard', href: '/student' },
          { label: 'My Adventure' },
        ]} />
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <img src={companion.image} alt={companion.name} className="w-12 h-12 object-contain animate-float" />
            <div>
              <h1 className="text-2xl font-display font-bold">
                My <span className="gradient-text">Adventure</span> 🗺️
              </h1>
              <p className="text-sm text-muted-foreground">Day {currentDay} of 180 • Level 1: Phonics Foundation</p>
            </div>
          </div>

          {/* Overall progress bar */}
          <div className="mt-4 bg-muted rounded-2xl p-3">
            <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
              <span>{completedCount} of 180 days complete</span>
              <span className="text-primary">{progressPercent}%</span>
            </div>
            <div className="h-3 bg-background rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-secondary transition-all duration-700"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Premium Paywall Banner for Free Users */}
        {profile?.subscription_type === 'free' && (
          <div className="mb-4 rounded-2xl border border-pixo-orange/30 bg-gradient-to-r from-pixo-orange/5 to-pixo-yellow/5 p-4 flex items-center gap-3">
            <Crown className="h-5 w-5 text-pixo-orange shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold">Free plan: First 2 lessons available</p>
              <p className="text-xs text-muted-foreground">Upgrade to unlock the full 180-day learning journey</p>
            </div>
            <Button variant="gradient" size="sm" onClick={() => navigate('/pricing')}>
              Upgrade
            </Button>
          </div>
        )}

        {/* Month Accordion */}
        <div className="space-y-3">
          {months.map((month, monthIndex) => {
            const isExpanded = expandedMonth === monthIndex;
            const monthDays = days.filter(d => d.month_id === month.id).sort((a, b) => a.day_number - b.day_number);
            const monthCompletedCount = monthDays.filter(d => completedDayIds.has(d.id)).length;
            const monthComplete = monthCompletedCount === monthDays.length && monthDays.length > 0;
            const hasCurrentDay = monthDays.some(d => d.day_number === currentDay);
            const isLocked = monthDays.length > 0 && !monthDays.some(d => d.day_number <= currentDay);

            // Group by weeks within this month
            const monthWeeks = weeks.filter(w => w.month_id === month.id).sort((a, b) => a.sort_order - b.sort_order);

            return (
              <div key={month.id} className={cn("rounded-2xl border overflow-hidden transition-all", isLocked ? "opacity-50" : "")}>
                {/* Month Header */}
                <button
                  onClick={() => setExpandedMonth(isExpanded ? null : monthIndex)}
                  className={cn(
                    "w-full flex items-center gap-3 p-4 text-left transition-colors bg-gradient-to-r",
                    monthColors[monthIndex] || monthColors[0],
                    hasCurrentDay && "ring-2 ring-primary/50"
                  )}
                >
                  <span className="text-2xl">{monthComplete ? '✅' : monthEmojis[monthIndex] || '📚'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-display font-bold text-sm truncate">Month {month.month_number}: {month.month_title}</p>
                      {hasCurrentDay && <span className="text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full font-bold">NOW</span>}
                    </div>
                    <p className="text-xs text-muted-foreground">{monthCompletedCount}/{monthDays.length} complete • {month.milestone_badge}</p>
                  </div>
                  {isLocked ? (
                    <Lock className="h-4 w-4 text-muted-foreground shrink-0" />
                  ) : isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                </button>

                {/* Month Lessons */}
                {isExpanded && !isLocked && (
                  <div className="p-3 space-y-2 bg-card/50">
                    {monthDays.map((day) => {
                      const isMilestone = milestones.includes(day.day_number) || day.is_milestone_day;
                      const completed = completedDayIds.has(day.id);
                      const accessible = day.day_number <= currentDay;
                      const isCurrent = day.day_number === currentDay;
                      const premiumLocked = profile?.subscription_type === 'free' && day.day_number > 2;

                      return (
                        <button
                          key={day.id}
                          onClick={() => {
                            if (premiumLocked) {
                              navigate('/pricing');
                              return;
                            }
                            if (accessible) navigate(`/lesson/${day.id}`);
                          }}
                          disabled={!accessible}
                          className={cn(
                            "w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all",
                            completed && "bg-secondary/10 border-secondary/30",
                            isCurrent && !completed && "bg-primary/10 border-primary/40 ring-2 ring-primary/30 animate-pulse-slow",
                            !completed && !isCurrent && accessible && "bg-card border-border hover:border-primary/40 hover:shadow-pixo-sm",
                            !accessible && "bg-muted/30 border-border/50 opacity-50"
                          )}
                        >
                          {/* Day circle */}
                          <div className={cn(
                            "shrink-0 w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm",
                            completed && "bg-secondary text-secondary-foreground",
                            isCurrent && !completed && "bg-primary text-primary-foreground",
                            !completed && !isCurrent && accessible && "bg-muted text-muted-foreground",
                            !accessible && "bg-muted/50 text-muted-foreground/50",
                            isMilestone && accessible && "ring-2 ring-accent"
                          )}>
                            {completed ? (
                              <CheckCircle2 className="h-5 w-5" />
                            ) : premiumLocked ? (
                              <Crown className="h-4 w-4 text-pixo-orange" />
                            ) : isCurrent ? (
                              <Play className="h-4 w-4" />
                            ) : !accessible ? (
                              <Lock className="h-3.5 w-3.5" />
                            ) : (
                              <span>{day.day_number}</span>
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className={cn(
                                "text-xs font-bold",
                                isCurrent ? "text-primary" : completed ? "text-secondary" : "text-muted-foreground"
                              )}>
                                Day {day.day_number}
                                {isMilestone && " ⭐"}
                              </p>
                            </div>
                            <p className={cn(
                              "text-sm font-medium truncate",
                              !accessible && "text-muted-foreground/60"
                            )}>
                              {day.title}
                            </p>
                            {accessible && (
                              <p className="text-[11px] text-muted-foreground truncate mt-0.5">{day.theme} • {day.main_game}</p>
                            )}
                          </div>

                          {/* Action indicator */}
                          {isCurrent && !completed && (
                            <span className="shrink-0 text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-lg">
                              START
                            </span>
                          )}
                          {completed && (
                            <span className="shrink-0 text-xs text-secondary">✓</span>
                          )}
                          {isMilestone && accessible && !completed && !isCurrent && (
                            <Sparkles className="h-4 w-4 text-accent shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Locked Levels */}
        <div className="mt-6 space-y-3">
          <div className="rounded-2xl border border-border/50 bg-muted/30 p-4 flex items-center gap-3 opacity-60">
            <span className="text-2xl">🔒</span>
            <div>
              <p className="font-display font-bold text-sm">Level 2: English Communication</p>
              <p className="text-xs text-muted-foreground">Complete Level 1 to unlock • 180 days</p>
            </div>
          </div>
          <div className="rounded-2xl border border-border/50 bg-muted/30 p-4 flex items-center gap-3 opacity-40">
            <span className="text-2xl">🔒</span>
            <div>
              <p className="font-display font-bold text-sm">Level 3: Advanced Mastery</p>
              <p className="text-xs text-muted-foreground">Complete Level 2 to unlock • 180 days</p>
            </div>
          </div>
        </div>
      </div>
      <HamburgerMenu />
      <BottomNav />
    </Layout>
  );
}

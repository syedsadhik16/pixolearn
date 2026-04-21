import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { BottomNav } from '@/components/layout/BottomNav';
import { HamburgerMenu } from '@/components/layout/HamburgerMenu';
import { useAuth } from '@/contexts/AuthContext';
import { CheckCircle2, Lock, Sparkles, Play, Crown, Star, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PageBreadcrumb } from '@/components/shared/PageBreadcrumb';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useCompanion } from '@/hooks/useCompanion';
import { useCurriculumProgress } from '@/hooks/useCurriculumProgress';

const milestones = [7, 15, 30, 60, 90, 100, 120, 150, 180];

// Phase visual themes (reusing existing pixo color tokens)
const phaseThemes = [
  { emoji: '👂', name: 'Sound Sense', chipBg: 'bg-pixo-pink/30 text-pixo-red', accent: 'pixo-red' },
  { emoji: '🔤', name: 'Word Builders', chipBg: 'bg-pixo-yellow/30 text-pixo-orange', accent: 'pixo-orange' },
  { emoji: '📖', name: 'Story Time', chipBg: 'bg-pixo-green/20 text-pixo-green', accent: 'pixo-green' },
  { emoji: '🚀', name: 'Speak Up', chipBg: 'bg-pixo-sky/40 text-pixo-blue', accent: 'pixo-blue' },
  { emoji: '🧠', name: 'Think Big', chipBg: 'bg-pixo-purple/20 text-pixo-purple', accent: 'pixo-purple' },
  { emoji: '🎓', name: 'Champion', chipBg: 'bg-pixo-red/20 text-pixo-red', accent: 'pixo-red' },
];

export default function Journey() {
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const companion = useCompanion();
  const { progress, days, months, completedDayIds, loading: currLoading, error: currError } = useCurriculumProgress(user?.id);
  const currentNodeRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  const currentDay = progress?.current_day || 1;

  // Auto-scroll to current node on mount
  useEffect(() => {
    if (!currLoading && currentNodeRef.current) {
      setTimeout(() => {
        currentNodeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    }
  }, [currLoading, currentDay]);

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

  // Zig-zag offset positions for nodes (left, center-left, center, center-right, right)
  const zigzagOffsets = ['ml-0', 'ml-12', 'ml-20', 'ml-12', 'ml-0'];

  return (
    <Layout>
      {/* Ambient floating blobs (decorative, behind content) */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-0" aria-hidden="true">
        <div className="pixo-blob pixo-blob-coral" style={{ width: '320px', height: '320px', top: '8%', left: '-80px' }} />
        <div className="pixo-blob pixo-blob-yellow" style={{ width: '280px', height: '280px', top: '40%', right: '-90px' }} />
        <div className="pixo-blob pixo-blob-sky" style={{ width: '360px', height: '360px', top: '70%', left: '-120px' }} />
        <div className="pixo-blob pixo-blob-green" style={{ width: '240px', height: '240px', bottom: '5%', right: '-60px' }} />
      </div>

      <div className="container mx-auto px-4 py-6 pb-32 relative z-10 max-w-2xl">
        <PageBreadcrumb segments={[
          { label: 'Dashboard', href: '/student' },
          { label: 'My Adventure' },
        ]} />

        {/* Compact Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <img src={companion.image} alt={companion.name} className="w-14 h-14 object-contain animate-float" />
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-display font-bold leading-tight">
                My <span className="gradient-text">Adventure</span>
              </h1>
              <p className="text-xs text-muted-foreground">Level 1 · Phonics Foundation</p>
            </div>
          </div>

          {/* Slim gradient progress pill */}
          <div className="bg-white rounded-full p-1.5 shadow-pixo-sm border border-border/40">
            <div className="flex items-center gap-3 px-2">
              <div className="flex-1 h-2.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary via-pixo-orange to-pixo-yellow transition-all duration-700"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="text-xs font-display font-bold text-foreground whitespace-nowrap">
                Day {currentDay}<span className="text-muted-foreground font-normal">/180</span>
              </span>
              <span className="text-xs font-display font-bold text-primary whitespace-nowrap">{progressPercent}%</span>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground text-center mt-2">
            {completedCount} lessons completed · keep going! 🌟
          </p>
        </div>

        {/* Premium Paywall Banner */}
        {profile?.subscription_type === 'free' && (
          <div className="mb-6 rounded-3xl bg-gradient-to-r from-pixo-orange/10 via-pixo-yellow/10 to-pixo-orange/10 p-4 flex items-center gap-3 shadow-pixo-card">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pixo-orange to-pixo-yellow flex items-center justify-center shrink-0 shadow-pixo-sm">
              <Crown className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-display font-bold">Free plan · 2 lessons unlocked</p>
              <p className="text-xs text-muted-foreground">Upgrade for the full 180-day journey</p>
            </div>
            <Button variant="gradient" size="sm" className="rounded-full shrink-0" onClick={() => navigate('/pricing')}>
              Upgrade
            </Button>
          </div>
        )}

        {/* Winding Roadmap — Phases */}
        <div className="space-y-10">
          {months.map((month, monthIndex) => {
            const theme = phaseThemes[monthIndex] || phaseThemes[0];
            const monthDays = days.filter(d => d.month_id === month.id).sort((a, b) => a.day_number - b.day_number);
            const monthCompletedCount = monthDays.filter(d => completedDayIds.has(d.id)).length;
            const phaseLocked = monthDays.length > 0 && !monthDays.some(d => d.day_number <= currentDay);

            return (
              <section key={month.id} className={cn("relative", phaseLocked && "opacity-50 grayscale")}>
                {/* Phase chip header */}
                <div className="flex items-center gap-3 mb-6">
                  <div className={cn("journey-phase-chip", theme.chipBg)}>
                    <span className="text-base">{theme.emoji}</span>
                    <span>Phase {month.month_number} · {theme.name}</span>
                    {phaseLocked && <Lock className="h-3 w-3 ml-1" />}
                  </div>
                  <div className="flex-1 h-px bg-border/60" />
                  <span className="text-[11px] font-bold text-muted-foreground">
                    {monthCompletedCount}/{monthDays.length}
                  </span>
                </div>

                {/* Winding path of nodes */}
                <div className="relative space-y-6">
                  {/* Dotted SVG trail down the path */}
                  <svg
                    className="absolute inset-0 w-full h-full pointer-events-none"
                    aria-hidden="true"
                    preserveAspectRatio="none"
                  >
                    <line
                      x1="20%" y1="0" x2="80%" y2="100%"
                      stroke="hsl(var(--border))"
                      strokeWidth="2"
                      strokeDasharray="4 8"
                      opacity="0.5"
                    />
                  </svg>

                  {monthDays.map((day, dayIndex) => {
                    const isMilestone = milestones.includes(day.day_number) || day.is_milestone_day;
                    const completed = completedDayIds.has(day.id);
                    const accessible = day.day_number <= currentDay;
                    const isCurrent = day.day_number === currentDay;
                    const premiumLocked = profile?.subscription_type === 'free' && day.day_number > 2;
                    const offset = zigzagOffsets[dayIndex % zigzagOffsets.length];

                    const handleClick = () => {
                      if (premiumLocked) return navigate('/pricing');
                      if (accessible) navigate(`/lesson/${day.id}`);
                    };

                    const ariaLabel = `Day ${day.day_number}, ${day.title}, ${
                      completed ? 'completed' : isCurrent ? 'current lesson' : premiumLocked ? 'premium locked' : !accessible ? 'locked' : 'available'
                    }`;

                    return (
                      <div
                        key={day.id}
                        ref={isCurrent ? currentNodeRef : null}
                        className={cn("relative flex items-center gap-4", offset)}
                      >
                        {/* Node */}
                        <button
                          onClick={handleClick}
                          disabled={!accessible && !premiumLocked}
                          aria-label={ariaLabel}
                          className={cn(
                            "journey-node shrink-0 relative",
                            completed && "journey-node-completed",
                            isCurrent && "journey-node-current",
                            !completed && !isCurrent && "journey-node-locked",
                            isMilestone && accessible && "journey-node-milestone",
                            (accessible || premiumLocked) && "hover:scale-110 cursor-pointer",
                            !accessible && !premiumLocked && "cursor-not-allowed"
                          )}
                        >
                          {isCurrent && <span className="journey-node-pulse-ring" />}
                          {completed ? (
                            <CheckCircle2 className="h-7 w-7" strokeWidth={2.5} />
                          ) : premiumLocked ? (
                            <Crown className="h-6 w-6 text-pixo-orange" />
                          ) : isCurrent ? (
                            <Play className="h-6 w-6 fill-current" />
                          ) : !accessible ? (
                            <Lock className="h-5 w-5" />
                          ) : isMilestone ? (
                            <Star className="h-6 w-6 fill-current text-accent" />
                          ) : (
                            <span className="text-base">{day.day_number}</span>
                          )}
                          {/* Day number badge below node */}
                          <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] font-bold text-muted-foreground whitespace-nowrap">
                            Day {day.day_number}
                          </span>
                        </button>

                        {/* Floating "Continue" card for current day */}
                        {isCurrent && (
                          <div className="journey-current-card flex-1 min-w-0 animate-scale-in">
                            <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-0.5">
                              Day {day.day_number} · Continue here
                            </p>
                            <p className="font-display font-bold text-sm truncate mb-0.5">{day.title}</p>
                            <p className="text-[11px] text-muted-foreground truncate mb-3">{day.theme}</p>
                            <button
                              onClick={handleClick}
                              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full bg-gradient-to-r from-primary to-pixo-orange text-primary-foreground font-display font-bold text-sm shadow-pixo-md hover:shadow-pixo-lg active:scale-95 transition-all"
                            >
                              Continue <ArrowRight className="h-4 w-4" />
                            </button>
                          </div>
                        )}

                        {/* Milestone label for non-current milestone */}
                        {isMilestone && !isCurrent && accessible && (
                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-accent">
                            <Sparkles className="h-3.5 w-3.5" />
                            <span>Milestone!</span>
                          </div>
                        )}

                        {/* Title for non-current accessible/completed nodes */}
                        {!isCurrent && !isMilestone && (completed || accessible) && (
                          <p className={cn(
                            "text-xs font-medium truncate",
                            completed ? "text-secondary" : "text-muted-foreground"
                          )}>
                            {day.title}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Phase milestone footer */}
                {monthCompletedCount === monthDays.length && monthDays.length > 0 && (
                  <div className="mt-6 mx-auto max-w-xs text-center bg-gradient-to-r from-accent/20 to-pixo-yellow/20 rounded-2xl p-3 shadow-pixo-sm">
                    <p className="text-xs font-display font-bold">🏆 {month.milestone_badge} Earned!</p>
                  </div>
                )}
              </section>
            );
          })}
        </div>

        {/* Locked Future Levels */}
        <div className="mt-10 space-y-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground text-center">Coming Next</p>
          <div className="rounded-3xl bg-muted/40 p-4 flex items-center gap-3 opacity-70 shadow-pixo-sm">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <Lock className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <p className="font-display font-bold text-sm">Level 2 · English Communication</p>
              <p className="text-xs text-muted-foreground">Complete Level 1 to unlock</p>
            </div>
          </div>
          <div className="rounded-3xl bg-muted/30 p-4 flex items-center gap-3 opacity-50 shadow-pixo-sm">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <Lock className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <p className="font-display font-bold text-sm">Level 3 · Advanced Mastery</p>
              <p className="text-xs text-muted-foreground">Complete Level 2 to unlock</p>
            </div>
          </div>
        </div>
      </div>
      <HamburgerMenu />
      <BottomNav />
    </Layout>
  );
}

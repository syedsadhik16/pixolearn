import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BackButton } from '@/components/shared/BackButton';
import {
  getStudentPerformance,
  SKILL_AREAS,
  type PerformanceSummary,
  type SkillCode,
} from '@/lib/performance';
import { Sparkles, TrendingUp, Target, Brain, Lock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { PremiumUpgradeBanner } from '@/components/shared/PremiumUpgradeBanner';

const LEVELS = [
  { no: 1, label: 'Level 1' },
  { no: 2, label: 'Level 2' },
  { no: 3, label: 'Level 3' },
];

export default function Analyse() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<'performance' | 'progress'>('performance');
  const [activeLevel, setActiveLevel] = useState<number | undefined>(undefined);
  const [activeSkill, setActiveSkill] = useState<SkillCode | 'all'>('all');
  const [data, setData] = useState<PerformanceSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const isPremium = profile?.subscription_type === 'premium';

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    getStudentPerformance(user.id, activeLevel)
      .then(setData)
      .catch((e) => console.error('[Analyse]', e))
      .finally(() => setLoading(false));
  }, [user, activeLevel]);

  const filteredBySkill =
    activeSkill === 'all'
      ? data?.by_skill ?? []
      : (data?.by_skill ?? []).filter((s) => s.code === activeSkill);

  return (
    <Layout>
      <div className="min-h-screen pb-24 px-4 pt-4 max-w-2xl mx-auto">
        <BackButton />

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Brain className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-display font-bold text-foreground">
              Learning Analysis
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            With our in-depth insights, understand your strengths & focus areas.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-6 border-b border-border mb-5">
          {(['performance', 'progress'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'pb-3 text-sm font-semibold capitalize transition-colors relative',
                tab === t ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              {t}
              {tab === t && (
                <span className="absolute -bottom-px left-0 right-0 h-0.5 bg-primary rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* Level filters */}
        <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveLevel(undefined)}
            className={cn(
              'px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors',
              activeLevel === undefined
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            )}
          >
            All Levels
          </button>
          {LEVELS.map((l) => (
            <button
              key={l.no}
              onClick={() => setActiveLevel(l.no)}
              className={cn(
                'px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors',
                activeLevel === l.no
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {l.label}
            </button>
          ))}
        </div>

        {/* Skill filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveSkill('all')}
            className={cn(
              'flex flex-col items-center min-w-[60px] gap-1 transition-opacity',
              activeSkill === 'all' ? 'opacity-100' : 'opacity-60'
            )}
          >
            <div
              className={cn(
                'h-12 w-12 rounded-full flex items-center justify-center text-lg shadow-pixo-sm',
                activeSkill === 'all'
                  ? 'bg-gradient-to-br from-primary to-pixo-orange text-primary-foreground'
                  : 'bg-muted'
              )}
            >
              ⭐
            </div>
            <span className="text-[10px] font-semibold">All</span>
          </button>
          {SKILL_AREAS.map((s) => (
            <button
              key={s.code}
              onClick={() => setActiveSkill(s.code)}
              className={cn(
                'flex flex-col items-center min-w-[60px] gap-1 transition-opacity',
                activeSkill === s.code ? 'opacity-100' : 'opacity-60'
              )}
            >
              <div
                className={cn(
                  'h-12 w-12 rounded-full flex items-center justify-center text-lg shadow-pixo-sm',
                  activeSkill === s.code
                    ? 'bg-gradient-to-br from-secondary to-primary text-primary-foreground'
                    : 'bg-muted'
                )}
              >
                {s.emoji}
              </div>
              <span className="text-[10px] font-semibold">{s.label}</span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-48 w-full rounded-3xl" />
            <Skeleton className="h-32 w-full rounded-3xl" />
            <Skeleton className="h-32 w-full rounded-3xl" />
          </div>
        ) : tab === 'performance' ? (
          <PerformanceTab data={data} skills={filteredBySkill} isPremium={isPremium} navigate={navigate} />
        ) : (
          <ProgressTab data={data} />
        )}
      </div>
    </Layout>
  );
}

function DonutChart({ percent, label }: { percent: number; label: string }) {
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (percent / 100) * circumference;
  return (
    <div className="relative h-40 w-40">
      <svg viewBox="0 0 100 100" className="-rotate-90 h-full w-full">
        <circle cx="50" cy="50" r="45" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-3xl font-bold text-foreground">{percent}%</div>
        <div className="text-[11px] text-muted-foreground font-semibold">{label}</div>
      </div>
    </div>
  );
}

function PerformanceTab({
  data,
  skills,
  isPremium,
  navigate,
}: {
  data: PerformanceSummary | null;
  skills: PerformanceSummary['by_skill'];
  isPremium: boolean;
  navigate: ReturnType<typeof useNavigate>;
}) {
  if (!data) return <EmptyState />;

  return (
    <div className="space-y-4">
      {/* Overall donut card */}
      <Card className="p-6 rounded-3xl border-0 shadow-pixo-md bg-gradient-to-br from-card to-pixo-coral/10">
        <div className="flex items-center gap-5">
          <DonutChart percent={data.overall_accuracy} label="Overall" />
          <div className="flex-1">
            <Badge variant="secondary" className="mb-2 text-xs">
              All Skills
            </Badge>
            <h3 className="font-display font-bold text-lg text-foreground mb-1">
              Overall Statistics
            </h3>
            <p className="text-xs text-muted-foreground">
              {data.total_attempts} questions attempted
            </p>
          </div>
        </div>
      </Card>

      {/* Skill breakdown bars */}
      <Card className="p-5 rounded-3xl border-0 shadow-pixo-sm">
        <h3 className="font-display font-bold text-base text-foreground mb-4">
          Skill Breakdown
        </h3>
        <div className="space-y-3">
          {skills.map((s) => (
            <div key={s.code}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-base">{s.emoji}</span>
                  <span className="text-sm font-semibold">{s.label}</span>
                </div>
                <span className="text-sm font-bold text-foreground">{s.accuracy}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-700',
                    s.mastery === 'strong' && 'bg-secondary',
                    s.mastery === 'improving' && 'bg-primary',
                    s.mastery === 'developing' && 'bg-accent',
                    s.mastery === 'weak' && 'bg-destructive/70'
                  )}
                  style={{ width: `${Math.max(s.accuracy, 4)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Strengths */}
      {data.strong_skills.length > 0 && (
        <Card className="p-5 rounded-3xl border-0 shadow-pixo-sm bg-gradient-to-br from-secondary/15 to-card">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-5 w-5 text-secondary" />
            <h3 className="font-display font-bold text-base">Your Strengths</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {data.strong_skills.map((s) => (
              <Badge key={s.code} variant="secondary" className="rounded-full px-3 py-1">
                {s.emoji} {s.label} · {s.accuracy}%
              </Badge>
            ))}
          </div>
        </Card>
      )}

      {/* Weak areas (premium gated detail) */}
      {data.weak_skills.length > 0 && (
        <Card className="p-5 rounded-3xl border-0 shadow-pixo-sm bg-gradient-to-br from-pixo-coral/15 to-card">
          <div className="flex items-center gap-2 mb-3">
            <Target className="h-5 w-5 text-primary" />
            <h3 className="font-display font-bold text-base">Focus Areas</h3>
          </div>
          {!isPremium ? (
            <PremiumUpgradeBanner
              message="See exactly which sounds and skills need more practice."
              modalTitle="See your child's focus areas"
              modalDescription="Premium unlocks AI-powered weak-area analysis, personalised recommendations, and the full Knowledge Graph."
              source="analyse_focus_areas"
            />
          ) : (
            <div className="space-y-2">
              {data.weak_skills.map((s) => (
                <div
                  key={s.code}
                  className="flex items-center justify-between p-3 rounded-2xl bg-card"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{s.emoji}</span>
                    <div>
                      <p className="text-sm font-semibold">{s.label}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {s.attempts} attempts · {s.accuracy}%
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => navigate(`/practice-arena?skill=${s.code}`)}
                  >
                    Practice
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Recommendation */}
      <Card className="p-5 rounded-3xl border-0 shadow-pixo-sm bg-gradient-to-br from-primary/10 to-card">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-2xl bg-primary/20 flex items-center justify-center shrink-0">
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-display font-bold text-sm mb-1">Recommended Next</h3>
            <p className="text-sm text-foreground/80">{data.recommendation}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}

function ProgressTab({ data }: { data: PerformanceSummary | null }) {
  if (!data) return <EmptyState />;
  const max = Math.max(...data.trend_last_7_days.map((d) => d.accuracy), 100);

  return (
    <div className="space-y-4">
      <Card className="p-5 rounded-3xl border-0 shadow-pixo-sm">
        <h3 className="font-display font-bold text-base mb-1">7-Day Trend</h3>
        <p className="text-xs text-muted-foreground mb-4">Daily accuracy over the past week</p>
        <div className="flex items-end gap-2 h-32">
          {data.trend_last_7_days.map((d) => (
            <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
              <div className="text-[10px] font-semibold text-muted-foreground">
                {d.accuracy > 0 ? `${d.accuracy}%` : ''}
              </div>
              <div className="w-full bg-muted rounded-t-lg relative" style={{ height: '100%' }}>
                <div
                  className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-primary to-pixo-orange rounded-t-lg transition-all duration-700"
                  style={{ height: `${(d.accuracy / max) * 100}%` }}
                />
              </div>
              <div className="text-[9px] text-muted-foreground">
                {new Date(d.date).toLocaleDateString('en', { weekday: 'short' })[0]}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-5 rounded-3xl border-0 shadow-pixo-sm">
        <h3 className="font-display font-bold text-base mb-3">All Skills Progress</h3>
        <div className="space-y-3">
          {data.by_skill.map((s) => (
            <div key={s.code} className="flex items-center gap-3">
              <span className="text-xl">{s.emoji}</span>
              <div className="flex-1">
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold">{s.label}</span>
                  <span className="text-muted-foreground">{s.attempts} attempts</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-pixo-orange rounded-full"
                    style={{ width: `${Math.max(s.accuracy, 4)}%` }}
                  />
                </div>
              </div>
              <Badge
                variant={s.mastery === 'strong' ? 'secondary' : 'outline'}
                className="text-[10px] capitalize"
              >
                {s.mastery}
              </Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function EmptyState() {
  return (
    <Card className="p-8 rounded-3xl border-0 shadow-pixo-sm text-center">
      <Brain className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
      <h3 className="font-display font-bold text-base mb-2">No data yet</h3>
      <p className="text-sm text-muted-foreground">
        Complete a Practice round to see your learning analysis.
      </p>
    </Card>
  );
}

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BackButton } from '@/components/shared/BackButton';
import { Skeleton } from '@/components/ui/skeleton';
import { Network, Check, Lock, AlertCircle, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getKnowledgeGraph, type KnowledgeGraph, type GraphNode } from '@/lib/knowledgeGraph';

const NODE_STYLES: Record<
  GraphNode['mastery'],
  { ring: string; bg: string; text: string; icon: typeof Check }
> = {
  completed: { ring: 'ring-secondary', bg: 'bg-secondary', text: 'text-secondary-foreground', icon: Check },
  in_progress: { ring: 'ring-primary', bg: 'bg-primary', text: 'text-primary-foreground', icon: Sparkles },
  focus_needed: { ring: 'ring-destructive', bg: 'bg-destructive/80', text: 'text-destructive-foreground', icon: AlertCircle },
  locked: { ring: 'ring-muted', bg: 'bg-muted', text: 'text-muted-foreground', icon: Lock },
  related: { ring: 'ring-accent', bg: 'bg-accent/40', text: 'text-foreground', icon: Sparkles },
};

const LEGEND: { mastery: GraphNode['mastery']; label: string }[] = [
  { mastery: 'completed', label: 'Good Job' },
  { mastery: 'in_progress', label: 'Keep Going' },
  { mastery: 'focus_needed', label: 'Focus Needed' },
  { mastery: 'locked', label: 'Yet to complete' },
];

export default function KnowledgeGraphPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<KnowledgeGraph | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeLevel, setActiveLevel] = useState(1);
  const [selected, setSelected] = useState<GraphNode | null>(null);
  const isPremium = profile?.subscription_type === 'premium';

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    getKnowledgeGraph(user.id, activeLevel)
      .then(setData)
      .catch((e) => console.error('[Graph]', e))
      .finally(() => setLoading(false));
  }, [user, activeLevel]);

  // Group by week for readable mobile layout
  const weeks: { week: number; nodes: GraphNode[] }[] = [];
  (data?.nodes ?? []).forEach((n) => {
    let w = weeks.find((x) => x.week === n.week_no);
    if (!w) {
      w = { week: n.week_no, nodes: [] };
      weeks.push(w);
    }
    w.nodes.push(n);
  });

  // Free preview: only first 2 weeks
  const visibleWeeks = isPremium ? weeks : weeks.slice(0, 2);

  return (
    <Layout>
      <div className="min-h-screen pb-24 px-4 pt-4 max-w-2xl mx-auto">
        <BackButton />

        {/* Header */}
        <Card className="rounded-3xl border-0 shadow-pixo-md overflow-hidden mb-5 bg-gradient-to-br from-accent/30 via-card to-pixo-coral/10">
          <div className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <Network className="h-5 w-5 text-primary" />
              <Badge variant="outline" className="text-[10px]">Revise</Badge>
            </div>
            <h1 className="text-xl font-display font-bold text-foreground mb-1">
              Knowledge Graph
            </h1>
            <p className="text-xs text-muted-foreground">
              Visualise lesson concepts and what's needed to unlock & master each topic.
            </p>
          </div>
        </Card>

        {/* Level filters */}
        <div className="flex gap-2 mb-4">
          {[1, 2, 3].map((l) => (
            <button
              key={l}
              onClick={() => setActiveLevel(l)}
              className={cn(
                'px-4 py-1.5 rounded-full text-xs font-semibold transition-colors',
                activeLevel === l
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              Level {l}
            </button>
          ))}
        </div>

        {/* Recommendation banner */}
        {data?.recommendation && (
          <Card className="p-4 rounded-2xl border-0 shadow-pixo-sm bg-gradient-to-r from-primary/10 to-accent/10 mb-4">
            <p className="text-xs font-semibold text-primary mb-0.5">Recommended revision</p>
            <p className="text-sm text-foreground/85">{data.recommendation}</p>
          </Card>
        )}

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-24 w-full rounded-3xl" />
            <Skeleton className="h-24 w-full rounded-3xl" />
          </div>
        ) : visibleWeeks.length === 0 ? (
          <Card className="p-8 rounded-3xl border-0 shadow-pixo-sm text-center">
            <Network className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              No graph data for this level yet.
            </p>
          </Card>
        ) : (
          <div className="space-y-5 mb-5">
            {visibleWeeks.map((w) => (
              <Card
                key={w.week}
                className="p-4 rounded-3xl border-0 shadow-pixo-sm bg-card"
              >
                <h3 className="font-display font-bold text-sm text-foreground mb-3">
                  Week {w.week}
                </h3>
                <div className="relative flex flex-wrap gap-3">
                  {w.nodes.map((n, idx) => {
                    const style = NODE_STYLES[n.mastery];
                    const Icon = style.icon;
                    return (
                      <div key={n.id} className="relative">
                        <button
                          onClick={() => setSelected(n)}
                          aria-label={`Day ${n.day_no}: ${n.label}, ${n.mastery}`}
                          className={cn(
                            'h-14 w-14 rounded-2xl flex flex-col items-center justify-center gap-0.5 ring-2 transition-all hover:scale-105',
                            style.ring,
                            style.bg,
                            style.text,
                            n.is_current && 'ring-4 shadow-pixo-md scale-105',
                            n.is_milestone && 'ring-accent'
                          )}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          <span className="text-[10px] font-bold">D{n.day_no}</span>
                        </button>
                        {idx < w.nodes.length - 1 && (
                          <div
                            className="absolute top-1/2 -right-2 w-2 h-px bg-border"
                            aria-hidden="true"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </Card>
            ))}
          </div>
        )}

        {!isPremium && weeks.length > 2 && (
          <div className="mb-5">
            <PremiumUpgradeBanner
              message={`${weeks.length - 2} more weeks of the Knowledge Graph are waiting.`}
              modalTitle="Unlock the full Knowledge Graph"
              modalDescription={`Premium reveals all ${weeks.length} weeks of curriculum mapping, mastery tracking, and concept connections.`}
              source="knowledge_graph_locked_weeks"
            />
          </div>
        )}

        {/* Legend */}
        <Card className="p-4 rounded-2xl border-0 shadow-pixo-sm mb-5">
          <div className="grid grid-cols-2 gap-2 text-xs">
            {LEGEND.map((l) => {
              const style = NODE_STYLES[l.mastery];
              return (
                <div key={l.mastery} className="flex items-center gap-2">
                  <div className={cn('h-3 w-3 rounded-full', style.bg)} />
                  <span className="text-foreground/80">{l.label}</span>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Selected node action sheet */}
        {selected && (
          <Card className="p-5 rounded-3xl border-0 shadow-pixo-md bg-gradient-to-br from-card to-primary/5">
            <div className="flex items-center justify-between mb-2">
              <Badge variant="outline" className="text-[10px] capitalize">
                {selected.mastery.replace('_', ' ')}
              </Badge>
              <button
                onClick={() => setSelected(null)}
                className="text-muted-foreground text-xs"
              >
                Close
              </button>
            </div>
            <h3 className="font-display font-bold text-base mb-1">
              Day {selected.day_no}: {selected.label}
            </h3>
            {selected.accuracy > 0 && (
              <p className="text-xs text-muted-foreground mb-3">
                Mastery: {selected.accuracy}%
              </p>
            )}
            <div className="grid grid-cols-2 gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate('/journey')}
              >
                Open Lesson
              </Button>
              <Button
                size="sm"
                onClick={() =>
                  navigate(`/practice-arena?skill=${selected.skill_code}&topic=day-${selected.day_no}`)
                }
              >
                Practice
              </Button>
            </div>
          </Card>
        )}
      </div>
    </Layout>
  );
}

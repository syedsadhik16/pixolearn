import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { BottomNav } from '@/components/layout/BottomNav';
import { HamburgerMenu } from '@/components/layout/HamburgerMenu';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle2, Lock, Star, Trophy, Sparkles, Play, ChevronDown, ChevronUp, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useCompanion } from '@/hooks/useCompanion';

interface LessonNode {
  id: string;
  day_number: number;
  title: string;
  description: string | null;
  completed: boolean;
  accessible: boolean;
  isCurrent: boolean;
  premiumLocked?: boolean;
}

const phases = [
  { name: 'Sound Awareness', emoji: '👂', range: [1, 30], color: 'from-pixo-red/20 to-pixo-orange/20 border-pixo-orange/30' },
  { name: 'Letter-Sound Connection', emoji: '🔤', range: [31, 60], color: 'from-pixo-orange/20 to-pixo-yellow/20 border-pixo-yellow/30' },
  { name: 'CVC Words & Reading', emoji: '📖', range: [61, 90], color: 'from-pixo-yellow/20 to-pixo-green/20 border-pixo-green/30' },
  { name: 'Digraphs, Blends & Fluency', emoji: '🚀', range: [91, 120], color: 'from-pixo-green/20 to-pixo-blue/20 border-pixo-blue/30' },
  { name: 'Vocabulary & Grammar', emoji: '🧠', range: [121, 150], color: 'from-pixo-blue/20 to-pixo-purple/20 border-pixo-purple/30' },
  { name: 'Story Mastery & Graduation', emoji: '🎓', range: [151, 180], color: 'from-pixo-purple/20 to-pixo-red/20 border-pixo-red/30' },
];

const milestones = [7, 15, 30, 60, 90, 100, 120, 150, 180];

export default function Journey() {
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const companion = useCompanion();
  const [nodes, setNodes] = useState<LessonNode[]>([]);
  const [currentDay, setCurrentDay] = useState(1);
  const [loading, setLoading] = useState(true);
  const [expandedPhase, setExpandedPhase] = useState<number | null>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user && profile?.role === 'student') fetchJourneyData();
  }, [user, profile]);

  // Auto-expand the phase containing the current day
  useEffect(() => {
    if (currentDay > 0) {
      const phaseIndex = phases.findIndex(p => currentDay >= p.range[0] && currentDay <= p.range[1]);
      setExpandedPhase(phaseIndex >= 0 ? phaseIndex : 0);
    }
  }, [currentDay]);

  const fetchJourneyData = async () => {
    try {
      const { data: progress } = await supabase
        .from('student_progress')
        .select('current_level, current_day')
        .eq('student_id', user!.id)
        .single();

      const level = progress?.current_level || 'beginner';
      const day = progress?.current_day || 1;
      setCurrentDay(day);

      const { data: lessons } = await supabase
        .from('lessons')
        .select('id, day_number, title, description')
        .eq('level', level)
        .eq('is_active', true)
        .order('day_number');

      const { data: completions } = await supabase
        .from('lesson_completions')
        .select('lesson_id')
        .eq('student_id', user!.id);

      const completedIds = new Set(completions?.map(c => c.lesson_id) || []);

      const lessonNodes: LessonNode[] = (lessons || []).map(l => ({
        id: l.id,
        day_number: l.day_number,
        title: l.title,
        description: l.description,
        completed: completedIds.has(l.id),
        accessible: l.day_number <= day,
        isCurrent: l.day_number === day,
        premiumLocked: profile?.subscription_type === 'free' && l.day_number > 2,
      }));

      setNodes(lessonNodes);
    } catch (error) {
      console.error('Journey fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPhaseProgress = (phaseIndex: number) => {
    const phase = phases[phaseIndex];
    const phaseNodes = nodes.filter(n => n.day_number >= phase.range[0] && n.day_number <= phase.range[1]);
    const completed = phaseNodes.filter(n => n.completed).length;
    return { completed, total: phaseNodes.length || (phase.range[1] - phase.range[0] + 1) };
  };

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-pulse text-center">
            <div className="text-4xl mb-3">🗺️</div>
            <p className="text-muted-foreground">Loading your adventure...</p>
          </div>
        </div>
      </Layout>
    );
  }

  const completedCount = nodes.filter(n => n.completed).length;
  const progressPercent = nodes.length > 0 ? Math.round((completedCount / nodes.length) * 100) : 0;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 pb-28">
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

        {/* Phase Accordion */}
        <div className="space-y-3">
          {phases.map((phase, phaseIndex) => {
            const { completed, total } = getPhaseProgress(phaseIndex);
            const isExpanded = expandedPhase === phaseIndex;
            const phaseNodes = nodes.filter(n => n.day_number >= phase.range[0] && n.day_number <= phase.range[1]);
            const phaseComplete = completed === total && total > 0;
            const hasCurrentDay = currentDay >= phase.range[0] && currentDay <= phase.range[1];
            const isLocked = nodes.length > 0 && !nodes.some(n => n.day_number >= phase.range[0] && n.accessible);

            return (
              <div key={phaseIndex} className={cn("rounded-2xl border overflow-hidden transition-all", isLocked ? "opacity-50" : "")}>
                {/* Phase Header */}
                <button
                  onClick={() => setExpandedPhase(isExpanded ? null : phaseIndex)}
                  className={cn(
                    "w-full flex items-center gap-3 p-4 text-left transition-colors bg-gradient-to-r",
                    phase.color,
                    hasCurrentDay && "ring-2 ring-primary/50"
                  )}
                >
                  <span className="text-2xl">{phaseComplete ? '✅' : phase.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-display font-bold text-sm truncate">Phase {phaseIndex + 1}: {phase.name}</p>
                      {hasCurrentDay && <span className="text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full font-bold">NOW</span>}
                    </div>
                    <p className="text-xs text-muted-foreground">Days {phase.range[0]}-{phase.range[1]} • {completed}/{total} complete</p>
                  </div>
                  {isLocked ? (
                    <Lock className="h-4 w-4 text-muted-foreground shrink-0" />
                  ) : isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                </button>

                {/* Phase Lessons */}
                {isExpanded && !isLocked && (
                  <div className="p-3 space-y-2 bg-card/50">
                    {phaseNodes.map((node) => {
                      const isMilestone = milestones.includes(node.day_number);

                      return (
                        <button
                          key={node.id}
                          onClick={() => {
                            if (node.premiumLocked) {
                              navigate('/pricing');
                              return;
                            }
                            if (node.accessible && !node.id.startsWith('placeholder')) navigate(`/lesson/${node.id}`);
                          }}
                          disabled={!node.accessible || node.id.startsWith('placeholder')}
                          className={cn(
                            "w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all",
                            node.completed && "bg-secondary/10 border-secondary/30",
                            node.isCurrent && !node.completed && "bg-primary/10 border-primary/40 ring-2 ring-primary/30 animate-pulse-slow",
                            !node.completed && !node.isCurrent && node.accessible && "bg-card border-border hover:border-primary/40 hover:shadow-pixo-sm",
                            !node.accessible && "bg-muted/30 border-border/50 opacity-50"
                          )}
                        >
                          {/* Day circle */}
                          <div className={cn(
                            "shrink-0 w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm",
                            node.completed && "bg-secondary text-secondary-foreground",
                            node.isCurrent && !node.completed && "bg-primary text-primary-foreground",
                            !node.completed && !node.isCurrent && node.accessible && "bg-muted text-muted-foreground",
                            !node.accessible && "bg-muted/50 text-muted-foreground/50",
                            isMilestone && node.accessible && "ring-2 ring-accent"
                          )}>
                            {node.completed ? (
                              <CheckCircle2 className="h-5 w-5" />
                            ) : node.isCurrent ? (
                              <Play className="h-4 w-4" />
                            ) : !node.accessible ? (
                              <Lock className="h-3.5 w-3.5" />
                            ) : (
                              <span>{node.day_number}</span>
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className={cn(
                                "text-xs font-bold",
                                node.isCurrent ? "text-primary" : node.completed ? "text-secondary" : "text-muted-foreground"
                              )}>
                                Day {node.day_number}
                                {isMilestone && " ⭐"}
                              </p>
                            </div>
                            <p className={cn(
                              "text-sm font-medium truncate",
                              !node.accessible && "text-muted-foreground/60"
                            )}>
                              {node.title}
                            </p>
                            {node.description && node.accessible && (
                              <p className="text-[11px] text-muted-foreground truncate mt-0.5">{node.description}</p>
                            )}
                          </div>

                          {/* Action indicator */}
                          {node.isCurrent && !node.completed && (
                            <span className="shrink-0 text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-lg">
                              START
                            </span>
                          )}
                          {node.completed && (
                            <span className="shrink-0 text-xs text-secondary">✓</span>
                          )}
                          {isMilestone && node.accessible && !node.completed && !node.isCurrent && (
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

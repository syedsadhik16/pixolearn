import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { BottomNav } from '@/components/layout/BottomNav';
import { HamburgerMenu } from '@/components/layout/HamburgerMenu';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle2, Lock, Star, Trophy, Sparkles, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface LessonNode {
  id: string;
  day_number: number;
  title: string;
  completed: boolean;
  accessible: boolean;
  isCurrent: boolean;
}

const milestones = [3, 7, 14, 30, 50, 75, 100, 144, 180];

export default function Journey() {
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [nodes, setNodes] = useState<LessonNode[]>([]);
  const [currentDay, setCurrentDay] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user && profile?.role === 'student') fetchJourneyData();
  }, [user, profile]);

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
        .select('id, day_number, title')
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
        completed: completedIds.has(l.id),
        accessible: l.day_number <= day,
        isCurrent: l.day_number === day,
      }));

      setNodes(lessonNodes);
    } catch (error) {
      console.error('Journey fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading journey...</div>
        </div>
      </Layout>
    );
  }

  // Generate placeholder nodes if no lessons exist yet
  const displayNodes = nodes.length > 0 ? nodes : Array.from({ length: 30 }, (_, i) => ({
    id: `placeholder-${i}`,
    day_number: i + 1,
    title: `Day ${i + 1}`,
    completed: false,
    accessible: i + 1 <= currentDay,
    isCurrent: i + 1 === currentDay,
  }));

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 pb-24">
        <div className="mb-6">
          <h1 className="text-2xl font-display font-bold">
            Your <span className="gradient-text">Learning Journey</span>
          </h1>
          <p className="text-sm text-muted-foreground">Day {currentDay} • Keep going! 🚀</p>
        </div>

        {/* Journey Path */}
        <div className="relative max-w-md mx-auto">
          {displayNodes.map((node, index) => {
            const isMilestone = milestones.includes(node.day_number);
            const isLeft = index % 2 === 0;

            return (
              <div key={node.id} className="relative">
                {/* Connector line */}
                {index > 0 && (
                  <div className={cn(
                    "absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-6 -mt-6",
                    node.accessible ? "bg-primary/40" : "bg-border"
                  )} />
                )}

                <div className={cn(
                  "flex items-center gap-4 mb-6",
                  isLeft ? "flex-row" : "flex-row-reverse"
                )}>
                  {/* Node circle */}
                  <button
                    onClick={() => node.accessible && navigate(`/lesson/${node.id}`)}
                    disabled={!node.accessible || node.id.startsWith('placeholder')}
                    className={cn(
                      "relative shrink-0 w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 border-2",
                      node.completed && "bg-secondary border-secondary text-secondary-foreground shadow-md",
                      node.isCurrent && !node.completed && "bg-primary border-primary text-primary-foreground shadow-lg scale-110 animate-pulse-slow",
                      !node.completed && !node.isCurrent && node.accessible && "bg-card border-primary/40 text-primary hover:scale-105",
                      !node.accessible && "bg-muted border-border text-muted-foreground opacity-50",
                      isMilestone && node.accessible && "w-16 h-16"
                    )}
                  >
                    {node.completed ? (
                      <CheckCircle2 className="h-6 w-6" />
                    ) : node.isCurrent ? (
                      <Play className="h-5 w-5" />
                    ) : !node.accessible ? (
                      <Lock className="h-4 w-4" />
                    ) : isMilestone ? (
                      <Trophy className="h-5 w-5" />
                    ) : (
                      <span className="text-sm font-bold">{node.day_number}</span>
                    )}

                    {isMilestone && node.accessible && (
                      <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-accent" />
                    )}
                  </button>

                  {/* Label */}
                  <div className={cn(
                    "flex-1 min-w-0",
                    isLeft ? "text-left" : "text-right"
                  )}>
                    <p className={cn(
                      "text-xs font-semibold",
                      node.isCurrent ? "text-primary" : node.completed ? "text-secondary" : "text-muted-foreground"
                    )}>
                      Day {node.day_number}
                      {isMilestone && " ⭐"}
                    </p>
                    <p className={cn(
                      "text-sm truncate",
                      !node.accessible && "text-muted-foreground"
                    )}>
                      {node.title}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <HamburgerMenu />
      <BottomNav />
    </Layout>
  );
}

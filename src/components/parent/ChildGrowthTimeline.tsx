import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChildData } from '@/pages/ParentDashboard';
import { GitBranch, Star, Trophy, Zap, BookOpen, Award } from 'lucide-react';

interface Milestone {
  date: string;
  title: string;
  description: string;
  icon: typeof Star;
  type: 'achievement' | 'level' | 'streak' | 'lesson' | 'score';
}

interface Props { child: ChildData | null; }

export function ChildGrowthTimeline({ child }: Props) {
  const milestones = useMemo(() => {
    if (!child) return [];
    const ms: Milestone[] = [];

    // First lesson
    if (child.completions.length > 0) {
      const first = child.completions[child.completions.length - 1];
      ms.push({
        date: first.completed_at,
        title: 'First Lesson Completed! 🎉',
        description: 'Started the learning journey',
        icon: BookOpen, type: 'lesson',
      });
    }

    // Every 5th lesson milestone
    const lessonCounts = [5, 10, 25, 50, 100];
    lessonCounts.forEach(count => {
      if (child.completions.length >= count) {
        const c = child.completions[child.completions.length - count];
        ms.push({
          date: c.completed_at,
          title: `${count} Lessons Completed! 🏆`,
          description: `Reached ${count} lesson milestone`,
          icon: Trophy, type: 'achievement',
        });
      }
    });

    // Assessment result
    if (child.assessmentResult) {
      ms.push({
        date: child.assessmentResult.created_at,
        title: `Placed at ${child.assessmentResult.assigned_level.charAt(0).toUpperCase() + child.assessmentResult.assigned_level.slice(1)}`,
        description: `Scored ${child.assessmentResult.score}% on assessment`,
        icon: Award, type: 'level',
      });
    }

    // High score achievements (>90%)
    child.completions.forEach(c => {
      const scores = [c.pronunciation_score, c.fluency_score, c.clarity_score, c.confidence_score].filter((v): v is number => v !== null);
      const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
      if (avg >= 90) {
        ms.push({
          date: c.completed_at,
          title: 'Outstanding Performance! ⭐',
          description: `Scored ${Math.round(avg)}% average on a lesson`,
          icon: Star, type: 'score',
        });
      }
    });

    // XP level milestones
    if (child.xp) {
      const xpMilestones = [5, 10, 20, 50];
      xpMilestones.forEach(level => {
        if (child.xp!.xp_level >= level) {
          ms.push({
            date: new Date().toISOString(), // approximate
            title: `Reached Level ${level}! 🚀`,
            description: `XP Level ${level} achieved`,
            icon: Zap, type: 'level',
          });
        }
      });
    }

    // Deduplicate high scores - keep only first 3
    const scoreMs = ms.filter(m => m.type === 'score').slice(0, 3);
    const otherMs = ms.filter(m => m.type !== 'score');

    return [...otherMs, ...scoreMs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [child]);

  if (!child || milestones.length === 0) {
    return (
      <Card><CardContent className="p-8 text-center text-muted-foreground">
        <GitBranch className="h-12 w-12 mx-auto mb-3 opacity-40" />
        <p>No milestones yet. Start learning to build your timeline!</p>
      </CardContent></Card>
    );
  }

  const typeColors: Record<string, string> = {
    achievement: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
    level: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    streak: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
    lesson: 'bg-green-500/10 text-green-600 border-green-500/20',
    score: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <GitBranch className="h-6 w-6 text-primary" />
        <h2 className="text-xl font-bold">Growth Timeline</h2>
        <Badge variant="secondary">{milestones.length} milestones</Badge>
      </div>

      <div className="relative">
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />
        <div className="space-y-4">
          {milestones.map((m, i) => (
            <div key={i} className="relative flex gap-4 pl-2">
              <div className={`z-10 w-9 h-9 rounded-full flex items-center justify-center shrink-0 border ${typeColors[m.type]}`}>
                <m.icon className="h-4 w-4" />
              </div>
              <Card className="flex-1">
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-sm">{m.title}</p>
                      <p className="text-xs text-muted-foreground">{m.description}</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {new Date(m.date).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

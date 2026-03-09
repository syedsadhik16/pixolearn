import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ChildData } from '@/pages/ParentDashboard';
import { Wand2, Mic, BookOpen, PenLine, MessageSquare, CheckCircle2 } from 'lucide-react';

interface PlanItem {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  duration: string;
  icon: typeof Mic;
  skill: string;
}

interface Props { child: ChildData | null; }

export function SmartPracticePlan({ child }: Props) {
  const plan = useMemo((): PlanItem[] => {
    if (!child || child.completions.length === 0) return [];

    const recent = child.completions.slice(0, 10);
    const avg = (key: 'pronunciation_score' | 'fluency_score' | 'clarity_score' | 'confidence_score') => {
      const vals = recent.map(c => c[key]).filter((v): v is number => v !== null);
      return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 50;
    };

    const skills = [
      { name: 'Pronunciation', score: avg('pronunciation_score'), icon: Mic, activity: 'Speaking Practice', desc: 'Read aloud exercises focusing on clear pronunciation' },
      { name: 'Fluency', score: avg('fluency_score'), icon: MessageSquare, activity: 'Conversation Practice', desc: 'Practice natural sentence flow and speaking speed' },
      { name: 'Clarity', score: avg('clarity_score'), icon: BookOpen, activity: 'Vocabulary Building', desc: 'Learn new words and use them in sentences' },
      { name: 'Confidence', score: avg('confidence_score'), icon: PenLine, activity: 'Creative Writing', desc: 'Express ideas through writing prompts' },
    ];

    return skills
      .sort((a, b) => a.score - b.score)
      .map((s, i) => ({
        title: s.activity,
        description: s.desc,
        priority: i === 0 ? 'high' as const : i === 1 ? 'medium' as const : 'low' as const,
        duration: i === 0 ? '15 min' : i === 1 ? '10 min' : '5 min',
        icon: s.icon,
        skill: `${s.name}: ${s.score}%`,
      }));
  }, [child]);

  if (plan.length === 0) {
    return (
      <Card><CardContent className="p-8 text-center text-muted-foreground">
        <Wand2 className="h-12 w-12 mx-auto mb-3 opacity-40" />
        <p>Complete some lessons first to get a personalized practice plan!</p>
      </CardContent></Card>
    );
  }

  const priorityStyles = {
    high: 'border-red-500/30 bg-red-500/5',
    medium: 'border-yellow-500/30 bg-yellow-500/5',
    low: 'border-green-500/30 bg-green-500/5',
  };
  const priorityBadge = {
    high: 'destructive' as const,
    medium: 'secondary' as const,
    low: 'outline' as const,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Wand2 className="h-6 w-6 text-primary" />
        <h2 className="text-xl font-bold">Smart Practice Plan</h2>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm">Today's Recommended Plan</CardTitle></CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground mb-4">
            Based on {child?.profile.full_name || 'your child'}'s weakest areas, here's the optimal practice order:
          </div>
          <div className="space-y-3">
            {plan.map((item, i) => (
              <div key={i} className={`p-4 rounded-lg border ${priorityStyles[item.priority]} flex items-start gap-3`}>
                <div className="w-8 h-8 rounded-full bg-background flex items-center justify-center border shrink-0">
                  <item.icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{item.title}</span>
                    <Badge variant={priorityBadge[item.priority]} className="text-[10px]">{item.priority}</Badge>
                    <span className="text-xs text-muted-foreground ml-auto">{item.duration}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                  <p className="text-xs mt-1 font-medium">{item.skill}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/10 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
            <span className="text-xs text-muted-foreground">
              Total estimated time: {plan.reduce((s, p) => s + parseInt(p.duration), 0)} minutes
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

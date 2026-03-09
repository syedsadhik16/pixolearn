import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ChildData } from '@/pages/ParentDashboard';
import { Eye, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

interface Props { child: ChildData | null; }

export function FocusAttentionScore({ child }: Props) {
  const analysis = useMemo(() => {
    if (!child) return null;

    const sessions = child.learningSessions;
    const completions = child.completions;

    // Session completion rate
    const completedSessions = sessions.filter(s => (s.duration_seconds || 0) > 60).length;
    const completionRate = sessions.length > 0 ? Math.round((completedSessions / sessions.length) * 100) : 0;

    // Average session duration
    const avgDuration = sessions.length > 0
      ? Math.round(sessions.reduce((s, ses) => s + (ses.duration_seconds || 0), 0) / sessions.length / 60)
      : 0;

    // Accuracy score from completions
    const scores = completions.flatMap(c => [c.pronunciation_score, c.fluency_score, c.clarity_score, c.confidence_score].filter((v): v is number => v !== null));
    const avgAccuracy = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

    // Detect attention drops: sessions < 2 min with low scores
    const shortSessions = sessions.filter(s => (s.duration_seconds || 0) < 120).length;
    const dropRate = sessions.length > 0 ? Math.round((shortSessions / sessions.length) * 100) : 0;

    // Focus score composite
    const focusScore = Math.min(100, Math.round(
      (completionRate * 0.3) + (avgAccuracy * 0.4) + ((100 - dropRate) * 0.3)
    ));

    // Determine level
    const level = focusScore >= 80 ? 'Excellent' : focusScore >= 60 ? 'Good' : focusScore >= 40 ? 'Needs Improvement' : 'Low';
    const levelColor = focusScore >= 80 ? 'text-green-500' : focusScore >= 60 ? 'text-yellow-500' : 'text-red-500';

    return { focusScore, completionRate, avgDuration, avgAccuracy, dropRate, level, levelColor, totalSessions: sessions.length };
  }, [child]);

  if (!analysis || analysis.totalSessions === 0) {
    return (
      <Card><CardContent className="p-8 text-center text-muted-foreground">
        <Eye className="h-12 w-12 mx-auto mb-3 opacity-40" />
        <p>No session data available yet. Start learning to track focus!</p>
      </CardContent></Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Eye className="h-6 w-6 text-primary" />
        <h2 className="text-xl font-bold">Focus & Attention Score</h2>
      </div>

      <Card className="border-2 border-primary/20">
        <CardContent className="p-6 text-center">
          <div className="relative w-32 h-32 mx-auto mb-4">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
              <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--primary))" strokeWidth="8"
                strokeDasharray={`${analysis.focusScore * 2.64} 264`} strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold">{analysis.focusScore}</span>
              <span className="text-xs text-muted-foreground">/100</span>
            </div>
          </div>
          <div className={`text-lg font-semibold ${analysis.levelColor}`}>{analysis.level}</div>
          <p className="text-sm text-muted-foreground mt-1">Concentration Score</p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" /> Session Completion
          </CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analysis.completionRate}%</div>
            <Progress value={analysis.completionRate} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">Sessions completed vs started</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-500" /> Avg Session Length
          </CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analysis.avgDuration} min</div>
            <p className="text-xs text-muted-foreground mt-1">Average time per session</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2">
            <Eye className="h-4 w-4 text-purple-500" /> Accuracy Score
          </CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analysis.avgAccuracy}%</div>
            <Progress value={analysis.avgAccuracy} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">Average across all skills</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-orange-500" /> Attention Drops
          </CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analysis.dropRate}%</div>
            <Progress value={analysis.dropRate} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">Short sessions (&lt;2 min)</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

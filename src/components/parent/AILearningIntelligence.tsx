import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ChildData } from '@/pages/ParentDashboard';
import { Brain, TrendingUp, TrendingDown, Minus, Lightbulb, Target } from 'lucide-react';
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ResponsiveContainer,
} from 'recharts';

interface Props { child: ChildData | null; }

export function AILearningIntelligence({ child }: Props) {
  const analysis = useMemo(() => {
    if (!child || child.completions.length === 0) return null;

    const recent = child.completions.slice(0, 20);
    const older = child.completions.slice(20, 40);

    const avg = (arr: typeof recent, key: keyof typeof recent[0]) => {
      const vals = arr.map(c => c[key] as number | null).filter((v): v is number => v !== null);
      return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
    };

    const skills = [
      { skill: 'Pronunciation', current: avg(recent, 'pronunciation_score'), previous: avg(older, 'pronunciation_score') },
      { skill: 'Fluency', current: avg(recent, 'fluency_score'), previous: avg(older, 'fluency_score') },
      { skill: 'Clarity', current: avg(recent, 'clarity_score'), previous: avg(older, 'clarity_score') },
      { skill: 'Confidence', current: avg(recent, 'confidence_score'), previous: avg(older, 'confidence_score') },
    ];

    const strongest = [...skills].sort((a, b) => b.current - a.current)[0];
    const weakest = [...skills].sort((a, b) => a.current - b.current)[0];
    const overallCurrent = Math.round(skills.reduce((s, sk) => s + sk.current, 0) / skills.length);
    const overallPrevious = Math.round(skills.reduce((s, sk) => s + sk.previous, 0) / skills.length);
    const trend = overallCurrent - overallPrevious;

    // Predict next week
    const predictedScore = Math.min(100, overallCurrent + Math.round(trend * 0.6));

    return { skills, strongest, weakest, overallCurrent, trend, predictedScore };
  }, [child]);

  if (!analysis) {
    return (
      <Card><CardContent className="p-8 text-center text-muted-foreground">
        <Brain className="h-12 w-12 mx-auto mb-3 opacity-40" />
        <p>Not enough data for AI analysis yet. Complete more lessons!</p>
      </CardContent></Card>
    );
  }

  const radarData = analysis.skills.map(s => ({ skill: s.skill, score: s.current, fullMark: 100 }));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Brain className="h-6 w-6 text-primary" />
        <h2 className="text-xl font-bold">AI Learning Intelligence</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Overall Score</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{analysis.overallCurrent}%</div>
            <div className="flex items-center gap-1 mt-1">
              {analysis.trend > 0 ? <TrendingUp className="h-4 w-4 text-green-500" /> :
               analysis.trend < 0 ? <TrendingDown className="h-4 w-4 text-red-500" /> :
               <Minus className="h-4 w-4 text-muted-foreground" />}
              <span className={`text-sm ${analysis.trend > 0 ? 'text-green-500' : analysis.trend < 0 ? 'text-red-500' : 'text-muted-foreground'}`}>
                {analysis.trend > 0 ? '+' : ''}{analysis.trend}% vs previous
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Strongest Skill</CardTitle></CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">{analysis.strongest.skill}</div>
            <Progress value={analysis.strongest.current} className="mt-2" />
            <span className="text-sm text-muted-foreground">{analysis.strongest.current}%</span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Needs Focus</CardTitle></CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">{analysis.weakest.skill}</div>
            <Progress value={analysis.weakest.current} className="mt-2" />
            <span className="text-sm text-muted-foreground">{analysis.weakest.current}%</span>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm">Skill Profile</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis dataKey="skill" className="text-xs" />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
                <Radar name="Score" dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Lightbulb className="h-4 w-4" /> AI Predictions</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
              <div className="flex items-center gap-2 mb-1">
                <Target className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Predicted Next Week</span>
              </div>
              <div className="text-2xl font-bold">{analysis.predictedScore}%</div>
              <p className="text-xs text-muted-foreground mt-1">Based on current learning trajectory</p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Recommendations</p>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>• Focus more on <strong>{analysis.weakest.skill}</strong> exercises</p>
                <p>• Maintain strong <strong>{analysis.strongest.skill}</strong> performance</p>
                {analysis.trend < 0 && <p>• Increase daily practice to reverse declining trend</p>}
                {child && child.streak < 3 && <p>• Build a consistent daily streak for better results</p>}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

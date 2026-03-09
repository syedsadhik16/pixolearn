import { useMemo } from 'react';
import { ChildData } from '@/pages/ParentDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { format, subDays } from 'date-fns';
import { FileText, TrendingUp, Star, AlertTriangle, Lightbulb } from 'lucide-react';

interface Props { child: ChildData | null; }

export function WeeklyParentReport({ child }: Props) {
  if (!child) return <p className="text-muted-foreground">Select a child to view the weekly report.</p>;

  const getAvg = (scores: (number | null)[]) => {
    const valid = scores.filter((s): s is number => s !== null);
    return valid.length ? Math.round(valid.reduce((a, b) => a + b, 0) / valid.length) : 0;
  };

  // Last 7 days data
  const weekData = useMemo(() => {
    const days: { date: string; lessons: number; score: number; attended: boolean }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = format(subDays(new Date(), i), 'yyyy-MM-dd');
      const dayCompletions = child.completions.filter(c => format(new Date(c.completed_at), 'yyyy-MM-dd') === d);
      const scores = dayCompletions.flatMap(c => [c.pronunciation_score, c.fluency_score, c.clarity_score, c.confidence_score]);
      const attendance = child.attendance.find(a => a.date === d);
      days.push({
        date: format(new Date(d), 'EEE'),
        lessons: dayCompletions.length,
        score: getAvg(scores),
        attended: attendance?.lesson_completed ?? false,
      });
    }
    return days;
  }, [child]);

  const weekLessons = weekData.reduce((s, d) => s + d.lessons, 0);
  const weekAttendance = weekData.filter(d => d.attended).length;
  const weekAvgScore = getAvg(weekData.map(d => d.score > 0 ? d.score : null));

  // Strengths and weaknesses
  const recent = child.completions.slice(0, 10);
  const skills = [
    { name: 'Pronunciation', score: getAvg(recent.map(c => c.pronunciation_score)) },
    { name: 'Fluency', score: getAvg(recent.map(c => c.fluency_score)) },
    { name: 'Clarity', score: getAvg(recent.map(c => c.clarity_score)) },
    { name: 'Confidence', score: getAvg(recent.map(c => c.confidence_score)) },
  ].sort((a, b) => b.score - a.score);

  const strengths = skills.filter(s => s.score >= 65);
  const weakAreas = skills.filter(s => s.score < 65);

  // Suggested activities
  const activities: string[] = [];
  if (weakAreas.some(w => w.name === 'Pronunciation')) activities.push('Practice the Read Aloud section in daily lessons');
  if (weakAreas.some(w => w.name === 'Fluency')) activities.push('Use AI Chat for 10 minutes of free conversation');
  if (weakAreas.some(w => w.name === 'Confidence')) activities.push('Try a new Roleplay scenario this week');
  if (child.writingSubmissions.length < 2) activities.push('Submit at least 1 creative writing piece');
  if (child.streak < 5) activities.push('Aim for a 5-day learning streak');
  if (activities.length === 0) activities.push('Keep up the great work! Explore new topics in the Studio.');

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-display font-bold">Weekly Report 📋</h2>
        <p className="text-sm text-muted-foreground">{child.profile.full_name || child.profile.email} — Last 7 days</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold">{weekLessons}</p>
            <p className="text-xs text-muted-foreground">Lessons Completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold">{weekAttendance}/7</p>
            <p className="text-xs text-muted-foreground">Days Active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold">{weekAvgScore}%</p>
            <p className="text-xs text-muted-foreground">Avg Score</p>
          </CardContent>
        </Card>
      </div>

      {/* Daily Breakdown Chart */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2"><FileText className="h-5 w-5 text-primary" />Daily Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={weekData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '0.5rem', fontSize: '0.8rem' }} />
              <Bar dataKey="lessons" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Lessons" />
              <Bar dataKey="score" fill="hsl(var(--pixo-green))" radius={[4, 4, 0, 0]} name="Score" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Strengths */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><Star className="h-4 w-4 text-pixo-yellow" />Strengths</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {strengths.length > 0 ? strengths.map(s => (
              <div key={s.name} className="flex items-center justify-between text-sm">
                <span>{s.name}</span>
                <span className="font-bold text-pixo-green">{s.score}%</span>
              </div>
            )) : <p className="text-sm text-muted-foreground">Building skills through practice!</p>}
          </CardContent>
        </Card>

        {/* Weak Areas */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-pixo-orange" />Areas to Improve</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {weakAreas.length > 0 ? weakAreas.map(s => (
              <div key={s.name} className="flex items-center justify-between text-sm">
                <span>{s.name}</span>
                <span className="font-bold text-pixo-orange">{s.score}%</span>
              </div>
            )) : <p className="text-sm text-muted-foreground">All skills on track! 🌟</p>}
          </CardContent>
        </Card>
      </div>

      {/* Suggested Activities */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2"><Lightbulb className="h-4 w-4 text-primary" />Suggested Activities</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {activities.map((a, i) => (
            <div key={i} className="flex items-start gap-2 text-sm">
              <span className="text-primary font-bold">{i + 1}.</span>
              <span>{a}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

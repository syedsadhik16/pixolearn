import { useMemo, useState } from 'react';
import { ChildData } from '@/pages/ParentDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, AreaChart, Area } from 'recharts';
import { format, subDays, subMonths, startOfWeek, startOfMonth, isAfter, parseISO } from 'date-fns';
import { TrendingUp, TrendingDown, Award, Target, BookOpen, Pencil } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface Props { child: ChildData | null; }

const getAvg = (scores: (number | null)[]) => {
  const valid = scores.filter((s): s is number => s !== null);
  return valid.length ? Math.round(valid.reduce((a, b) => a + b, 0) / valid.length) : 0;
};

export function PerformanceAnalytics({ child }: Props) {
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');

  // Daily data: last 14 days
  const dailyData = useMemo(() => {
    if (!child) return [];
    const days: { date: string; score: number; lessons: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = format(subDays(new Date(), i), 'yyyy-MM-dd');
      const dayCompletions = child.completions.filter(c => format(new Date(c.completed_at), 'yyyy-MM-dd') === d);
      const scores = dayCompletions.flatMap(c => [c.pronunciation_score, c.fluency_score, c.clarity_score, c.confidence_score]);
      days.push({ date: format(new Date(d), 'MMM d'), score: getAvg(scores), lessons: dayCompletions.length });
    }
    return days;
  }, [child]);

  // Weekly data: last 8 weeks
  const weeklyData = useMemo(() => {
    if (!child) return [];
    const weeks: { date: string; score: number; lessons: number }[] = [];
    for (let i = 7; i >= 0; i--) {
      const weekStart = startOfWeek(subDays(new Date(), i * 7));
      const weekEnd = subDays(new Date(), (i - 1) * 7);
      const weekCompletions = child.completions.filter(c => {
        const d = new Date(c.completed_at);
        return d >= weekStart && d < weekEnd;
      });
      const scores = weekCompletions.flatMap(c => [c.pronunciation_score, c.fluency_score, c.clarity_score, c.confidence_score]);
      weeks.push({ date: format(weekStart, 'MMM d'), score: getAvg(scores), lessons: weekCompletions.length });
    }
    return weeks;
  }, [child]);

  // Monthly data: last 6 months
  const monthlyData = useMemo(() => {
    if (!child) return [];
    const months: { date: string; score: number; lessons: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(new Date(), i));
      const monthEnd = startOfMonth(subMonths(new Date(), i - 1));
      const monthCompletions = child.completions.filter(c => {
        const d = new Date(c.completed_at);
        return d >= monthStart && d < monthEnd;
      });
      const scores = monthCompletions.flatMap(c => [c.pronunciation_score, c.fluency_score, c.clarity_score, c.confidence_score]);
      months.push({ date: format(monthStart, 'MMM yyyy'), score: getAvg(scores), lessons: monthCompletions.length });
    }
    return months;
  }, [child]);

  // Score trend line chart
  const trendData = useMemo(() => {
    if (!child) return [];
    return [...child.completions].reverse().map(c => ({
      date: format(new Date(c.completed_at), 'MMM d'),
      Pronunciation: c.pronunciation_score ?? 0,
      Fluency: c.fluency_score ?? 0,
      Clarity: c.clarity_score ?? 0,
      Confidence: c.confidence_score ?? 0,
    }));
  }, [child]);

  if (!child) return <p className="text-muted-foreground">Select a child to view performance.</p>;

  const getAvgFn = getAvg;
    const valid = scores.filter((s): s is number => s !== null);
    return valid.length ? Math.round(valid.reduce((a, b) => a + b, 0) / valid.length) : 0;
  };

  // Daily data: last 14 days
  const dailyData = useMemo(() => {
    const days: { date: string; score: number; lessons: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = format(subDays(new Date(), i), 'yyyy-MM-dd');
      const dayCompletions = child.completions.filter(c => format(new Date(c.completed_at), 'yyyy-MM-dd') === d);
      const scores = dayCompletions.flatMap(c => [c.pronunciation_score, c.fluency_score, c.clarity_score, c.confidence_score]);
      days.push({ date: format(new Date(d), 'MMM d'), score: getAvg(scores), lessons: dayCompletions.length });
    }
    return days;
  }, [child]);

  // Weekly data: last 8 weeks
  const weeklyData = useMemo(() => {
    const weeks: { date: string; score: number; lessons: number }[] = [];
    for (let i = 7; i >= 0; i--) {
      const weekStart = startOfWeek(subDays(new Date(), i * 7));
      const weekEnd = subDays(new Date(), (i - 1) * 7);
      const weekCompletions = child.completions.filter(c => {
        const d = new Date(c.completed_at);
        return d >= weekStart && d < weekEnd;
      });
      const scores = weekCompletions.flatMap(c => [c.pronunciation_score, c.fluency_score, c.clarity_score, c.confidence_score]);
      weeks.push({ date: format(weekStart, 'MMM d'), score: getAvg(scores), lessons: weekCompletions.length });
    }
    return weeks;
  }, [child]);

  // Monthly data: last 6 months
  const monthlyData = useMemo(() => {
    const months: { date: string; score: number; lessons: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(new Date(), i));
      const monthEnd = startOfMonth(subMonths(new Date(), i - 1));
      const monthCompletions = child.completions.filter(c => {
        const d = new Date(c.completed_at);
        return d >= monthStart && d < monthEnd;
      });
      const scores = monthCompletions.flatMap(c => [c.pronunciation_score, c.fluency_score, c.clarity_score, c.confidence_score]);
      months.push({ date: format(monthStart, 'MMM yyyy'), score: getAvg(scores), lessons: monthCompletions.length });
    }
    return months;
  }, [child]);

  const chartData = period === 'daily' ? dailyData : period === 'weekly' ? weeklyData : monthlyData;

  // Score trend line chart
  const trendData = useMemo(() => {
    return [...child.completions].reverse().map(c => ({
      date: format(new Date(c.completed_at), 'MMM d'),
      Pronunciation: c.pronunciation_score ?? 0,
      Fluency: c.fluency_score ?? 0,
      Clarity: c.clarity_score ?? 0,
      Confidence: c.confidence_score ?? 0,
    }));
  }, [child]);

  // Growth Journey
  const initialLevel = child.assessmentResult?.assigned_level || 'beginner';
  const currentLevel = child.progress?.current_level || 'beginner';
  const levelOrder = { beginner: 1, intermediate: 2, advanced: 3 };
  const initialScore = child.assessmentResult?.score ?? 0;
  const currentAvg = getAvg(child.completions.slice(0, 5).flatMap(c => [c.pronunciation_score, c.fluency_score, c.clarity_score, c.confidence_score]));
  const improvement = initialScore > 0 ? Math.round(((currentAvg - initialScore) / initialScore) * 100) : 0;

  // Skill breakdown
  const recentCompletions = child.completions.slice(0, 10);
  const skills = [
    { name: 'Pronunciation', score: getAvg(recentCompletions.map(c => c.pronunciation_score)), color: 'bg-pixo-orange' },
    { name: 'Fluency', score: getAvg(recentCompletions.map(c => c.fluency_score)), color: 'bg-pixo-blue' },
    { name: 'Clarity', score: getAvg(recentCompletions.map(c => c.clarity_score)), color: 'bg-pixo-green' },
    { name: 'Confidence', score: getAvg(recentCompletions.map(c => c.confidence_score)), color: 'bg-pixo-purple' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-display font-bold">Performance Analytics 📊</h2>
        <p className="text-sm text-muted-foreground">{child.profile.full_name || child.profile.email}'s learning performance</p>
      </div>

      {/* Growth Journey */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2"><Award className="h-5 w-5 text-primary" />Growth Journey</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">Started At</p>
              <p className="text-lg font-bold capitalize">{initialLevel}</p>
              <p className="text-xs text-muted-foreground">{initialScore > 0 ? `${initialScore}%` : 'N/A'}</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-primary/10">
              <p className="text-xs text-muted-foreground">Current Level</p>
              <p className="text-lg font-bold capitalize text-primary">{currentLevel}</p>
              <p className="text-xs text-muted-foreground">{currentAvg}% avg</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">Improvement</p>
              <div className="flex items-center justify-center gap-1">
                {improvement >= 0 ? <TrendingUp className="h-4 w-4 text-pixo-green" /> : <TrendingDown className="h-4 w-4 text-destructive" />}
                <p className={`text-lg font-bold ${improvement >= 0 ? 'text-pixo-green' : 'text-destructive'}`}>{improvement > 0 ? '+' : ''}{improvement}%</p>
              </div>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">Day Progress</p>
              <p className="text-lg font-bold">{child.progress?.current_day ?? 1}/180</p>
              <Progress value={((child.progress?.current_day ?? 1) / 180) * 100} className="h-1.5 mt-1" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Skill Breakdown */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2"><Target className="h-5 w-5 text-primary" />Skills Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {skills.map(skill => (
            <div key={skill.name} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>{skill.name}</span>
                <span className="font-bold">{skill.score}%</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className={`h-full rounded-full ${skill.color} transition-all`} style={{ width: `${skill.score}%` }} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Progress Chart */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2"><BookOpen className="h-5 w-5 text-primary" />Progress Chart</CardTitle>
            <Tabs value={period} onValueChange={v => setPeriod(v as any)}>
              <TabsList className="h-8">
                <TabsTrigger value="daily" className="text-xs px-2 h-6">Daily</TabsTrigger>
                <TabsTrigger value="weekly" className="text-xs px-2 h-6">Weekly</TabsTrigger>
                <TabsTrigger value="monthly" className="text-xs px-2 h-6">Monthly</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '0.5rem', fontSize: '0.8rem' }} />
              <Legend />
              <Bar dataKey="score" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Avg Score" />
              <Bar dataKey="lessons" fill="hsl(var(--pixo-orange))" radius={[4, 4, 0, 0]} name="Lessons" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Score Trend Over Time */}
      {trendData.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2"><TrendingUp className="h-5 w-5 text-primary" />Score Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '0.5rem', fontSize: '0.8rem' }} />
                <Legend />
                <Line type="monotone" dataKey="Pronunciation" stroke="hsl(var(--pixo-orange))" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Fluency" stroke="hsl(var(--pixo-blue))" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Clarity" stroke="hsl(var(--pixo-green))" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Confidence" stroke="hsl(var(--pixo-purple))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Engagement Stats */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2"><Pencil className="h-5 w-5 text-primary" />Engagement Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold">{child.completions.length}</p>
              <p className="text-xs text-muted-foreground">Lessons Done</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold">{child.writingSubmissions.length}</p>
              <p className="text-xs text-muted-foreground">Writings</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold">{currentAvg}%</p>
              <p className="text-xs text-muted-foreground">Accuracy</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold">{child.streak}</p>
              <p className="text-xs text-muted-foreground">Streak Days</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

import { useMemo } from 'react';
import { ChildData } from '@/pages/ParentDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { format, subDays, startOfWeek, subMonths, startOfMonth } from 'date-fns';
import { Clock, TrendingUp, Lightbulb, Calendar } from 'lucide-react';

interface Props { child: ChildData | null; }

export function TimeAnalytics({ child }: Props) {
  if (!child) return <p className="text-muted-foreground">Select a child to view time analytics.</p>;

  // Calculate from learning sessions and lesson completions
  // If no learning sessions, estimate from completions (avg 10 min per lesson)
  const sessions = child.learningSessions;
  const hasSessionData = sessions.length > 0;

  const totalSeconds = hasSessionData
    ? sessions.reduce((s, sess) => s + (sess.duration_seconds || 0), 0)
    : child.completions.length * 600; // 10 min estimate per lesson

  const totalMinutes = Math.round(totalSeconds / 60);
  const totalHours = Math.round(totalMinutes / 60 * 10) / 10;

  // Daily usage last 14 days
  const dailyData = useMemo(() => {
    const days: { date: string; minutes: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = format(subDays(new Date(), i), 'yyyy-MM-dd');
      if (hasSessionData) {
        const dayMinutes = sessions
          .filter(s => format(new Date(s.started_at), 'yyyy-MM-dd') === d)
          .reduce((sum, s) => sum + Math.round((s.duration_seconds || 0) / 60), 0);
        days.push({ date: format(new Date(d), 'MMM d'), minutes: dayMinutes });
      } else {
        const dayLessons = child.completions.filter(c => format(new Date(c.completed_at), 'yyyy-MM-dd') === d).length;
        days.push({ date: format(new Date(d), 'MMM d'), minutes: dayLessons * 10 });
      }
    }
    return days;
  }, [child, sessions, hasSessionData]);

  // Weekly averages last 8 weeks
  const weeklyData = useMemo(() => {
    const weeks: { date: string; avgMinutes: number }[] = [];
    for (let i = 7; i >= 0; i--) {
      const weekStart = startOfWeek(subDays(new Date(), i * 7));
      const weekEnd = subDays(new Date(), (i - 1) * 7);
      let totalMin = 0;
      if (hasSessionData) {
        totalMin = sessions
          .filter(s => { const d = new Date(s.started_at); return d >= weekStart && d < weekEnd; })
          .reduce((sum, s) => sum + Math.round((s.duration_seconds || 0) / 60), 0);
      } else {
        const lessons = child.completions.filter(c => { const d = new Date(c.completed_at); return d >= weekStart && d < weekEnd; }).length;
        totalMin = lessons * 10;
      }
      weeks.push({ date: format(weekStart, 'MMM d'), avgMinutes: Math.round(totalMin / 7) });
    }
    return weeks;
  }, [child, sessions, hasSessionData]);

  // Monthly totals last 6 months
  const monthlyData = useMemo(() => {
    const months: { date: string; hours: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(new Date(), i));
      const monthEnd = startOfMonth(subMonths(new Date(), i - 1));
      let totalMin = 0;
      if (hasSessionData) {
        totalMin = sessions
          .filter(s => { const d = new Date(s.started_at); return d >= monthStart && d < monthEnd; })
          .reduce((sum, s) => sum + Math.round((s.duration_seconds || 0) / 60), 0);
      } else {
        const lessons = child.completions.filter(c => { const d = new Date(c.completed_at); return d >= monthStart && d < monthEnd; }).length;
        totalMin = lessons * 10;
      }
      months.push({ date: format(monthStart, 'MMM'), hours: Math.round(totalMin / 60 * 10) / 10 });
    }
    return months;
  }, [child, sessions, hasSessionData]);

  // Daily average
  const activeDays = dailyData.filter(d => d.minutes > 0).length;
  const dailyAvg = activeDays > 0 ? Math.round(dailyData.reduce((s, d) => s + d.minutes, 0) / activeDays) : 0;

  // Weekly average
  const weeklyAvg = weeklyData.length > 0 ? Math.round(weeklyData.reduce((s, w) => s + w.avgMinutes, 0) / weeklyData.length) : 0;

  // Recommendation
  const getRecommendation = () => {
    if (dailyAvg === 0) return "Your child hasn't been active recently. Encourage them to start a daily learning habit!";
    if (dailyAvg < 15) return `Your child spends about ${dailyAvg} minutes per day. For better results, try adding 15 extra minutes of daily practice.`;
    if (dailyAvg < 30) return `Good job! ${dailyAvg} minutes per day is solid. Aim for 30 minutes for optimal learning.`;
    return `Excellent! ${dailyAvg} minutes per day is great. Consistency is key — keep it going! 🌟`;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-display font-bold">Time Analytics ⏱️</h2>
        <p className="text-sm text-muted-foreground">{child.profile.full_name || child.profile.email}'s learning time</p>
        {!hasSessionData && (
          <p className="text-xs text-pixo-orange mt-1">📊 Time estimates based on lesson completions (~10 min each)</p>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="h-5 w-5 text-primary mx-auto mb-1" />
            <p className="text-2xl font-bold">{dailyAvg}m</p>
            <p className="text-xs text-muted-foreground">Daily Avg</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Calendar className="h-5 w-5 text-pixo-blue mx-auto mb-1" />
            <p className="text-2xl font-bold">{weeklyAvg}m</p>
            <p className="text-xs text-muted-foreground">Weekly Avg/Day</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-5 w-5 text-pixo-green mx-auto mb-1" />
            <p className="text-2xl font-bold">{activeDays}</p>
            <p className="text-xs text-muted-foreground">Active Days (14d)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="h-5 w-5 text-pixo-purple mx-auto mb-1" />
            <p className="text-2xl font-bold">{totalHours}h</p>
            <p className="text-xs text-muted-foreground">Total Time</p>
          </CardContent>
        </Card>
      </div>

      {/* Recommendation */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4 flex items-start gap-3">
          <Lightbulb className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-sm mb-1">Recommendation</p>
            <p className="text-sm text-muted-foreground">{getRecommendation()}</p>
          </div>
        </CardContent>
      </Card>

      {/* Daily Usage Chart */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Daily Usage (Last 14 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" unit="m" />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '0.5rem', fontSize: '0.8rem' }} />
              <Bar dataKey="minutes" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Minutes" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Weekly Average */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Weekly Average (per day)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" unit="m" />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '0.5rem', fontSize: '0.8rem' }} />
              <Area type="monotone" dataKey="avgMinutes" fill="hsl(var(--pixo-blue) / 0.2)" stroke="hsl(var(--pixo-blue))" strokeWidth={2} name="Avg Min/Day" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Monthly Hours */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Monthly Learning Hours</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" unit="h" />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '0.5rem', fontSize: '0.8rem' }} />
              <Bar dataKey="hours" fill="hsl(var(--pixo-green))" radius={[4, 4, 0, 0]} name="Hours" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

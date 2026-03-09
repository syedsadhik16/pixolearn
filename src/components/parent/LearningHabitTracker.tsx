import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChildData } from '@/pages/ParentDashboard';
import { CalendarDays, Flame, BarChart3 } from 'lucide-react';

interface Props { child: ChildData | null; }

export function LearningHabitTracker({ child }: Props) {
  const heatmapData = useMemo(() => {
    if (!child) return { days: [], weeklyTrend: [], bestDay: '', consistencyScore: 0 };

    const today = new Date();
    const days: { date: string; count: number; dayOfWeek: number }[] = [];
    const activityMap = new Map<string, number>();

    child.completions.forEach(c => {
      const d = new Date(c.completed_at).toISOString().split('T')[0];
      activityMap.set(d, (activityMap.get(d) || 0) + 1);
    });
    child.learningSessions.forEach(s => {
      const d = new Date(s.started_at).toISOString().split('T')[0];
      activityMap.set(d, (activityMap.get(d) || 0) + 1);
    });

    for (let i = 89; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      days.push({ date: key, count: activityMap.get(key) || 0, dayOfWeek: d.getDay() });
    }

    // Weekly consistency
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayCounts = [0, 0, 0, 0, 0, 0, 0];
    const dayTotals = [0, 0, 0, 0, 0, 0, 0];
    days.forEach(d => { dayTotals[d.dayOfWeek]++; if (d.count > 0) dayCounts[d.dayOfWeek]++; });
    const weeklyTrend = dayNames.map((name, i) => ({
      day: name,
      rate: dayTotals[i] > 0 ? Math.round((dayCounts[i] / dayTotals[i]) * 100) : 0,
    }));

    const bestDayIdx = dayCounts.indexOf(Math.max(...dayCounts));
    const activeDays = days.filter(d => d.count > 0).length;
    const consistencyScore = Math.round((activeDays / 90) * 100);

    return { days, weeklyTrend, bestDay: dayNames[bestDayIdx], consistencyScore };
  }, [child]);

  if (!child) return null;

  const getColor = (count: number) => {
    if (count === 0) return 'bg-muted';
    if (count === 1) return 'bg-primary/30';
    if (count <= 3) return 'bg-primary/60';
    return 'bg-primary';
  };

  // Group days into weeks (rows of 7)
  const weeks: typeof heatmapData.days[] = [];
  for (let i = 0; i < heatmapData.days.length; i += 7) {
    weeks.push(heatmapData.days.slice(i, i + 7));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <CalendarDays className="h-6 w-6 text-primary" />
        <h2 className="text-xl font-bold">Learning Habit Tracker</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Flame className="h-8 w-8 mx-auto text-orange-500 mb-2" />
            <div className="text-2xl font-bold">{child.streak}</div>
            <p className="text-sm text-muted-foreground">Current Streak</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{heatmapData.consistencyScore}%</div>
            <p className="text-sm text-muted-foreground">90-Day Consistency</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{heatmapData.bestDay}</div>
            <p className="text-sm text-muted-foreground">Best Performance Day</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm">90-Day Activity Heatmap</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-1">
            {weeks.map((week, wi) => (
              <div key={wi} className="flex gap-1">
                {week.map((day, di) => (
                  <div
                    key={di}
                    className={`w-3 h-3 rounded-sm ${getColor(day.count)}`}
                    title={`${day.date}: ${day.count} activities`}
                  />
                ))}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
            <span>Less</span>
            <div className="w-3 h-3 rounded-sm bg-muted" />
            <div className="w-3 h-3 rounded-sm bg-primary/30" />
            <div className="w-3 h-3 rounded-sm bg-primary/60" />
            <div className="w-3 h-3 rounded-sm bg-primary" />
            <span>More</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Weekly Pattern</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-end gap-2 h-32">
            {heatmapData.weeklyTrend.map(d => (
              <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full bg-primary/20 rounded-t relative" style={{ height: `${Math.max(d.rate, 4)}%` }}>
                  <div className="absolute inset-0 bg-primary rounded-t" style={{ height: '100%' }} />
                </div>
                <span className="text-[10px] text-muted-foreground">{d.day}</span>
                <span className="text-[10px] font-medium">{d.rate}%</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

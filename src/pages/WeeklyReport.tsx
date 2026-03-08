import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { BottomNav } from '@/components/layout/BottomNav';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Area, AreaChart } from 'recharts';
import { ArrowLeft, Calendar, Zap, BookOpen, Flame, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DayData {
  day: string;
  shortDay: string;
  lessons: number;
  xp: number;
  attended: boolean;
}

export default function WeeklyReport() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [weekData, setWeekData] = useState<DayData[]>([]);
  const [totals, setTotals] = useState({ lessons: 0, xp: 0, streak: 0, avgScore: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) fetchWeekData();
  }, [user]);

  const fetchWeekData = async () => {
    try {
      const today = new Date();
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 6);

      const startStr = weekAgo.toISOString().split('T')[0];
      const endStr = today.toISOString().split('T')[0];

      const [completionsRes, xpRes, attendanceRes, scoresRes] = await Promise.all([
        supabase.from('lesson_completions')
          .select('completed_at')
          .eq('student_id', user!.id)
          .gte('completed_at', weekAgo.toISOString()),
        supabase.from('xp_history')
          .select('xp_amount, created_at')
          .eq('student_id', user!.id)
          .gte('created_at', weekAgo.toISOString()),
        supabase.from('attendance')
          .select('date, is_present')
          .eq('student_id', user!.id)
          .gte('date', startStr)
          .lte('date', endStr),
        supabase.from('lesson_completions')
          .select('pronunciation_score, fluency_score, clarity_score, confidence_score')
          .eq('student_id', user!.id)
          .gte('completed_at', weekAgo.toISOString()),
      ]);

      // Build day-by-day data
      const days: DayData[] = [];
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

      for (let i = 0; i < 7; i++) {
        const d = new Date(weekAgo);
        d.setDate(d.getDate() + i);
        const dateStr = d.toISOString().split('T')[0];

        const lessonsOnDay = (completionsRes.data || []).filter(c =>
          c.completed_at.startsWith(dateStr)
        ).length;

        const xpOnDay = (xpRes.data || [])
          .filter(x => x.created_at.startsWith(dateStr))
          .reduce((sum, x) => sum + x.xp_amount, 0);

        const attended = (attendanceRes.data || []).some(a => a.date === dateStr && a.is_present);

        days.push({
          day: dateStr,
          shortDay: dayNames[d.getDay()],
          lessons: lessonsOnDay,
          xp: xpOnDay,
          attended,
        });
      }

      setWeekData(days);

      // Calculate totals
      const totalLessons = days.reduce((s, d) => s + d.lessons, 0);
      const totalXP = days.reduce((s, d) => s + d.xp, 0);
      let streak = 0;
      for (let i = days.length - 1; i >= 0; i--) {
        if (days[i].attended) streak++;
        else break;
      }

      const scores = (scoresRes.data || []).flatMap(c =>
        [c.pronunciation_score, c.fluency_score, c.clarity_score, c.confidence_score].filter((s): s is number => s !== null)
      );
      const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

      setTotals({ lessons: totalLessons, xp: totalXP, streak, avgScore });
    } catch (e) {
      console.error('Weekly report error:', e);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading report...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 pb-24 max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-display font-bold">
              <span className="gradient-text">Weekly Report</span>
            </h1>
            <p className="text-sm text-muted-foreground">Your learning progress this week</p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3 mb-6 animate-slide-up">
          {[
            { label: 'Lessons Done', value: totals.lessons, icon: BookOpen, color: 'text-primary' },
            { label: 'XP Earned', value: totals.xp, icon: Zap, color: 'text-accent' },
            { label: 'Active Streak', value: `${totals.streak}d`, icon: Flame, color: 'text-destructive' },
            { label: 'Avg Score', value: `${totals.avgScore}%`, icon: TrendingUp, color: 'text-secondary' },
          ].map((stat, i) => (
            <div key={i} className="pixo-card !p-4 text-center">
              <stat.icon className={cn("h-5 w-5 mx-auto mb-1", stat.color)} />
              <p className="text-xl font-bold">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* XP Chart */}
        <div className="pixo-card mb-4 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <h3 className="font-display font-bold mb-4 flex items-center gap-2">
            <Zap className="h-4 w-4 text-accent" />
            XP Earned Per Day
          </h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weekData}>
                <defs>
                  <linearGradient id="xpGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="shortDay" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                />
                <Area type="monotone" dataKey="xp" stroke="hsl(var(--primary))" fill="url(#xpGradient)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lessons Chart */}
        <div className="pixo-card mb-4 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <h3 className="font-display font-bold mb-4 flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-secondary" />
            Lessons Completed
          </h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="shortDay" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="lessons" fill="hsl(var(--secondary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Attendance Streak */}
        <div className="pixo-card animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <h3 className="font-display font-bold mb-4 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            Daily Attendance
          </h3>
          <div className="flex justify-between gap-2">
            {weekData.map((d, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5 flex-1">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold transition-all",
                  d.attended
                    ? "bg-secondary text-secondary-foreground"
                    : "bg-muted text-muted-foreground"
                )}>
                  {d.attended ? '✓' : '·'}
                </div>
                <span className="text-[10px] text-muted-foreground">{d.shortDay}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <BottomNav />
    </Layout>
  );
}

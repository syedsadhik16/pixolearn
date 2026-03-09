import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ChildData } from '@/pages/ParentDashboard';
import { supabase } from '@/integrations/supabase/client';
import { Users, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface Props { child: ChildData | null; }

interface BenchmarkData {
  accuracy: { child: number; platform: number };
  attendance: { child: number; platform: number };
  xp: { child: number; platform: number };
  lessonsCompleted: { child: number; platform: number };
}

export function ParentBenchmark({ child }: Props) {
  const [benchmark, setBenchmark] = useState<BenchmarkData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!child) return;
    fetchBenchmarks();
  }, [child]);

  const fetchBenchmarks = async () => {
    if (!child) return;
    try {
      const [completionsRes, attendanceRes, xpRes] = await Promise.all([
        supabase.from('lesson_completions').select('student_id, pronunciation_score, fluency_score, clarity_score, confidence_score'),
        supabase.from('attendance').select('student_id, is_present'),
        supabase.from('student_xp').select('student_id, total_xp'),
      ]);

      // Platform-wide averages
      const allCompletions = completionsRes.data || [];
      const studentScores = new Map<string, number[]>();
      allCompletions.forEach(c => {
        const scores = [c.pronunciation_score, c.fluency_score, c.clarity_score, c.confidence_score].filter((v): v is number => v !== null);
        if (scores.length > 0) {
          const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
          if (!studentScores.has(c.student_id)) studentScores.set(c.student_id, []);
          studentScores.get(c.student_id)!.push(avg);
        }
      });

      const allAvgs = Array.from(studentScores.values()).map(arr => arr.reduce((a, b) => a + b, 0) / arr.length);
      const platformAccuracy = allAvgs.length > 0 ? Math.round(allAvgs.reduce((a, b) => a + b, 0) / allAvgs.length) : 0;

      // Child accuracy
      const childScoresArr = studentScores.get(child.profile.id) || [];
      const childAccuracy = childScoresArr.length > 0 ? Math.round(childScoresArr.reduce((a, b) => a + b, 0) / childScoresArr.length) : 0;

      // Attendance
      const allAttendance = attendanceRes.data || [];
      const studentAttendance = new Map<string, { present: number; total: number }>();
      allAttendance.forEach(a => {
        if (!studentAttendance.has(a.student_id)) studentAttendance.set(a.student_id, { present: 0, total: 0 });
        const s = studentAttendance.get(a.student_id)!;
        s.total++;
        if (a.is_present) s.present++;
      });
      const attRates = Array.from(studentAttendance.values()).map(s => (s.present / s.total) * 100);
      const platformAttendance = attRates.length > 0 ? Math.round(attRates.reduce((a, b) => a + b, 0) / attRates.length) : 0;
      const childAtt = studentAttendance.get(child.profile.id);
      const childAttendance = childAtt ? Math.round((childAtt.present / childAtt.total) * 100) : 0;

      // XP
      const allXp = xpRes.data || [];
      const platformXp = allXp.length > 0 ? Math.round(allXp.reduce((s, x) => s + x.total_xp, 0) / allXp.length) : 0;
      const childXp = child.xp?.total_xp || 0;

      // Lessons
      const studentLessons = new Map<string, number>();
      allCompletions.forEach(c => studentLessons.set(c.student_id, (studentLessons.get(c.student_id) || 0) + 1));
      const lessonCounts = Array.from(studentLessons.values());
      const platformLessons = lessonCounts.length > 0 ? Math.round(lessonCounts.reduce((a, b) => a + b, 0) / lessonCounts.length) : 0;

      setBenchmark({
        accuracy: { child: childAccuracy, platform: platformAccuracy },
        attendance: { child: childAttendance, platform: platformAttendance },
        xp: { child: childXp, platform: platformXp },
        lessonsCompleted: { child: child.completions.length, platform: platformLessons },
      });
    } catch (e) {
      console.error('Benchmark fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Card><CardContent className="p-8 text-center"><div className="animate-pulse">Loading benchmarks...</div></CardContent></Card>;
  }

  if (!benchmark) return null;

  const metrics = [
    { label: 'Accuracy', ...benchmark.accuracy, unit: '%' },
    { label: 'Attendance', ...benchmark.attendance, unit: '%' },
    { label: 'Total XP', ...benchmark.xp, unit: '' },
    { label: 'Lessons Done', ...benchmark.lessonsCompleted, unit: '' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Users className="h-6 w-6 text-primary" />
        <h2 className="text-xl font-bold">Platform Comparison</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {metrics.map(m => {
          const diff = m.child - m.platform;
          const isAbove = diff > 0;
          return (
            <Card key={m.label}>
              <CardHeader className="pb-2"><CardTitle className="text-sm">{m.label}</CardTitle></CardHeader>
              <CardContent>
                <div className="flex items-end justify-between mb-3">
                  <div>
                    <span className="text-2xl font-bold">{m.child}{m.unit}</span>
                    <span className="text-sm text-muted-foreground ml-2">Your child</span>
                  </div>
                  <div className="text-right">
                    <span className="text-lg text-muted-foreground">{m.platform}{m.unit}</span>
                    <span className="text-xs text-muted-foreground block">Platform avg</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {isAbove ? <TrendingUp className="h-4 w-4 text-green-500" /> :
                   diff < 0 ? <TrendingDown className="h-4 w-4 text-red-500" /> :
                   <Minus className="h-4 w-4 text-muted-foreground" />}
                  <span className={`text-sm font-medium ${isAbove ? 'text-green-500' : diff < 0 ? 'text-red-500' : 'text-muted-foreground'}`}>
                    {isAbove ? '+' : ''}{diff}{m.unit} vs average
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { ChildData } from '@/pages/ParentDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Settings2, Clock, BookOpen, Target, Save, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Props { child: ChildData | null; parentId: string; }

export function ParentControls({ child, parentId }: Props) {
  const { toast } = useToast();
  const [dailyMinutes, setDailyMinutes] = useState(30);
  const [dailyLessons, setDailyLessons] = useState(1);
  const [dailyPractice, setDailyPractice] = useState(3);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (child) loadGoals();
  }, [child?.profile.id]);

  const loadGoals = async () => {
    if (!child) return;
    const { data } = await supabase
      .from('parent_goals')
      .select('*')
      .eq('parent_id', parentId)
      .eq('child_id', child.profile.id)
      .maybeSingle();

    if (data) {
      setDailyMinutes(data.daily_minutes_goal);
      setDailyLessons(data.daily_lessons_goal);
      setDailyPractice(data.daily_practice_goal);
      setNotes(data.notes || '');
    }
    setLoaded(true);
  };

  const saveGoals = async () => {
    if (!child) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('parent_goals')
        .upsert({
          parent_id: parentId,
          child_id: child.profile.id,
          daily_minutes_goal: dailyMinutes,
          daily_lessons_goal: dailyLessons,
          daily_practice_goal: dailyPractice,
          notes,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'parent_id,child_id' });

      if (error) throw error;
      toast({ title: 'Goals saved! ✅', description: 'Your child\'s daily goals have been updated.' });
    } catch {
      toast({ title: 'Error', description: 'Failed to save goals.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (!child) return <p className="text-muted-foreground">Select a child to manage controls.</p>;

  // Current progress toward goals today
  const todayStr = new Date().toISOString().split('T')[0];
  const todayLessons = child.completions.filter(c => c.completed_at.startsWith(todayStr)).length;
  const todaySessions = child.learningSessions.filter(s => s.started_at.startsWith(todayStr));
  const todayMinutes = todaySessions.length > 0
    ? Math.round(todaySessions.reduce((s, sess) => s + (sess.duration_seconds || 0), 0) / 60)
    : todayLessons * 10;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-display font-bold">Parent Controls ⚙️</h2>
        <p className="text-sm text-muted-foreground">Set daily learning goals for {child.profile.full_name || child.profile.email}</p>
      </div>

      {/* Today's Progress */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2"><Target className="h-5 w-5 text-primary" />Today's Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold">{todayMinutes}<span className="text-sm text-muted-foreground">/{dailyMinutes}m</span></p>
              <p className="text-xs text-muted-foreground">Learning Time</p>
              <div className="h-1.5 rounded-full bg-muted mt-2 overflow-hidden">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.min(100, (todayMinutes / dailyMinutes) * 100)}%` }} />
              </div>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold">{todayLessons}<span className="text-sm text-muted-foreground">/{dailyLessons}</span></p>
              <p className="text-xs text-muted-foreground">Lessons</p>
              <div className="h-1.5 rounded-full bg-muted mt-2 overflow-hidden">
                <div className="h-full rounded-full bg-pixo-green transition-all" style={{ width: `${Math.min(100, (todayLessons / dailyLessons) * 100)}%` }} />
              </div>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold">{child.streak}</p>
              <p className="text-xs text-muted-foreground">Streak Days</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Goal Settings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2"><Settings2 className="h-5 w-5 text-primary" />Daily Goals</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2"><Clock className="h-4 w-4" />Daily Learning Time</Label>
              <span className="font-bold text-primary">{dailyMinutes} min</span>
            </div>
            <Slider value={[dailyMinutes]} onValueChange={v => setDailyMinutes(v[0])} min={10} max={120} step={5} />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2"><BookOpen className="h-4 w-4" />Daily Lessons Goal</Label>
              <span className="font-bold text-primary">{dailyLessons} lesson{dailyLessons !== 1 ? 's' : ''}</span>
            </div>
            <Slider value={[dailyLessons]} onValueChange={v => setDailyLessons(v[0])} min={1} max={5} step={1} />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2"><Target className="h-4 w-4" />Daily Practice Sessions</Label>
              <span className="font-bold text-primary">{dailyPractice} session{dailyPractice !== 1 ? 's' : ''}</span>
            </div>
            <Slider value={[dailyPractice]} onValueChange={v => setDailyPractice(v[0])} min={1} max={10} step={1} />
          </div>

          <div className="space-y-2">
            <Label>Notes for your child</Label>
            <Input
              placeholder="e.g., Focus on pronunciation today..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>

          <Button onClick={saveGoals} disabled={saving} className="w-full">
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
            {saving ? 'Saving...' : 'Save Goals'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

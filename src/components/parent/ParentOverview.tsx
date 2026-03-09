import { useState } from 'react';
import { ChildData } from '@/pages/ParentDashboard';
import { StatCard } from '@/components/shared/StatCard';
import { StreakDisplay } from '@/components/shared/StreakDisplay';
import { ProgressRing } from '@/components/shared/ProgressRing';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Users, BookOpen, Trophy, TrendingUp, UserPlus, UserMinus, Sparkles, CheckCircle2, XCircle, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format, subDays } from 'date-fns';

interface ParentOverviewProps {
  children: ChildData[];
  selectedChild: ChildData | null;
  onRefresh: () => void;
  userId: string;
}

export function ParentOverview({ children, selectedChild, onRefresh, userId }: ParentOverviewProps) {
  const { toast } = useToast();
  const [addChildEmail, setAddChildEmail] = useState('');
  const [addingChild, setAddingChild] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [removingChildId, setRemovingChildId] = useState<string | null>(null);

  const getAvgScore = (completions: ChildData['completions']) => {
    const scores = completions.flatMap(c => [c.pronunciation_score, c.fluency_score, c.clarity_score, c.confidence_score]).filter((s): s is number => s !== null);
    return scores.length === 0 ? 0 : Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  };

  const handleAddChild = async () => {
    if (!addChildEmail.trim()) return;
    setAddingChild(true);
    try {
      const { data: childProfile } = await supabase.from('profiles').select('id, role').eq('email', addChildEmail.trim()).maybeSingle();
      if (!childProfile) { toast({ title: 'Not found', description: 'No student account found.', variant: 'destructive' }); return; }
      if (childProfile.role !== 'student') { toast({ title: 'Invalid', description: 'Not a student account.', variant: 'destructive' }); return; }
      const { error } = await supabase.from('parent_children').insert({ parent_id: userId, child_id: childProfile.id });
      if (error) {
        if (error.code === '23505') toast({ title: 'Already linked' });
        else throw error;
        return;
      }
      toast({ title: 'Success', description: 'Child linked!' });
      setAddChildEmail(''); setDialogOpen(false); onRefresh();
    } catch { toast({ title: 'Error', description: 'Failed to link child', variant: 'destructive' }); }
    finally { setAddingChild(false); }
  };

  const handleRemoveChild = async (childId: string) => {
    setRemovingChildId(childId);
    try {
      await supabase.from('parent_children').delete().eq('parent_id', userId).eq('child_id', childId);
      toast({ title: 'Removed' }); onRefresh();
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setRemovingChildId(null); }
  };

  const totalChildren = children.length;
  const totalCompletions = children.reduce((s, c) => s + c.completions.length, 0);
  const overallAvgScore = totalChildren > 0 ? Math.round(children.reduce((s, c) => s + getAvgScore(c.completions), 0) / totalChildren) : 0;
  const bestStreak = totalChildren > 0 ? Math.max(...children.map(c => c.streak)) : 0;

  if (children.length === 0) {
    return (
      <div className="text-center py-20">
        <Users className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
        <h3 className="text-xl font-display font-bold mb-2">No Children Linked Yet</h3>
        <p className="text-muted-foreground mb-6">Link your child's student account to start tracking their progress.</p>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="default"><UserPlus className="h-5 w-5 mr-2" />Add Your First Child</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Link a Child Account</DialogTitle></DialogHeader>
            <p className="text-sm text-muted-foreground mb-4">Enter the email of your child's student account.</p>
            <Input placeholder="child@example.com" value={addChildEmail} onChange={e => setAddChildEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddChild()} />
            <Button onClick={handleAddChild} disabled={addingChild} className="mt-2">{addingChild ? 'Linking...' : 'Link Child'}</Button>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  const getLast7DaysAttendance = (attendance: ChildData['attendance']) => {
    const days: { date: string; present: boolean }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = format(subDays(new Date(), i), 'yyyy-MM-dd');
      const record = attendance.find(a => a.date === d);
      days.push({ date: d, present: record?.lesson_completed ?? false });
    }
    return days;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl md:text-3xl font-display font-bold">Welcome Back 👨‍👩‍👧‍👦</h2>
          <p className="text-muted-foreground text-sm">Here's how your children are doing today.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><UserPlus className="h-4 w-4 mr-1.5" />Add Child</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Link a Child Account</DialogTitle></DialogHeader>
            <Input placeholder="child@example.com" value={addChildEmail} onChange={e => setAddChildEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddChild()} />
            <Button onClick={handleAddChild} disabled={addingChild} className="mt-2">{addingChild ? 'Linking...' : 'Link Child'}</Button>
          </DialogContent>
        </Dialog>
      </div>

      {/* Aggregate Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Children" value={totalChildren} icon={Users} colorClass="bg-primary/10 text-primary" />
        <StatCard title="Lessons Done" value={totalCompletions} icon={BookOpen} colorClass="bg-pixo-orange/10 text-pixo-orange" />
        <StatCard title="Avg Score" value={`${overallAvgScore}%`} icon={TrendingUp} colorClass="bg-pixo-green/10 text-pixo-green" />
        <StatCard title="Best Streak" value={`${bestStreak}d`} icon={Trophy} colorClass="bg-pixo-yellow/10 text-pixo-yellow" />
      </div>

      {/* Per-child cards */}
      {children.map(child => {
        const avgScore = getAvgScore(child.completions);
        const last7 = getLast7DaysAttendance(child.attendance);
        return (
          <div key={child.profile.id} className="rounded-xl border bg-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-xl font-bold text-primary">
                  {(child.profile.full_name || child.profile.email)[0].toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold">{child.profile.full_name || child.profile.email}</h3>
                  <p className="text-xs text-muted-foreground">
                    {child.progress ? `${child.progress.current_level.charAt(0).toUpperCase() + child.progress.current_level.slice(1)} · Day ${child.progress.current_day}` : 'Not started'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <StreakDisplay streak={child.streak} />
                <ProgressRing progress={avgScore} size={52}><span className="text-xs font-bold">{avgScore}%</span></ProgressRing>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive"><UserMinus className="h-4 w-4" /></Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remove Child</AlertDialogTitle>
                      <AlertDialogDescription>Unlink <strong>{child.profile.full_name || child.profile.email}</strong>?</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleRemoveChild(child.profile.id)} className="bg-destructive text-destructive-foreground" disabled={removingChildId === child.profile.id}>
                        {removingChildId === child.profile.id ? 'Removing...' : 'Remove'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
            {/* 7-day attendance */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1"><Calendar className="h-3 w-3" />Last 7 Days</p>
              <div className="flex gap-1.5">
                {last7.map(day => (
                  <div key={day.date} className="flex flex-col items-center gap-0.5">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${day.present ? 'bg-pixo-green/15 text-pixo-green' : 'bg-muted text-muted-foreground'}`}>
                      {day.present ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4 opacity-40" />}
                    </div>
                    <span className="text-[9px] text-muted-foreground">{format(new Date(day.date), 'EEE')}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Quick stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <p className="text-lg font-bold">{child.completions.length}</p>
                <p className="text-[10px] text-muted-foreground">Lessons</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <p className="text-lg font-bold">{child.xp?.total_xp ?? 0}</p>
                <p className="text-[10px] text-muted-foreground">Total XP</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <p className="text-lg font-bold">{child.writingSubmissions.length}</p>
                <p className="text-[10px] text-muted-foreground">Writings</p>
              </div>
            </div>
          </div>
        );
      })}

      {/* AI Insights Summary */}
      <div className="rounded-xl border bg-gradient-to-r from-primary/5 to-accent/5 p-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><Sparkles className="h-5 w-5 text-primary" /></div>
          <div>
            <h3 className="font-bold mb-1">AI Quick Insight</h3>
            {children.map(child => {
              const avg = getAvgScore(child.completions);
              return (
                <p key={child.profile.id} className="text-sm text-muted-foreground mb-1">
                  <span className="font-medium text-foreground">{child.profile.full_name || child.profile.email}:</span>{' '}
                  {child.completions.length === 0 ? "Hasn't started yet. Encourage them to begin!" :
                    avg >= 70 ? `Performing well at ${avg}% avg with ${child.streak}-day streak! 🚀` :
                      `${avg}% avg. Focus on daily practice for improvement.`}
                </p>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

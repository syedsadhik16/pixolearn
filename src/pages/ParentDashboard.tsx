import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { StatCard } from '@/components/shared/StatCard';
import { ProgressRing } from '@/components/shared/ProgressRing';
import { StreakDisplay } from '@/components/shared/StreakDisplay';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Users,
  BookOpen,
  Calendar,
  Trophy,
  TrendingUp,
  CheckCircle2,
  XCircle,
  UserPlus,
  UserMinus,
} from 'lucide-react';
import { NotificationBell } from '@/components/shared/NotificationBell';
import { NotificationPreferences } from '@/components/shared/NotificationPreferences';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { format, subDays } from 'date-fns';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface ChildProfile {
  id: string;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
}

interface ChildData {
  profile: ChildProfile;
  progress: { current_level: string; current_day: number } | null;
  completions: {
    lesson_id: string;
    pronunciation_score: number | null;
    fluency_score: number | null;
    clarity_score: number | null;
    confidence_score: number | null;
    practice_count: number;
    completed_at: string;
  }[];
  attendance: { date: string; is_present: boolean; lesson_completed: boolean }[];
  streak: number;
}

export default function ParentDashboard() {
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [children, setChildren] = useState<ChildData[]>([]);
  const [loading, setLoading] = useState(true);
  const [addChildEmail, setAddChildEmail] = useState('');
  const [addingChild, setAddingChild] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [removingChildId, setRemovingChildId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    } else if (!authLoading && profile && profile.role !== 'parent') {
      navigate(profile.role === 'student' ? '/student' : '/admin');
    }
  }, [user, profile, authLoading, navigate]);

  useEffect(() => {
    if (user && profile?.role === 'parent') {
      fetchChildren();
    }
  }, [user, profile]);

  const fetchChildren = async () => {
    try {
      const { data: links, error: linksError } = await supabase
        .from('parent_children')
        .select('child_id')
        .eq('parent_id', user!.id);

      if (linksError) throw linksError;
      if (!links || links.length === 0) {
        setChildren([]);
        setLoading(false);
        return;
      }

      const childIds = links.map((l) => l.child_id);

      const childDataPromises = childIds.map(async (childId) => {
        const [profileRes, progressRes, completionsRes, attendanceRes] = await Promise.all([
          supabase.from('profiles').select('id, full_name, email, avatar_url').eq('id', childId).maybeSingle(),
          supabase.from('student_progress').select('current_level, current_day').eq('student_id', childId).maybeSingle(),
          supabase.from('lesson_completions').select('lesson_id, pronunciation_score, fluency_score, clarity_score, confidence_score, practice_count, completed_at').eq('student_id', childId).order('completed_at', { ascending: false }),
          supabase.from('attendance').select('date, is_present, lesson_completed').eq('student_id', childId).order('date', { ascending: false }),
        ]);

        let streak = 0;
        if (attendanceRes.data) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          for (let i = 0; i < attendanceRes.data.length; i++) {
            const d = new Date(attendanceRes.data[i].date);
            d.setHours(0, 0, 0, 0);
            const expected = new Date(today);
            expected.setDate(expected.getDate() - i);
            if (d.getTime() === expected.getTime() && attendanceRes.data[i].lesson_completed) {
              streak++;
            } else {
              break;
            }
          }
        }

        return {
          profile: profileRes.data as ChildProfile,
          progress: progressRes.data,
          completions: completionsRes.data || [],
          attendance: attendanceRes.data || [],
          streak,
        } as ChildData;
      });

      const childrenData = await Promise.all(childDataPromises);
      setChildren(childrenData.filter((c) => c.profile));
    } catch (error) {
      console.error('Error fetching children:', error);
      toast({ title: 'Error', description: 'Failed to load children data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleAddChild = async () => {
    if (!addChildEmail.trim()) return;
    setAddingChild(true);
    try {
      const { data: childProfile, error: findError } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('email', addChildEmail.trim())
        .maybeSingle();

      if (findError || !childProfile) {
        toast({ title: 'Not found', description: 'No student account found with that email.', variant: 'destructive' });
        return;
      }

      if (childProfile.role !== 'student') {
        toast({ title: 'Invalid', description: 'That account is not a student account.', variant: 'destructive' });
        return;
      }

      const { error: linkError } = await supabase
        .from('parent_children')
        .insert({ parent_id: user!.id, child_id: childProfile.id });

      if (linkError) {
        if (linkError.code === '23505') {
          toast({ title: 'Already linked', description: 'This child is already linked to your account.' });
        } else {
          throw linkError;
        }
        return;
      }

      toast({ title: 'Success', description: 'Child linked successfully!' });
      setAddChildEmail('');
      setDialogOpen(false);
      fetchChildren();
    } catch (error) {
      console.error('Error adding child:', error);
      toast({ title: 'Error', description: 'Failed to link child account', variant: 'destructive' });
    } finally {
      setAddingChild(false);
    }
  };

  const handleRemoveChild = async (childId: string) => {
    setRemovingChildId(childId);
    try {
      const { error } = await supabase
        .from('parent_children')
        .delete()
        .eq('parent_id', user!.id)
        .eq('child_id', childId);

      if (error) throw error;

      toast({ title: 'Removed', description: 'Child has been unlinked from your account.' });
      setChildren((prev) => prev.filter((c) => c.profile.id !== childId));
    } catch (error) {
      console.error('Error removing child:', error);
      toast({ title: 'Error', description: 'Failed to remove child', variant: 'destructive' });
    } finally {
      setRemovingChildId(null);
    }
  };

  const getAvgScore = (completions: ChildData['completions']) => {
    const scores = completions.flatMap((c) => [
      c.pronunciation_score, c.fluency_score, c.clarity_score, c.confidence_score,
    ]).filter((s): s is number => s !== null);
    if (scores.length === 0) return 0;
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  };

  const getLevelLabel = (level: string) => {
    if (level === 'beginner') return 'Beginner';
    if (level === 'intermediate') return 'Intermediate';
    return 'Advanced';
  };

  const getLast7DaysAttendance = (attendance: ChildData['attendance']) => {
    const days: { date: string; present: boolean }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = format(subDays(new Date(), i), 'yyyy-MM-dd');
      const record = attendance.find((a) => a.date === d);
      days.push({ date: d, present: record?.lesson_completed ?? false });
    }
    return days;
  };

  const getScoreTrendData = (completions: ChildData['completions']) => {
    // Reverse to show oldest first for the chart
    return [...completions].reverse().map((c) => ({
      date: format(new Date(c.completed_at), 'MMM d'),
      Pronunciation: c.pronunciation_score ?? 0,
      Fluency: c.fluency_score ?? 0,
      Clarity: c.clarity_score ?? 0,
      Confidence: c.confidence_score ?? 0,
    }));
  };

  // Aggregate stats
  const totalChildren = children.length;
  const totalCompletions = children.reduce((s, c) => s + c.completions.length, 0);
  const overallAvgScore = children.length > 0
    ? Math.round(children.reduce((s, c) => s + getAvgScore(c.completions), 0) / children.length)
    : 0;
  const bestStreak = children.length > 0 ? Math.max(...children.map((c) => c.streak)) : 0;

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-pulse text-center">
            <div className="w-16 h-16 bg-primary/20 rounded-full mx-auto mb-4" />
            <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-display font-bold">
                Parent <span className="gradient-text">Dashboard</span> 👨‍👩‍👧‍👦
              </h1>
              <p className="text-muted-foreground mt-2">
                Track your children's learning progress and achievements.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {user && <NotificationBell userId={user.id} />}
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="gradient">
                    <UserPlus className="h-5 w-5 mr-2" />
                    Add Child
                  </Button>
                </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Link a Child Account</DialogTitle>
                </DialogHeader>
                <p className="text-sm text-muted-foreground mb-4">
                  Enter the email address of your child's student account.
                </p>
                <Input
                  placeholder="child@example.com"
                  value={addChildEmail}
                  onChange={(e) => setAddChildEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddChild()}
                />
                <Button onClick={handleAddChild} disabled={addingChild} className="mt-2">
                  {addingChild ? 'Linking...' : 'Link Child'}
                </Button>
              </DialogContent>
            </Dialog>
            </div>
          </div>
        </div>

        {/* Aggregate Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <StatCard title="Children" value={totalChildren} icon={Users} colorClass="bg-pixo-blue/10 text-pixo-blue" />
          </div>
          <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <StatCard title="Lessons Completed" value={totalCompletions} icon={BookOpen} colorClass="bg-pixo-orange/10 text-pixo-orange" />
          </div>
          <div className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <StatCard title="Avg. Score" value={`${overallAvgScore}%`} icon={TrendingUp} colorClass="bg-pixo-green/10 text-pixo-green" />
          </div>
          <div className="animate-slide-up" style={{ animationDelay: '0.4s' }}>
            <StatCard title="Best Streak" value={`${bestStreak} days`} icon={Trophy} colorClass="bg-pixo-yellow/10 text-pixo-yellow" />
          </div>
        </div>

        {/* No Children State */}
        {children.length === 0 && (
          <div className="pixo-card text-center py-16 animate-fade-in">
            <Users className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-xl font-display font-bold mb-2">No Children Linked Yet</h3>
            <p className="text-muted-foreground mb-6">
              Link your child's student account to start tracking their progress.
            </p>
            <Button variant="gradient" onClick={() => setDialogOpen(true)}>
              <UserPlus className="h-5 w-5 mr-2" />
              Add Your First Child
            </Button>
          </div>
        )}

        {/* Per-Child Cards */}
        {children.map((child, idx) => {
          const avgScore = getAvgScore(child.completions);
          const last7 = getLast7DaysAttendance(child.attendance);
          const trendData = getScoreTrendData(child.completions);

          return (
            <div
              key={child.profile.id}
              className="pixo-card mb-6 animate-fade-in"
              style={{ animationDelay: `${0.5 + idx * 0.1}s` }}
            >
              {/* Child Header */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
                    {(child.profile.full_name || child.profile.email)[0].toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-xl font-display font-bold">
                      {child.profile.full_name || child.profile.email}
                    </h2>
                    <p className="text-sm text-muted-foreground">{child.profile.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <StreakDisplay streak={child.streak} />
                  <div className="text-center">
                    <ProgressRing progress={avgScore} size={64}>
                      <span className="text-xs font-bold">{avgScore}%</span>
                    </ProgressRing>
                    <p className="text-xs text-muted-foreground mt-1">Avg Score</p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                        <UserMinus className="h-5 w-5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remove Child</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to unlink <strong>{child.profile.full_name || child.profile.email}</strong> from your account? You can re-add them later. Their data will not be deleted.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleRemoveChild(child.profile.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          disabled={removingChildId === child.profile.id}
                        >
                          {removingChildId === child.profile.id ? 'Removing...' : 'Remove'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>

              {/* Progress Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-muted/50 rounded-xl p-4">
                  <p className="text-sm text-muted-foreground">Level</p>
                  <p className="text-lg font-bold">
                    {child.progress ? getLevelLabel(child.progress.current_level) : 'N/A'}
                  </p>
                </div>
                <div className="bg-muted/50 rounded-xl p-4">
                  <p className="text-sm text-muted-foreground">Current Day</p>
                  <p className="text-lg font-bold">Day {child.progress?.current_day ?? 1}</p>
                </div>
                <div className="bg-muted/50 rounded-xl p-4">
                  <p className="text-sm text-muted-foreground">Lessons Completed</p>
                  <p className="text-lg font-bold">{child.completions.length}</p>
                </div>
              </div>

              {/* 7-Day Attendance */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Last 7 Days Attendance
                </h3>
                <div className="flex gap-2">
                  {last7.map((day) => (
                    <div key={day.date} className="flex flex-col items-center gap-1">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          day.present
                            ? 'bg-pixo-green/15 text-pixo-green'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {day.present ? (
                          <CheckCircle2 className="h-5 w-5" />
                        ) : (
                          <XCircle className="h-5 w-5 opacity-40" />
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        {format(new Date(day.date), 'EEE')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Score Trend Chart */}
              {trendData.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Score Trends Over Time
                  </h3>
                  <div className="bg-muted/30 rounded-xl p-4">
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={trendData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '0.75rem',
                            fontSize: '0.875rem',
                          }}
                        />
                        <Legend />
                        <Line type="monotone" dataKey="Pronunciation" stroke="hsl(var(--pixo-orange))" strokeWidth={2} dot={{ r: 4 }} />
                        <Line type="monotone" dataKey="Fluency" stroke="hsl(var(--pixo-blue))" strokeWidth={2} dot={{ r: 4 }} />
                        <Line type="monotone" dataKey="Clarity" stroke="hsl(var(--pixo-green))" strokeWidth={2} dot={{ r: 4 }} />
                        <Line type="monotone" dataKey="Confidence" stroke="hsl(var(--pixo-purple))" strokeWidth={2} dot={{ r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Recent Completions Table */}
              {child.completions.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Recent Lesson Scores
                  </h3>
                  <div className="rounded-xl border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Pronunciation</TableHead>
                          <TableHead>Fluency</TableHead>
                          <TableHead>Clarity</TableHead>
                          <TableHead>Confidence</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {child.completions.slice(0, 5).map((c) => (
                          <TableRow key={c.lesson_id + c.completed_at}>
                            <TableCell className="text-sm">
                              {format(new Date(c.completed_at), 'MMM d, yyyy')}
                            </TableCell>
                            <TableCell>
                              <ScoreBadge score={c.pronunciation_score} />
                            </TableCell>
                            <TableCell>
                              <ScoreBadge score={c.fluency_score} />
                            </TableCell>
                            <TableCell>
                              <ScoreBadge score={c.clarity_score} />
                            </TableCell>
                            <TableCell>
                              <ScoreBadge score={c.confidence_score} />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Layout>
  );
}

function ScoreBadge({ score }: { score: number | null }) {
  if (score === null) return <span className="text-muted-foreground text-sm">—</span>;
  const color =
    score >= 80
      ? 'bg-pixo-green/15 text-pixo-green'
      : score >= 50
      ? 'bg-pixo-yellow/15 text-pixo-yellow'
      : 'bg-destructive/15 text-destructive';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-sm font-semibold ${color}`}>
      {score}%
    </span>
  );
}

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { StatCard } from '@/components/shared/StatCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import {
  Users,
  BookOpen,
  TrendingUp,
  Trophy,
  Plus,
  Trash2,
  Pencil,
  Search,
  BarChart3,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  subscription_type: string;
  created_at: string;
}

interface Lesson {
  id: string;
  title: string;
  level: string;
  day_number: number;
  description: string | null;
  is_active: boolean;
  vocabulary: unknown;
  sentences: unknown;
  read_aloud_text: string | null;
}

interface VocabItem {
  word: string;
  phonetic: string;
  meaning: string;
}

interface SentenceItem {
  text: string;
}

interface LessonForm {
  title: string;
  level: string;
  day_number: number;
  description: string;
  is_active: boolean;
  vocabulary: VocabItem[];
  sentences: SentenceItem[];
  read_aloud_text: string;
}

const CHART_COLORS = [
  'hsl(25, 95%, 53%)',
  'hsl(142, 60%, 45%)',
  'hsl(210, 80%, 55%)',
  'hsl(45, 100%, 55%)',
  'hsl(280, 70%, 55%)',
];

export default function AdminDashboard() {
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [students, setStudents] = useState<Profile[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [completionCounts, setCompletionCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [lessonDialogOpen, setLessonDialogOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [lessonForm, setLessonForm] = useState<LessonForm>({
    title: '',
    level: 'beginner',
    day_number: 1,
    description: '',
    is_active: true,
    vocabulary: [],
    sentences: [],
    read_aloud_text: '',
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    } else if (!authLoading && profile && profile.role !== 'admin') {
      navigate(profile.role === 'student' ? '/student' : '/parent');
    }
  }, [user, profile, authLoading, navigate]);

  useEffect(() => {
    if (user && profile?.role === 'admin') {
      fetchData();
    }
  }, [user, profile]);

  const fetchData = async () => {
    try {
      const [profilesRes, lessonsRes, completionsRes] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('lessons').select('*').order('level').order('day_number'),
        supabase.from('lesson_completions').select('lesson_id'),
      ]);

      if (profilesRes.error) throw profilesRes.error;
      if (lessonsRes.error) throw lessonsRes.error;

      setStudents((profilesRes.data || []).filter((p) => p.role === 'student'));
      setLessons(lessonsRes.data || []);

      // Count completions per lesson
      const counts: Record<string, number> = {};
      (completionsRes.data || []).forEach((c) => {
        counts[c.lesson_id] = (counts[c.lesson_id] || 0) + 1;
      });
      setCompletionCounts(counts);
    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast({ title: 'Error', description: 'Failed to load dashboard data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveLesson = async () => {
    try {
      if (!lessonForm.title.trim()) {
        toast({ title: 'Required', description: 'Please enter a lesson title.', variant: 'destructive' });
        return;
      }

      if (editingLesson) {
        const { error } = await supabase
          .from('lessons')
          .update({
            title: lessonForm.title,
            level: lessonForm.level as 'beginner' | 'intermediate' | 'advanced',
            day_number: lessonForm.day_number,
            description: lessonForm.description || null,
            is_active: lessonForm.is_active,
          })
          .eq('id', editingLesson.id);

        if (error) throw error;
        toast({ title: 'Updated', description: 'Lesson updated successfully.' });
      } else {
        const { error } = await supabase
          .from('lessons')
          .insert({
            title: lessonForm.title,
            level: lessonForm.level as 'beginner' | 'intermediate' | 'advanced',
            day_number: lessonForm.day_number,
            description: lessonForm.description || null,
            is_active: lessonForm.is_active,
          });

        if (error) throw error;
        toast({ title: 'Created', description: 'Lesson created successfully.' });
      }

      setLessonDialogOpen(false);
      setEditingLesson(null);
      resetLessonForm();
      fetchData();
    } catch (error) {
      console.error('Error saving lesson:', error);
      toast({ title: 'Error', description: 'Failed to save lesson', variant: 'destructive' });
    }
  };

  const openEditLesson = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setLessonForm({
      title: lesson.title,
      level: lesson.level,
      day_number: lesson.day_number,
      description: lesson.description || '',
      is_active: lesson.is_active,
    });
    setLessonDialogOpen(true);
  };

  const resetLessonForm = () => {
    setLessonForm({ title: '', level: 'beginner', day_number: 1, description: '', is_active: true });
  };

  const filteredStudents = students.filter(
    (s) =>
      (s.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Engagement metrics
  const totalStudents = students.length;
  const totalLessons = lessons.length;
  const totalCompletions = Object.values(completionCounts).reduce((a, b) => a + b, 0);
  const avgCompletionsPerStudent = totalStudents > 0 ? Math.round(totalCompletions / totalStudents) : 0;

  // Charts data
  const levelDistribution = [
    { name: 'Beginner', value: lessons.filter((l) => l.level === 'beginner').length },
    { name: 'Intermediate', value: lessons.filter((l) => l.level === 'intermediate').length },
    { name: 'Advanced', value: lessons.filter((l) => l.level === 'advanced').length },
  ];

  const topLessons = lessons
    .map((l) => ({ name: l.title.length > 20 ? l.title.slice(0, 20) + '…' : l.title, completions: completionCounts[l.id] || 0 }))
    .sort((a, b) => b.completions - a.completions)
    .slice(0, 5);

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-pulse text-center">
            <div className="w-16 h-16 bg-primary/20 rounded-full mx-auto mb-4" />
            <p className="text-muted-foreground">Loading admin dashboard...</p>
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
          <h1 className="text-3xl md:text-4xl font-display font-bold">
            Admin <span className="gradient-text">Dashboard</span> ⚙️
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage lessons, view students, and track engagement.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <StatCard title="Total Students" value={totalStudents} icon={Users} colorClass="bg-pixo-blue/10 text-pixo-blue" />
          </div>
          <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <StatCard title="Total Lessons" value={totalLessons} icon={BookOpen} colorClass="bg-pixo-orange/10 text-pixo-orange" />
          </div>
          <div className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <StatCard title="Total Completions" value={totalCompletions} icon={TrendingUp} colorClass="bg-pixo-green/10 text-pixo-green" />
          </div>
          <div className="animate-slide-up" style={{ animationDelay: '0.4s' }}>
            <StatCard title="Avg per Student" value={avgCompletionsPerStudent} subtitle="lesson completions" icon={Trophy} colorClass="bg-pixo-yellow/10 text-pixo-yellow" />
          </div>
        </div>

        <Tabs defaultValue="lessons" className="animate-fade-in">
          <TabsList className="mb-6">
            <TabsTrigger value="lessons">
              <BookOpen className="h-4 w-4 mr-2" />
              Lessons
            </TabsTrigger>
            <TabsTrigger value="students">
              <Users className="h-4 w-4 mr-2" />
              Students
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Lessons Tab */}
          <TabsContent value="lessons">
            <div className="pixo-card">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <h2 className="text-xl font-display font-bold">Lesson Management</h2>
                <Dialog open={lessonDialogOpen} onOpenChange={(open) => {
                  setLessonDialogOpen(open);
                  if (!open) { setEditingLesson(null); resetLessonForm(); }
                }}>
                  <DialogTrigger asChild>
                    <Button variant="gradient">
                      <Plus className="h-4 w-4 mr-2" />
                      New Lesson
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>{editingLesson ? 'Edit Lesson' : 'Create Lesson'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Title</Label>
                        <Input value={lessonForm.title} onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })} placeholder="Lesson title" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Level</Label>
                          <Select value={lessonForm.level} onValueChange={(v) => setLessonForm({ ...lessonForm, level: v })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="beginner">Beginner</SelectItem>
                              <SelectItem value="intermediate">Intermediate</SelectItem>
                              <SelectItem value="advanced">Advanced</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Day Number</Label>
                          <Input type="number" min={1} value={lessonForm.day_number} onChange={(e) => setLessonForm({ ...lessonForm, day_number: parseInt(e.target.value) || 1 })} />
                        </div>
                      </div>
                      <div>
                        <Label>Description</Label>
                        <Textarea value={lessonForm.description} onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })} placeholder="Lesson description" rows={3} />
                      </div>
                      <Button onClick={handleSaveLesson} className="w-full">
                        {editingLesson ? 'Update Lesson' : 'Create Lesson'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="rounded-xl border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Day</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead>Completions</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lessons.map((lesson) => (
                      <TableRow key={lesson.id}>
                        <TableCell className="font-medium">{lesson.day_number}</TableCell>
                        <TableCell>{lesson.title}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={
                            lesson.level === 'beginner' ? 'border-pixo-green/50 text-pixo-green' :
                            lesson.level === 'intermediate' ? 'border-pixo-blue/50 text-pixo-blue' :
                            'border-pixo-purple/50 text-pixo-purple'
                          }>
                            {lesson.level}
                          </Badge>
                        </TableCell>
                        <TableCell>{completionCounts[lesson.id] || 0}</TableCell>
                        <TableCell>
                          <Badge variant={lesson.is_active ? 'default' : 'secondary'}>
                            {lesson.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => openEditLesson(lesson)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {lessons.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No lessons yet. Create your first lesson above.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>

          {/* Students Tab */}
          <TabsContent value="students">
            <div className="pixo-card">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <h2 className="text-xl font-display font-bold">All Students</h2>
                <div className="relative max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="rounded-xl border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Joined</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium">{student.full_name || '—'}</TableCell>
                        <TableCell className="text-muted-foreground">{student.email}</TableCell>
                        <TableCell>
                          <Badge variant={student.subscription_type === 'premium' ? 'default' : 'secondary'}>
                            {student.subscription_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(student.created_at), 'MMM d, yyyy')}
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredStudents.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          {searchQuery ? 'No students match your search.' : 'No students yet.'}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Lesson Distribution */}
              <div className="pixo-card">
                <h3 className="text-lg font-display font-bold mb-4">Lessons by Level</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={levelDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                      {levelDistribution.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Top Lessons */}
              <div className="pixo-card">
                <h3 className="text-lg font-display font-bold mb-4">Most Completed Lessons</h3>
                {topLessons.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={topLessons} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 12 }} />
                      <YAxis dataKey="name" type="category" width={120} stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '0.75rem' }} />
                      <Bar dataKey="completions" fill="hsl(var(--pixo-orange))" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No completion data yet.</p>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}

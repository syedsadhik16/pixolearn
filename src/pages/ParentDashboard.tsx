import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { ParentSidebar } from '@/components/parent/ParentSidebar';
import { ParentOverview } from '@/components/parent/ParentOverview';
import { PerformanceAnalytics } from '@/components/parent/PerformanceAnalytics';
import { TimeAnalytics } from '@/components/parent/TimeAnalytics';
import { AIRecommendations } from '@/components/parent/AIRecommendations';
import { ParentControls } from '@/components/parent/ParentControls';
import { ParentNotifications } from '@/components/parent/ParentNotifications';
import { WeeklyParentReport } from '@/components/parent/WeeklyParentReport';
import { AILearningIntelligence } from '@/components/parent/AILearningIntelligence';
import { LearningHabitTracker } from '@/components/parent/LearningHabitTracker';
import { FocusAttentionScore } from '@/components/parent/FocusAttentionScore';
import { ChildGrowthTimeline } from '@/components/parent/ChildGrowthTimeline';
import { SmartPracticePlan } from '@/components/parent/SmartPracticePlan';
import { ParentBenchmark } from '@/components/parent/ParentBenchmark';
import { ParentEngagementScore } from '@/components/parent/ParentEngagementScore';
import { PhonicsProgressDiagnostics } from '@/components/parent/PhonicsProgressDiagnostics';
import { NotificationBell } from '@/components/shared/NotificationBell';
import { requestPushPermission, isNotificationEnabled, isNotificationSupported } from '@/lib/pushNotifications';
import { Button } from '@/components/ui/button';
import { Bell } from 'lucide-react';
import { ParentDashboardSkeleton } from '@/components/shared/SkeletonLoaders';
import { toast } from 'sonner';

export interface ChildProfile {
  id: string;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
}

export interface ChildData {
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
  xp: { total_xp: number; xp_level: number } | null;
  streak: number;
  writingSubmissions: {
    score: number | null;
    xp_awarded: number | null;
    created_at: string;
    prompt_title: string;
  }[];
  learningSessions: {
    duration_seconds: number;
    session_type: string;
    started_at: string;
  }[];
  assessmentResult: { assigned_level: string; score: number; created_at: string } | null;
}

export default function ParentDashboard() {
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [children, setChildren] = useState<ChildData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('overview');
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [pushEnabled, setPushEnabled] = useState(isNotificationEnabled());

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
    else if (!authLoading && profile && profile.role !== 'parent')
      navigate(profile.role === 'student' ? '/student' : '/admin');
  }, [user, profile, authLoading, navigate]);

  useEffect(() => {
    if (user && profile?.role === 'parent') fetchChildren();
  }, [user, profile]);

  // Realtime notifications
  useEffect(() => {
    if (!user || !pushEnabled) return;
    const channel = supabase
      .channel('parent-notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `parent_id=eq.${user.id}` }, (payload) => {
        const n = payload.new as { title: string; message: string };
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(n.title, { body: n.message, icon: '/favicon.ico' });
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, pushEnabled]);

  const handleEnablePush = async () => {
    await requestPushPermission();
    setPushEnabled(isNotificationEnabled());
    if (isNotificationEnabled()) {
      toast({ title: 'Notifications enabled! 🔔', description: "You'll get browser alerts." });
    } else {
      toast({ title: 'Permission denied', description: 'Enable in browser settings.', variant: 'destructive' });
    }
  };

  const fetchChildren = async () => {
    try {
      const { data: links } = await supabase
        .from('parent_children')
        .select('child_id')
        .eq('parent_id', user!.id);

      if (!links || links.length === 0) { setChildren([]); setLoading(false); return; }

      const childIds = links.map((l) => l.child_id);
      const childDataPromises = childIds.map(async (childId) => {
        const [profileRes, progressRes, completionsRes, attendanceRes, xpRes, writingRes, sessionsRes, assessmentRes] = await Promise.all([
          supabase.from('profiles').select('id, full_name, email, avatar_url').eq('id', childId).maybeSingle(),
          supabase.from('student_progress').select('current_level, current_day').eq('student_id', childId).maybeSingle(),
          supabase.from('lesson_completions').select('lesson_id, pronunciation_score, fluency_score, clarity_score, confidence_score, practice_count, completed_at').eq('student_id', childId).order('completed_at', { ascending: false }),
          supabase.from('attendance').select('date, is_present, lesson_completed').eq('student_id', childId).order('date', { ascending: false }),
          supabase.from('student_xp').select('total_xp, xp_level').eq('student_id', childId).maybeSingle(),
          supabase.from('writing_submissions').select('score, xp_awarded, created_at, prompt_title').eq('student_id', childId).order('created_at', { ascending: false }),
          supabase.from('learning_sessions').select('duration_seconds, session_type, started_at').eq('student_id', childId).order('started_at', { ascending: false }),
          supabase.from('assessment_results').select('assigned_level, score, created_at').eq('student_id', childId).maybeSingle(),
        ]);

        let streak = 0;
        if (attendanceRes.data) {
          const today = new Date(); today.setHours(0, 0, 0, 0);
          for (let i = 0; i < attendanceRes.data.length; i++) {
            const d = new Date(attendanceRes.data[i].date); d.setHours(0, 0, 0, 0);
            const expected = new Date(today); expected.setDate(expected.getDate() - i);
            if (d.getTime() === expected.getTime() && attendanceRes.data[i].lesson_completed) streak++;
            else break;
          }
        }

        return {
          profile: profileRes.data as ChildProfile,
          progress: progressRes.data,
          completions: completionsRes.data || [],
          attendance: attendanceRes.data || [],
          xp: xpRes.data,
          streak,
          writingSubmissions: writingRes.data || [],
          learningSessions: sessionsRes.data || [],
          assessmentResult: assessmentRes.data,
        } as ChildData;
      });

      const childrenData = await Promise.all(childDataPromises);
      const filtered = childrenData.filter((c) => c.profile);
      setChildren(filtered);
      if (filtered.length > 0 && !selectedChildId) setSelectedChildId(filtered[0].profile.id);
    } catch (error) {
      console.error('Error fetching children:', error);
      toast({ title: 'Error', description: 'Failed to load children data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <ParentSidebar
            activeSection={activeSection}
            onSectionChange={setActiveSection}
            children={[]}
            selectedChildId={null}
            onChildSelect={() => {}}
          />
          <div className="flex-1">
            <ParentDashboardSkeleton />
          </div>
        </div>
      </SidebarProvider>
    );
  }

  const selectedChild = children.find(c => c.profile.id === selectedChildId) || children[0] || null;

  const renderSection = () => {
    if (children.length === 0) return null;
    switch (activeSection) {
      case 'overview': return <ParentOverview children={children} selectedChild={selectedChild} onRefresh={fetchChildren} userId={user!.id} />;
      case 'performance': return <PerformanceAnalytics child={selectedChild} />;
      case 'time': return <TimeAnalytics child={selectedChild} />;
      case 'recommendations': return <AIRecommendations child={selectedChild} />;
      case 'controls': return <ParentControls child={selectedChild} parentId={user!.id} />;
      case 'notifications': return <ParentNotifications userId={user!.id} />;
      case 'report': return <WeeklyParentReport child={selectedChild} />;
      case 'ai-intelligence': return <AILearningIntelligence child={selectedChild} />;
      case 'habits': return <LearningHabitTracker child={selectedChild} />;
      case 'focus': return <FocusAttentionScore child={selectedChild} />;
      case 'timeline': return <ChildGrowthTimeline child={selectedChild} />;
      case 'practice-plan': return <SmartPracticePlan child={selectedChild} />;
      case 'benchmark': return <ParentBenchmark child={selectedChild} />;
      case 'engagement': return <ParentEngagementScore userId={user!.id} />;
      case 'phonics': return <PhonicsProgressDiagnostics child={selectedChild} />;
      default: return <ParentOverview children={children} selectedChild={selectedChild} onRefresh={fetchChildren} userId={user!.id} />;
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <ParentSidebar
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          children={children}
          selectedChildId={selectedChildId}
          onChildSelect={setSelectedChildId}
        />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between border-b border-border px-4 bg-background/80 backdrop-blur-lg sticky top-0 z-30">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <h1 className="text-lg font-bold font-display hidden sm:block">Parents Zone</h1>
            </div>
            <div className="flex items-center gap-2">
              {isNotificationSupported() && !pushEnabled && (
                <Button variant="outline" size="sm" onClick={handleEnablePush}>
                  <Bell className="h-4 w-4 mr-1.5" /> Enable Alerts
                </Button>
              )}
              {user && <NotificationBell userId={user.id} />}
            </div>
          </header>
          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
            {children.length === 0 ? (
              <ParentOverview children={children} selectedChild={null} onRefresh={fetchChildren} userId={user!.id} />
            ) : (
              renderSection()
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

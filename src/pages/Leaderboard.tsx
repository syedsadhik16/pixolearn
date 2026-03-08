import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { BottomNav } from '@/components/layout/BottomNav';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Trophy, Medal, Crown, Flame, Calendar, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface LeaderboardEntry {
  student_id: string;
  full_name: string;
  avatar_url: string | null;
  total_xp: number;
  xp_level: number;
}

interface WeeklyEntry {
  student_id: string;
  full_name: string;
  avatar_url: string | null;
  weekly_xp: number;
}

export default function Leaderboard() {
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [allTime, setAllTime] = useState<LeaderboardEntry[]>([]);
  const [weekly, setWeekly] = useState<WeeklyEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [myRank, setMyRank] = useState<number | null>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) fetchLeaderboard();
  }, [user]);

  const fetchLeaderboard = async () => {
    try {
      // All-time leaderboard - join student_xp with profiles
      const { data: xpData } = await supabase
        .from('student_xp')
        .select('student_id, total_xp, xp_level')
        .order('total_xp', { ascending: false })
        .limit(50);

      if (xpData && xpData.length > 0) {
        const studentIds = xpData.map(x => x.student_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', studentIds);

        const profileMap = new Map((profiles || []).map(p => [p.id, p]));

        const entries: LeaderboardEntry[] = xpData.map(x => {
          const p = profileMap.get(x.student_id);
          return {
            student_id: x.student_id,
            full_name: p?.full_name || 'Anonymous Learner',
            avatar_url: p?.avatar_url || null,
            total_xp: x.total_xp,
            xp_level: x.xp_level,
          };
        });

        setAllTime(entries);

        const rank = entries.findIndex(e => e.student_id === user!.id);
        if (rank >= 0) setMyRank(rank + 1);
      }

      // Weekly leaderboard from xp_history
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const { data: weeklyData } = await supabase
        .from('xp_history')
        .select('student_id, xp_amount')
        .gte('created_at', weekAgo.toISOString());

      if (weeklyData && weeklyData.length > 0) {
        // Aggregate by student
        const xpMap = new Map<string, number>();
        weeklyData.forEach(w => {
          xpMap.set(w.student_id, (xpMap.get(w.student_id) || 0) + w.xp_amount);
        });

        const studentIds = Array.from(xpMap.keys());
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', studentIds);

        const profileMap = new Map((profiles || []).map(p => [p.id, p]));

        const weeklyEntries: WeeklyEntry[] = Array.from(xpMap.entries())
          .map(([sid, xp]) => {
            const p = profileMap.get(sid);
            return {
              student_id: sid,
              full_name: p?.full_name || 'Anonymous Learner',
              avatar_url: p?.avatar_url || null,
              weekly_xp: xp,
            };
          })
          .sort((a, b) => b.weekly_xp - a.weekly_xp)
          .slice(0, 50);

        setWeekly(weeklyEntries);
      }
    } catch (e) {
      console.error('Leaderboard fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-5 w-5 text-accent" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-muted-foreground" />;
    if (rank === 3) return <Medal className="h-5 w-5 text-primary" />;
    return <span className="text-sm font-bold text-muted-foreground w-5 text-center">{rank}</span>;
  };

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const renderRow = (
    rank: number,
    name: string,
    xp: number,
    studentId: string,
    level?: number
  ) => {
    const isMe = studentId === user?.id;
    return (
      <div
        key={studentId}
        className={cn(
          "flex items-center gap-3 p-3 rounded-xl border transition-colors",
          isMe ? "bg-primary/10 border-primary/30 ring-1 ring-primary/20" : "bg-card border-border",
          rank <= 3 && "border-accent/30"
        )}
      >
        <div className="w-8 flex items-center justify-center shrink-0">
          {getRankIcon(rank)}
        </div>
        <Avatar className="h-9 w-9 shrink-0">
          <AvatarFallback className={cn(
            "text-xs font-bold",
            rank === 1 && "bg-accent/20 text-accent-foreground",
            rank === 2 && "bg-muted",
            rank === 3 && "bg-primary/10 text-primary"
          )}>
            {getInitials(name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className={cn("text-sm font-semibold truncate", isMe && "text-primary")}>
            {name} {isMe && '(You)'}
          </p>
          {level && (
            <p className="text-xs text-muted-foreground">Level {level}</p>
          )}
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-bold text-primary">{xp.toLocaleString()}</p>
          <p className="text-[10px] text-muted-foreground">XP</p>
        </div>
      </div>
    );
  };

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading leaderboard...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 pb-24">
        {/* Header */}
        <div className="mb-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-accent/20 flex items-center justify-center mx-auto mb-3">
            <Trophy className="h-8 w-8 text-accent" />
          </div>
          <h1 className="text-2xl font-display font-bold">
            <span className="gradient-text">Leaderboard</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            See how you rank against other learners
          </p>
          {myRank && (
            <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-semibold">
              <TrendingUp className="h-4 w-4" />
              Your rank: #{myRank}
            </div>
          )}
        </div>

        <Tabs defaultValue="all-time" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="all-time" className="gap-1.5">
              <Flame className="h-4 w-4" />
              All Time
            </TabsTrigger>
            <TabsTrigger value="weekly" className="gap-1.5">
              <Calendar className="h-4 w-4" />
              This Week
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all-time" className="space-y-2">
            {allTime.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Trophy className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No rankings yet. Start learning to appear here!</p>
              </div>
            ) : (
              allTime.map((entry, i) =>
                renderRow(i + 1, entry.full_name, entry.total_xp, entry.student_id, entry.xp_level)
              )
            )}
          </TabsContent>

          <TabsContent value="weekly" className="space-y-2">
            {weekly.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No activity this week yet. Be the first!</p>
              </div>
            ) : (
              weekly.map((entry, i) =>
                renderRow(i + 1, entry.full_name, entry.weekly_xp, entry.student_id)
              )
            )}
          </TabsContent>
        </Tabs>
      </div>
      <BottomNav />
    </Layout>
  );
}

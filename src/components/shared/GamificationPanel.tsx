import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Trophy, Zap, Target, Star, Gift } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { CelebrationOverlay } from './CelebrationOverlay';

interface XPData {
  total_xp: number;
  xp_level: number;
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  xp_reward: number;
  requirement_type: string;
  requirement_value: number;
}

interface EarnedBadge {
  badge_id: string;
  earned_at: string;
}

interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  challenge_type: string;
  xp_reward: number;
  target_count: number;
}

interface StudentChallenge {
  challenge_id: string;
  current_count: number;
  completed: boolean;
  xp_claimed: boolean;
}

export function GamificationPanel() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [xp, setXP] = useState<XPData>({ total_xp: 0, xp_level: 1 });
  const [badges, setBadges] = useState<Badge[]>([]);
  const [earnedBadges, setEarnedBadges] = useState<EarnedBadge[]>([]);
  const [challenges, setChallenges] = useState<DailyChallenge[]>([]);
  const [studentChallenges, setStudentChallenges] = useState<StudentChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [celebration, setCelebration] = useState<{ show: boolean; type: 'level_up' | 'badge'; title: string; subtitle?: string; icon?: string }>({ show: false, type: 'level_up', title: '' });
  const prevLevelRef = useRef<number>(0);
  const prevBadgeCountRef = useRef<number>(0);

  useEffect(() => {
    if (user) fetchAll();
  }, [user]);

  const fetchAll = async () => {
    try {
      const [xpRes, badgesRes, earnedRes, challengesRes, studentChalRes] = await Promise.all([
        supabase.from('student_xp').select('total_xp, xp_level').eq('student_id', user!.id).maybeSingle(),
        supabase.from('badges').select('*').order('requirement_value'),
        supabase.from('student_badges').select('badge_id, earned_at').eq('student_id', user!.id),
        supabase.from('daily_challenges').select('*').eq('is_active', true),
        supabase.from('student_challenges').select('challenge_id, current_count, completed, xp_claimed')
          .eq('student_id', user!.id)
          .eq('challenge_date', new Date().toISOString().split('T')[0]),
      ]);

      if (xpRes.data) {
        const newLevel = xpRes.data.xp_level;
        if (prevLevelRef.current > 0 && newLevel > prevLevelRef.current) {
          setCelebration({ show: true, type: 'level_up', title: `Level ${newLevel}!`, subtitle: 'Keep up the amazing work! 🚀', icon: '🚀' });
        }
        prevLevelRef.current = newLevel;
        setXP(xpRes.data);
      }
      if (badgesRes.data) setBadges(badgesRes.data as Badge[]);
      if (earnedRes.data) {
        const newCount = earnedRes.data.length;
        if (prevBadgeCountRef.current > 0 && newCount > prevBadgeCountRef.current) {
          const latestBadge = badgesRes.data?.find((b: any) => b.id === earnedRes.data[earnedRes.data.length - 1]?.badge_id);
          setCelebration({ show: true, type: 'badge', title: 'Badge Earned!', subtitle: latestBadge?.name || 'New achievement!', icon: latestBadge?.icon || '🏆' });
        }
        prevBadgeCountRef.current = newCount;
        setEarnedBadges(earnedRes.data as EarnedBadge[]);
      }
      if (challengesRes.data) setChallenges(challengesRes.data as DailyChallenge[]);
      if (studentChalRes.data) setStudentChallenges(studentChalRes.data as StudentChallenge[]);
    } catch (e) {
      console.error('Gamification fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  const claimChallengeXP = async (challengeId: string, xpReward: number) => {
    if (!user) return;
    try {
      await supabase.from('student_challenges')
        .update({ xp_claimed: true })
        .eq('student_id', user.id)
        .eq('challenge_id', challengeId)
        .eq('challenge_date', new Date().toISOString().split('T')[0]);

      await supabase.rpc('award_xp', {
        _student_id: user.id,
        _xp_amount: xpReward,
        _source: 'daily_challenge',
        _source_id: challengeId,
      });

      toast({ title: `+${xpReward} XP! 🎉`, description: 'Challenge reward claimed!' });
      fetchAll();
    } catch (e) {
      console.error('Claim XP error:', e);
    }
  };

  // 180 levels: each level needs ~20 XP (scales slightly)
  const xpForNextLevel = (level: number) => Math.round(level * 20);
  const currentLevelXP = xpForNextLevel(xp.xp_level - 1);
  const nextLevelXP = xpForNextLevel(xp.xp_level);
  const progressToNext = nextLevelXP > currentLevelXP
    ? Math.min(100, ((xp.total_xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100)
    : 100;

  const earnedBadgeIds = new Set(earnedBadges.map(b => b.badge_id));

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-24 bg-muted rounded-xl" />
        <div className="h-32 bg-muted rounded-xl" />
      </div>
    );
  }

  return (
    <>
      <CelebrationOverlay
        show={celebration.show}
        type={celebration.type}
        title={celebration.title}
        subtitle={celebration.subtitle}
        icon={celebration.icon}
        onComplete={() => setCelebration(c => ({ ...c, show: false }))}
      />
      <div className="space-y-6">
      {/* XP Level Card */}
      <div className="pixo-card bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
        <div className="flex items-center gap-4 mb-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Zap className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-lg">Level {xp.xp_level}</h3>
              <span className="text-sm font-semibold text-primary">{xp.total_xp} XP</span>
            </div>
            <Progress value={progressToNext} className="h-2 mt-1" />
            <p className="text-xs text-muted-foreground mt-1">
              {nextLevelXP - xp.total_xp} XP to Level {xp.xp_level + 1}
            </p>
          </div>
        </div>
      </div>

      {/* Daily Challenges */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Target className="h-5 w-5 text-accent" />
          <h3 className="font-display font-bold">Daily Challenges</h3>
        </div>
        <div className="space-y-2">
          {challenges.map(challenge => {
            const progress = studentChallenges.find(sc => sc.challenge_id === challenge.id);
            const isCompleted = progress?.completed ?? false;
            const isClaimed = progress?.xp_claimed ?? false;
            const current = progress?.current_count ?? 0;

            return (
              <div
                key={challenge.id}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl border transition-colors",
                  isCompleted ? "bg-secondary/10 border-secondary/30" : "bg-card border-border"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0",
                  isCompleted ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground"
                )}>
                  {isCompleted ? '✓' : <Star className="h-4 w-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{challenge.title}</p>
                  <p className="text-xs text-muted-foreground">{current}/{challenge.target_count} • +{challenge.xp_reward} XP</p>
                </div>
                {isCompleted && !isClaimed && (
                  <Button size="sm" variant="gradient" className="h-7 text-xs" onClick={() => claimChallengeXP(challenge.id, challenge.xp_reward)}>
                    <Gift className="h-3 w-3 mr-1" />
                    Claim
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Badges */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Trophy className="h-5 w-5 text-accent" />
          <h3 className="font-display font-bold">Badges</h3>
          <span className="text-xs text-muted-foreground">({earnedBadges.length}/{badges.length})</span>
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
          {badges.map(badge => {
            const earned = earnedBadgeIds.has(badge.id);
            return (
              <div
                key={badge.id}
                className={cn(
                  "flex flex-col items-center p-2 rounded-xl border text-center transition-all",
                  earned ? "bg-accent/10 border-accent/30 scale-100" : "bg-muted/30 border-border opacity-40 grayscale"
                )}
                title={`${badge.name}: ${badge.description}`}
              >
                <span className="text-2xl mb-1">{badge.icon}</span>
                <p className="text-[10px] font-medium leading-tight truncate w-full">{badge.name}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
    </>
  );
}

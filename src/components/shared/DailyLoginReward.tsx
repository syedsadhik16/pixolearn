import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Gift, Flame, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { CelebrationOverlay } from './CelebrationOverlay';
import { awardXP } from '@/lib/gamification';
import { playRewardSound } from '@/lib/sounds';

const REWARD_SCHEDULE = [5, 10, 15, 20, 25, 35, 50]; // XP per consecutive day (7-day cycle)

export function DailyLoginReward() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [claimed, setClaimed] = useState(false);
  const [consecutiveDays, setConsecutiveDays] = useState(0);
  const [todayReward, setTodayReward] = useState(5);
  const [showCelebration, setShowCelebration] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) checkLoginReward();
  }, [user]);

  const checkLoginReward = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Check if already claimed today
      const { data: todayRewardData } = await supabase
        .from('daily_login_rewards')
        .select('*')
        .eq('student_id', user!.id)
        .eq('login_date', today)
        .maybeSingle();

      if (todayRewardData) {
        setClaimed(true);
        setConsecutiveDays(todayRewardData.consecutive_days);
        setLoading(false);
        return;
      }

      // Check yesterday for streak
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      const { data: yesterdayData } = await supabase
        .from('daily_login_rewards')
        .select('consecutive_days')
        .eq('student_id', user!.id)
        .eq('login_date', yesterdayStr)
        .maybeSingle();

      const streak = yesterdayData ? yesterdayData.consecutive_days + 1 : 1;
      const rewardIdx = Math.min(streak - 1, REWARD_SCHEDULE.length - 1);
      setConsecutiveDays(streak);
      setTodayReward(REWARD_SCHEDULE[rewardIdx]);
    } catch (e) {
      console.error('Login reward check error:', e);
    } finally {
      setLoading(false);
    }
  };

  const claimReward = async () => {
    if (!user || claimed) return;
    try {
      const today = new Date().toISOString().split('T')[0];

      await supabase.from('daily_login_rewards').insert({
        student_id: user.id,
        login_date: today,
        consecutive_days: consecutiveDays,
        xp_rewarded: todayReward,
      });

      await awardXP(user.id, todayReward, 'daily_login', today);

      setClaimed(true);
      setShowCelebration(true);
      playRewardSound();
      toast({ title: `+${todayReward} XP! 🎁`, description: `Day ${consecutiveDays} login streak!` });
    } catch (e) {
      console.error('Claim login reward error:', e);
    }
  };

  if (loading || claimed) return null;

  return (
    <>
      <CelebrationOverlay
        show={showCelebration}
        type="level_up"
        title={`+${todayReward} XP!`}
        subtitle={`Day ${consecutiveDays} login streak 🔥`}
        icon="🎁"
        onComplete={() => setShowCelebration(false)}
      />
      <div className="pixo-card bg-gradient-to-r from-accent/20 to-primary/20 border-accent/30 animate-scale-in">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-accent/20 flex items-center justify-center animate-bounce-gentle">
            <Gift className="h-7 w-7 text-accent" />
          </div>
          <div className="flex-1">
            <h3 className="font-display font-bold">Daily Login Reward!</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Flame className="h-4 w-4 text-primary" />
              <span>Day {consecutiveDays} streak</span>
              <span>•</span>
              <span className="font-bold text-primary">+{todayReward} XP</span>
            </div>
            {/* 7-day progress dots */}
            <div className="flex gap-1 mt-2">
              {REWARD_SCHEDULE.map((xp, i) => (
                <div
                  key={i}
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold border transition-all ${
                    i < consecutiveDays
                      ? 'bg-primary text-primary-foreground border-primary'
                      : i === consecutiveDays - 1
                      ? 'bg-accent text-accent-foreground border-accent ring-2 ring-accent/30'
                      : 'bg-muted text-muted-foreground border-border'
                  }`}
                >
                  {xp}
                </div>
              ))}
            </div>
          </div>
          <Button variant="gradient" size="lg" onClick={claimReward} className="shrink-0">
            <Zap className="h-5 w-5 mr-1" />
            Claim
          </Button>
        </div>
      </div>
    </>
  );
}

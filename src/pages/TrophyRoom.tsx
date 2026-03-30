import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { BottomNav } from '@/components/layout/BottomNav';
import { HamburgerMenu } from '@/components/layout/HamburgerMenu';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useCompanion } from '@/hooks/useCompanion';
import { useCurriculumProgress } from '@/hooks/useCurriculumProgress';
import { useTranslation } from '@/hooks/useTranslation';
import { ProgressRing } from '@/components/shared/ProgressRing';
import { Trophy, Star, Medal, Award, Sparkles, Lock, Crown, Map } from 'lucide-react';

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  xp_reward: number;
}

interface EarnedBadge {
  badge_id: string;
  earned_at: string;
}

export default function TrophyRoom() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const companion = useCompanion();
  const { t } = useTranslation();
  const { progress, completedDayIds, days } = useCurriculumProgress(user?.id);

  const [badges, setBadges] = useState<Badge[]>([]);
  const [earnedBadges, setEarnedBadges] = useState<EarnedBadge[]>([]);
  const [totalXp, setTotalXp] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from('badges').select('*'),
      supabase.from('student_badges').select('badge_id, earned_at').eq('student_id', user.id),
      supabase.from('student_xp').select('total_xp').eq('student_id', user.id).maybeSingle(),
    ]).then(([badgesRes, earnedRes, xpRes]) => {
      if (badgesRes.data) setBadges(badgesRes.data as unknown as Badge[]);
      if (earnedRes.data) setEarnedBadges(earnedRes.data as unknown as EarnedBadge[]);
      if (xpRes.data) setTotalXp((xpRes.data as any).total_xp || 0);
      setLoading(false);
    });
  }, [user]);

  const earnedBadgeIds = new Set(earnedBadges.map(b => b.badge_id));
  const currentDay = progress?.current_day || 1;
  const completedCount = completedDayIds.size;
  const progressPercent = Math.round((completedCount / 180) * 100);

  const milestones = [
    { day: 7, label: 'Week 1', emoji: '🌱' },
    { day: 15, label: '15 Days', emoji: '📚' },
    { day: 30, label: '1 Month', emoji: '🔥' },
    { day: 60, label: '2 Months', emoji: '⚡' },
    { day: 90, label: 'Halfway', emoji: '🏔️' },
    { day: 120, label: '4 Months', emoji: '🚀' },
    { day: 150, label: '5 Months', emoji: '💎' },
    { day: 180, label: 'Complete!', emoji: '🏆' },
  ];

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-pulse text-center">
            <Trophy className="h-10 w-10 text-pixo-yellow mx-auto mb-3" />
            <p className="text-muted-foreground">{t('loadingTrophies')}</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 pb-24">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <img src={companion.image} alt={companion.name} className="w-14 h-14 object-contain animate-float" />
          <div>
            <h1 className="text-2xl font-display font-bold">
              {t('hallOfFame')} 🏆
            </h1>
            <p className="text-sm text-muted-foreground">
              {t('hiExplorer').replace('{name}', profile?.full_name?.split(' ')[0] || t('learner'))}
            </p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="pixo-card text-center py-4">
            <Sparkles className="h-6 w-6 text-pixo-yellow mx-auto mb-1" />
            <p className="text-2xl font-display font-bold">{totalXp}</p>
            <p className="text-xs text-muted-foreground">{t('totalXP')}</p>
          </div>
          <div className="pixo-card text-center py-4">
            <Medal className="h-6 w-6 text-pixo-orange mx-auto mb-1" />
            <p className="text-2xl font-display font-bold">{earnedBadges.length}</p>
            <p className="text-xs text-muted-foreground">{t('badges')}</p>
          </div>
          <div className="pixo-card text-center py-4">
            <Star className="h-6 w-6 text-pixo-green mx-auto mb-1" />
            <p className="text-2xl font-display font-bold">{completedCount}</p>
            <p className="text-xs text-muted-foreground">{t('completedDays')}</p>
          </div>
        </div>

        {/* 180-Day Roadmap Progress */}
        <div className="pixo-card mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Map className="h-5 w-5 text-primary" />
            <h2 className="font-display font-bold">{t('dayRoadmap')}</h2>
          </div>
          <div className="flex items-center gap-3 mb-4">
            <ProgressRing progress={progressPercent} size={72}>
              <span className="text-sm font-bold">{progressPercent}%</span>
            </ProgressRing>
            <div>
              <p className="font-semibold">{t('masteryLevel')}: {progressPercent}%</p>
              <p className="text-sm text-muted-foreground">
                {t('day')} {currentDay} {t('of')} 180
              </p>
            </div>
          </div>

          {/* Milestone Track */}
          <div className="grid grid-cols-4 gap-2">
            {milestones.map((ms) => {
              const reached = currentDay >= ms.day;
              return (
                <div
                  key={ms.day}
                  className={`text-center p-2 rounded-xl border transition-all ${
                    reached
                      ? 'bg-primary/10 border-primary/30'
                      : 'bg-muted/50 border-border opacity-50'
                  }`}
                >
                  <span className="text-xl">{reached ? ms.emoji : '🔒'}</span>
                  <p className="text-[10px] font-bold mt-1">{ms.label}</p>
                  <p className="text-[9px] text-muted-foreground">{t('day')} {ms.day}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Trophy Room - Badges */}
        <div className="pixo-card">
          <div className="flex items-center gap-2 mb-4">
            <Award className="h-5 w-5 text-pixo-orange" />
            <h2 className="font-display font-bold">{t('trophyRoom')}</h2>
          </div>

          {badges.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">{t('noBadgesAvailable')}</p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {badges.map((badge) => {
                const earned = earnedBadgeIds.has(badge.id);
                return (
                  <div
                    key={badge.id}
                    className={`text-center p-3 rounded-xl border transition-all ${
                      earned
                        ? 'bg-pixo-yellow/5 border-pixo-yellow/30'
                        : 'bg-muted/30 border-border opacity-40'
                    }`}
                  >
                    <span className="text-3xl block mb-1">{badge.icon}</span>
                    <p className="text-xs font-bold truncate">{badge.name}</p>
                    {earned ? (
                      <p className="text-[10px] text-pixo-green font-semibold mt-1">✓ {t('earned')}</p>
                    ) : (
                      <Lock className="h-3 w-3 text-muted-foreground mx-auto mt-1" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <HamburgerMenu />
      <BottomNav />
    </Layout>
  );
}

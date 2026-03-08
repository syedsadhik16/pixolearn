import { supabase } from '@/integrations/supabase/client';

/**
 * Award XP to a student for various actions.
 * Call this from any feature page when the student performs an XP-worthy action.
 */
export async function awardXP(
  studentId: string,
  amount: number,
  source: string,
  sourceId?: string
): Promise<number | null> {
  try {
    const { data, error } = await supabase.rpc('award_xp', {
      _student_id: studentId,
      _xp_amount: amount,
      _source: source,
      _source_id: sourceId || null,
    });
    if (error) throw error;
    return data as number;
  } catch (e) {
    console.error('Failed to award XP:', e);
    return null;
  }
}

/**
 * Track progress on a daily challenge.
 */
export async function trackChallengeProgress(
  studentId: string,
  challengeType: string
) {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Get active challenges of this type
    const { data: challenges } = await supabase
      .from('daily_challenges')
      .select('id, target_count, xp_reward')
      .eq('challenge_type', challengeType)
      .eq('is_active', true);

    if (!challenges || challenges.length === 0) return;

    for (const challenge of challenges) {
      // Upsert student_challenge record
      const { data: existing } = await supabase
        .from('student_challenges')
        .select('id, current_count, completed')
        .eq('student_id', studentId)
        .eq('challenge_id', challenge.id)
        .eq('challenge_date', today)
        .maybeSingle();

      if (existing) {
        if (!existing.completed) {
          const newCount = (existing.current_count || 0) + 1;
          const isComplete = newCount >= challenge.target_count;
          await supabase
            .from('student_challenges')
            .update({ current_count: newCount, completed: isComplete })
            .eq('id', existing.id);
        }
      } else {
        const isComplete = 1 >= challenge.target_count;
        await supabase.from('student_challenges').insert({
          student_id: studentId,
          challenge_id: challenge.id,
          challenge_date: today,
          current_count: 1,
          completed: isComplete,
        });
      }
    }
  } catch (e) {
    console.error('Failed to track challenge:', e);
  }
}

/**
 * Check and award any newly-earned badges.
 */
export async function checkAndAwardBadges(studentId: string) {
  try {
    // Get all badges and what student has earned
    const [badgesRes, earnedRes, completionsRes, xpRes, savedWordsRes, attendanceRes] = await Promise.all([
      supabase.from('badges').select('*'),
      supabase.from('student_badges').select('badge_id').eq('student_id', studentId),
      supabase.from('lesson_completions').select('id, pronunciation_score, fluency_score, clarity_score, confidence_score').eq('student_id', studentId),
      supabase.from('student_xp').select('total_xp').eq('student_id', studentId).maybeSingle(),
      supabase.from('saved_words').select('id').eq('student_id', studentId),
      supabase.from('attendance').select('date, lesson_completed').eq('student_id', studentId).eq('is_present', true).order('date', { ascending: false }),
    ]);

    const allBadges = badgesRes.data || [];
    const earnedIds = new Set((earnedRes.data || []).map(e => e.badge_id));
    const completionCount = (completionsRes.data || []).length;
    const totalXP = xpRes.data?.total_xp || 0;
    const savedWordsCount = (savedWordsRes.data || []).length;

    // Calculate streak
    let streak = 0;
    const attendance = attendanceRes.data || [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 0; i < attendance.length; i++) {
      const d = new Date(attendance[i].date);
      d.setHours(0, 0, 0, 0);
      const expected = new Date(today);
      expected.setDate(expected.getDate() - i);
      if (d.getTime() === expected.getTime() && attendance[i].lesson_completed) {
        streak++;
      } else break;
    }

    // Check high scores
    const hasHighScore = (completionsRes.data || []).some(c => {
      const scores = [c.pronunciation_score, c.fluency_score, c.clarity_score, c.confidence_score].filter((s): s is number => s !== null);
      const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
      return avg >= 90;
    });
    const hasPerfectScore = (completionsRes.data || []).some(c => {
      const scores = [c.pronunciation_score, c.fluency_score, c.clarity_score, c.confidence_score].filter((s): s is number => s !== null);
      const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
      return avg >= 100;
    });

    const newBadges: string[] = [];

    for (const badge of allBadges) {
      if (earnedIds.has(badge.id)) continue;

      let earned = false;
      switch (badge.requirement_type) {
        case 'lessons_completed':
          earned = completionCount >= badge.requirement_value;
          break;
        case 'streak':
          earned = streak >= badge.requirement_value;
          break;
        case 'saved_words':
          earned = savedWordsCount >= badge.requirement_value;
          break;
        case 'total_xp':
          earned = totalXP >= badge.requirement_value;
          break;
        case 'high_score':
          earned = hasHighScore;
          break;
        case 'perfect_score':
          earned = hasPerfectScore;
          break;
      }

      if (earned) {
        newBadges.push(badge.id);
      }
    }

    // Award new badges
    if (newBadges.length > 0) {
      await supabase.from('student_badges').insert(
        newBadges.map(badgeId => ({ student_id: studentId, badge_id: badgeId }))
      );

      // Award XP for badge rewards
      for (const badgeId of newBadges) {
        const badge = allBadges.find(b => b.id === badgeId);
        if (badge && badge.xp_reward > 0) {
          await awardXP(studentId, badge.xp_reward, 'badge_reward', badgeId);
        }
      }
    }

    return newBadges.length;
  } catch (e) {
    console.error('Failed to check badges:', e);
    return 0;
  }
}

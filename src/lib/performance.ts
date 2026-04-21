import { supabase } from '@/integrations/supabase/client';

export type SkillCode = 'phonics' | 'vocabulary' | 'reading' | 'speaking' | 'confidence';
export type MasteryLevel = 'weak' | 'developing' | 'improving' | 'strong';

export const SKILL_AREAS: { code: SkillCode; label: string; emoji: string }[] = [
  { code: 'phonics', label: 'Phonics', emoji: '🔤' },
  { code: 'vocabulary', label: 'Vocabulary', emoji: '📖' },
  { code: 'reading', label: 'Reading', emoji: '📚' },
  { code: 'speaking', label: 'Speaking', emoji: '🎤' },
  { code: 'confidence', label: 'Confidence', emoji: '✨' },
];

export interface SkillPerformance {
  code: SkillCode;
  label: string;
  emoji: string;
  accuracy: number;
  attempts: number;
  mastery: MasteryLevel;
}

export interface PerformanceSummary {
  overall_accuracy: number;
  total_attempts: number;
  strong_skills: SkillPerformance[];
  weak_skills: SkillPerformance[];
  improving_skills: SkillPerformance[];
  by_skill: SkillPerformance[];
  recommendation: string;
  trend_last_7_days: { date: string; accuracy: number }[];
}

function classify(acc: number): MasteryLevel {
  if (acc >= 75) return 'strong';
  if (acc >= 60) return 'improving';
  if (acc >= 40) return 'developing';
  return 'weak';
}

export async function getStudentPerformance(
  studentId: string,
  levelNo?: number
): Promise<PerformanceSummary> {
  // Pull topic state grouped by skill
  let stateQuery = supabase
    .from('student_topic_state')
    .select('skill_code, recent_accuracy, total_attempts, total_correct, mastery_level, level_no')
    .eq('learner_id', studentId);

  if (levelNo) stateQuery = stateQuery.eq('level_no', levelNo);

  const { data: states } = await stateQuery;

  const bySkill: SkillPerformance[] = SKILL_AREAS.map((s) => {
    const rows = (states ?? []).filter((r) => r.skill_code === s.code);
    const totalAttempts = rows.reduce((a, r) => a + (r.total_attempts ?? 0), 0);
    const totalCorrect = rows.reduce((a, r) => a + (r.total_correct ?? 0), 0);
    const acc = totalAttempts > 0 ? Math.round((totalCorrect * 100) / totalAttempts) : 0;
    return {
      code: s.code,
      label: s.label,
      emoji: s.emoji,
      accuracy: acc,
      attempts: totalAttempts,
      mastery: classify(acc),
    };
  });

  const overallAttempts = bySkill.reduce((a, s) => a + s.attempts, 0);
  const overallAcc =
    overallAttempts > 0
      ? Math.round(
          bySkill.reduce((a, s) => a + s.accuracy * s.attempts, 0) / overallAttempts
        )
      : 0;

  // 7-day trend from practice_quiz_attempts
  const since = new Date();
  since.setDate(since.getDate() - 6);
  const { data: recent } = await supabase
    .from('practice_quiz_attempts')
    .select('is_correct, created_at')
    .eq('learner_id', studentId)
    .gte('created_at', since.toISOString());

  const dayBuckets = new Map<string, { c: number; t: number }>();
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dayBuckets.set(d.toISOString().slice(0, 10), { c: 0, t: 0 });
  }
  (recent ?? []).forEach((r) => {
    const key = r.created_at.slice(0, 10);
    const b = dayBuckets.get(key);
    if (b) {
      b.t += 1;
      if (r.is_correct) b.c += 1;
    }
  });

  const trend = Array.from(dayBuckets.entries()).map(([date, b]) => ({
    date,
    accuracy: b.t > 0 ? Math.round((b.c * 100) / b.t) : 0,
  }));

  const sortedAttempts = bySkill.filter((s) => s.attempts > 0);
  const weak = sortedAttempts.filter((s) => s.mastery === 'weak' || s.mastery === 'developing');
  const strong = sortedAttempts.filter((s) => s.mastery === 'strong');
  const improving = sortedAttempts.filter((s) => s.mastery === 'improving');

  const recommendation = weak.length
    ? `Focus on ${weak[0].label} next — small daily practice will unlock big wins.`
    : strong.length === SKILL_AREAS.length
      ? 'Amazing! Keep your streak going with a quick daily warmup.'
      : 'Great progress! Try a Sprint round to push your top skill higher.';

  return {
    overall_accuracy: overallAcc,
    total_attempts: overallAttempts,
    strong_skills: strong,
    weak_skills: weak,
    improving_skills: improving,
    by_skill: bySkill,
    recommendation,
    trend_last_7_days: trend,
  };
}

import { supabase } from '@/integrations/supabase/client';
import type {
  CurriculumDay,
  CurriculumDayPart,
  CurriculumMonth,
  CurriculumWeek,
  LearnerCurriculumProgress,
  LearnerDayAttempt,
  LearnerHiddenMastery,
  MasteryState,
} from './curriculum-types';
import { MASTERY_THRESHOLD } from './curriculum-types';

const LEVEL_CODE = 'level_1';

// ─── Curriculum Data Fetchers ────────────────────────────────────

export async function fetchLevelId(): Promise<string | null> {
  const { data } = await supabase
    .from('curriculum_levels')
    .select('id')
    .eq('level_code', LEVEL_CODE)
    .single();
  return data?.id ?? null;
}

export async function fetchMonths(levelId: string): Promise<CurriculumMonth[]> {
  const { data } = await supabase
    .from('curriculum_months')
    .select('*')
    .eq('level_id', levelId)
    .order('sort_order');
  return (data as CurriculumMonth[]) || [];
}

export async function fetchWeeks(levelId: string): Promise<CurriculumWeek[]> {
  const { data } = await supabase
    .from('curriculum_weeks')
    .select('*')
    .eq('level_id', levelId)
    .order('sort_order');
  return (data as CurriculumWeek[]) || [];
}

export async function fetchDay(levelId: string, dayNumber: number): Promise<CurriculumDay | null> {
  const { data } = await supabase
    .from('curriculum_days')
    .select('*')
    .eq('level_id', levelId)
    .eq('day_number', dayNumber)
    .single();
  return (data as CurriculumDay) || null;
}

export async function fetchDayParts(dayId: string): Promise<CurriculumDayPart[]> {
  const { data } = await supabase
    .from('curriculum_day_parts')
    .select('*')
    .eq('curriculum_day_id', dayId)
    .order('sort_order');
  return (data as CurriculumDayPart[]) || [];
}

export async function fetchAllDays(levelId: string): Promise<CurriculumDay[]> {
  const { data } = await supabase
    .from('curriculum_days')
    .select('*')
    .eq('level_id', levelId)
    .order('day_number');
  return (data as CurriculumDay[]) || [];
}

// ─── Learner Progress ────────────────────────────────────────────

export async function fetchOrCreateProgress(
  learnerId: string,
  levelId: string
): Promise<LearnerCurriculumProgress> {
  const { data: existing } = await supabase
    .from('learner_curriculum_progress')
    .select('*')
    .eq('learner_id', learnerId)
    .eq('level_id', levelId)
    .single();

  if (existing) return existing as LearnerCurriculumProgress;

  const { data: created } = await supabase
    .from('learner_curriculum_progress')
    .insert({ learner_id: learnerId, level_id: levelId })
    .select()
    .single();

  return created as LearnerCurriculumProgress;
}

export async function advanceDay(
  learnerId: string,
  levelId: string,
  currentDay: number
): Promise<void> {
  const nextDay = Math.min(currentDay + 1, 180);
  const nextWeek = Math.ceil(nextDay / 6);
  const nextMonth = nextWeek <= 5 ? 1 : nextWeek <= 10 ? 2 : nextWeek <= 15 ? 3 : nextWeek <= 20 ? 4 : nextWeek <= 25 ? 5 : 6;

  await supabase
    .from('learner_curriculum_progress')
    .update({
      current_day: nextDay,
      current_week: nextWeek,
      current_month: nextMonth,
      completion_percent: Math.round((nextDay / 180) * 10000) / 100,
      level_unlocked_next: nextDay >= 180,
      level_status: nextDay >= 180 ? 'completed' : 'active',
    })
    .eq('learner_id', learnerId)
    .eq('level_id', levelId);
}

// ─── Day Attempts ────────────────────────────────────────────────

export async function startDayAttempt(
  learnerId: string,
  dayId: string
): Promise<LearnerDayAttempt> {
  // Check for existing in-progress attempt
  const { data: existing } = await supabase
    .from('learner_day_attempts')
    .select('*')
    .eq('learner_id', learnerId)
    .eq('curriculum_day_id', dayId)
    .eq('completion_status', 'in_progress')
    .single();

  if (existing) return existing as LearnerDayAttempt;

  const { data } = await supabase
    .from('learner_day_attempts')
    .insert({
      learner_id: learnerId,
      curriculum_day_id: dayId,
      completion_status: 'in_progress',
    })
    .select()
    .single();

  return data as LearnerDayAttempt;
}

export async function completeDayAttempt(
  attemptId: string,
  scores: {
    accuracy_score: number;
    confidence_score: number;
    speaking_score: number;
    stars_earned: number;
    total_xp_earned: number;
    support_needed: boolean;
  }
): Promise<void> {
  const mastery = determineMastery(scores.accuracy_score, scores.confidence_score);

  await supabase
    .from('learner_day_attempts')
    .update({
      ...scores,
      completed_at: new Date().toISOString(),
      completion_status: 'completed',
      mastery_state: mastery,
      parent_sync_status: 'synced',
    })
    .eq('id', attemptId);
}

// ─── Hidden Mastery ──────────────────────────────────────────────

export function determineMastery(accuracy: number, confidence: number): MasteryState {
  if (accuracy >= MASTERY_THRESHOLD.accuracy && confidence >= MASTERY_THRESHOLD.confidence) {
    return 'stable';
  }
  if (accuracy >= 50 || confidence >= 2) {
    return 'developing';
  }
  return 'needs_support';
}

export async function updateHiddenMastery(
  learnerId: string,
  conceptType: string,
  conceptKey: string,
  accuracy: number,
  confidence: number,
  dayNumber: number,
  confusionPairs: string[] = []
): Promise<void> {
  const state = determineMastery(accuracy, confidence);
  const needsSupport = state === 'needs_support';
  const reviewDay = needsSupport ? dayNumber + 1 : null;

  await supabase
    .from('learner_hidden_mastery')
    .upsert(
      {
        learner_id: learnerId,
        concept_type: conceptType,
        concept_key: conceptKey,
        mastery_score: accuracy,
        confidence_score: confidence,
        last_seen_day: dayNumber,
        support_flag: needsSupport,
        recommended_review_day: reviewDay,
        strength_state: state,
        confusion_pairs: confusionPairs,
      },
      { onConflict: 'learner_id,concept_type,concept_key' }
    );
}

// ─── Parent Outputs ──────────────────────────────────────────────

export async function generateParentOutput(
  learnerId: string,
  day: CurriculumDay
): Promise<void> {
  await supabase.from('learner_parent_outputs').insert({
    learner_id: learnerId,
    curriculum_day_id: day.id,
    todays_target: day.parent_todays_target || day.title,
    words_or_sounds_learned: day.parent_words_learned || '',
    confidence_note: day.parent_confidence_note || 'Your child completed today\'s lesson with calm effort.',
    home_practice: day.parent_home_practice || 'Practice today\'s sounds together briefly.',
    praise_line: day.parent_praise_line || 'Praise careful listening and brave trying.',
  });
}

// ─── Level 2 Transition ─────────────────────────────────────────

export async function generateLevelTransition(
  learnerId: string,
  masteryData: LearnerHiddenMastery[]
): Promise<void> {
  const strengths = masteryData.filter(m => m.strength_state === 'stable').map(m => m.concept_key);
  const needs = masteryData.filter(m => m.strength_state === 'needs_support').map(m => m.concept_key);

  await supabase.from('learner_level_transitions').insert({
    learner_id: learnerId,
    from_level: 'level_1',
    to_level: 'level_2',
    readiness_summary: `Completed Level 1 with ${strengths.length} stable concepts.`,
    strengths,
    support_needs: needs,
    transition_status: 'ready',
  });
}

// ─── Weak Sounds for Adaptive Review ─────────────────────────────

export async function fetchWeakConcepts(learnerId: string): Promise<LearnerHiddenMastery[]> {
  const { data } = await supabase
    .from('learner_hidden_mastery')
    .select('*')
    .eq('learner_id', learnerId)
    .eq('support_flag', true)
    .order('mastery_score', { ascending: true });
  return (data as LearnerHiddenMastery[]) || [];
}

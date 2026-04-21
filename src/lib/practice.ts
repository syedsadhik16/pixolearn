import { supabase } from '@/integrations/supabase/client';
import type { SkillCode } from './performance';

export type PracticeStage = 'warmup' | 'strides' | 'sprint' | 'laps' | 'complete';
export type Difficulty = 'easy' | 'medium' | 'hard';

export const STAGES: { key: PracticeStage; label: string; emoji: string; questions: number }[] = [
  { key: 'warmup', label: 'Warmup', emoji: '🔥', questions: 3 },
  { key: 'strides', label: 'Strides', emoji: '👟', questions: 4 },
  { key: 'sprint', label: 'Sprint', emoji: '⚡', questions: 5 },
  { key: 'laps', label: 'Laps', emoji: '🏁', questions: 5 },
];

export interface PracticeQuestion {
  id: string;
  question_text: string;
  options: string[];
  correct_answer: string;
  hint?: string;
  explanation?: string;
  difficulty: Difficulty;
}

export interface PracticeSession {
  id: string;
  learner_id: string;
  skill_code: string;
  topic_key: string;
  topic_label: string | null;
  level_no: number | null;
  current_stage: PracticeStage;
  difficulty: Difficulty;
  total_questions: number;
  correct_count: number;
  accuracy_percent: number;
  status: 'active' | 'paused' | 'completed' | 'abandoned';
  resume_state: Record<string, unknown>;
}

export function nextStage(stage: PracticeStage): PracticeStage {
  const order: PracticeStage[] = ['warmup', 'strides', 'sprint', 'laps', 'complete'];
  const i = order.indexOf(stage);
  return order[Math.min(i + 1, order.length - 1)];
}

export async function getOrCreateSession(
  learnerId: string,
  skill: SkillCode,
  topicKey: string,
  topicLabel: string,
  levelNo: number
): Promise<PracticeSession> {
  // Look for existing active/paused session
  const { data: existing } = await supabase
    .from('practice_sessions')
    .select('*')
    .eq('learner_id', learnerId)
    .eq('skill_code', skill)
    .eq('topic_key', topicKey)
    .in('status', ['active', 'paused'])
    .order('last_active_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) return existing as unknown as PracticeSession;

  const { data: created, error } = await supabase
    .from('practice_sessions')
    .insert({
      learner_id: learnerId,
      skill_code: skill,
      topic_key: topicKey,
      topic_label: topicLabel,
      level_no: levelNo,
      current_stage: 'warmup',
      difficulty: 'easy',
      status: 'active',
    })
    .select('*')
    .single();

  if (error) throw error;
  return created as unknown as PracticeSession;
}

export async function fetchQuestions(
  skill: SkillCode,
  topicKey: string,
  topicLabel: string,
  levelNo: number,
  difficulty: Difficulty,
  count: number
): Promise<PracticeQuestion[]> {
  const { data, error } = await supabase.functions.invoke('practice-engine', {
    body: {
      action: 'generate',
      skill_code: skill,
      topic_key: topicKey,
      topic_label: topicLabel,
      level_no: levelNo,
      difficulty,
      count,
    },
  });
  if (error) throw error;
  const qs = (data?.questions ?? []) as Array<{
    id?: string;
    question_text: string;
    options: string[];
    correct_answer: string;
    hint?: string;
    explanation?: string;
    difficulty?: Difficulty;
  }>;
  return qs.map((q, i) => ({
    id: q.id ?? `q-${i}-${Date.now()}`,
    question_text: q.question_text,
    options: q.options,
    correct_answer: q.correct_answer,
    hint: q.hint,
    explanation: q.explanation,
    difficulty: q.difficulty ?? difficulty,
  }));
}

export async function submitAttempt(args: {
  sessionId: string;
  learnerId: string;
  question: PracticeQuestion;
  selected: string;
  stage: PracticeStage;
  skill: SkillCode;
  topicKey: string;
  timeSpent: number;
  hintUsed: boolean;
}) {
  const isCorrect = args.selected === args.question.correct_answer;

  // Insert attempt — trigger updates student_topic_state automatically
  const { error: attErr } = await supabase.from('practice_quiz_attempts').insert({
    session_id: args.sessionId,
    learner_id: args.learnerId,
    question_id: args.question.id.startsWith('q-') ? null : args.question.id,
    question_text: args.question.question_text,
    selected_answer: args.selected,
    correct_answer: args.question.correct_answer,
    is_correct: isCorrect,
    difficulty: args.question.difficulty,
    stage: args.stage,
    time_spent_seconds: args.timeSpent,
    hint_used: args.hintUsed,
    skill_code: args.skill,
    topic_key: args.topicKey,
  });
  if (attErr) throw attErr;

  // Update session counters
  const { data: session } = await supabase
    .from('practice_sessions')
    .select('total_questions, correct_count')
    .eq('id', args.sessionId)
    .single();

  if (session) {
    const total = (session.total_questions ?? 0) + 1;
    const correct = (session.correct_count ?? 0) + (isCorrect ? 1 : 0);
    const acc = Math.round((correct * 100) / total);
    await supabase
      .from('practice_sessions')
      .update({
        total_questions: total,
        correct_count: correct,
        accuracy_percent: acc,
        last_active_at: new Date().toISOString(),
      })
      .eq('id', args.sessionId);
  }

  return { isCorrect };
}

export async function advanceStage(sessionId: string, stage: PracticeStage) {
  const updates: Record<string, unknown> = {
    current_stage: stage,
    last_active_at: new Date().toISOString(),
  };
  if (stage === 'complete') {
    updates.status = 'completed';
    updates.completed_at = new Date().toISOString();
  }
  await supabase.from('practice_sessions').update(updates).eq('id', sessionId);
}

export async function saveResumeState(
  sessionId: string,
  resumeState: Record<string, unknown>
) {
  await supabase
    .from('practice_sessions')
    .update({ resume_state: resumeState, last_active_at: new Date().toISOString() })
    .eq('id', sessionId);
}

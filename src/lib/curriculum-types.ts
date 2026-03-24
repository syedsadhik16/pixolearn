// PIXO Learn Level 1 Curriculum Types
// Auto-generated from Master Curriculum Document

export interface CurriculumLevel {
  id: string;
  level_code: string;
  level_name: string;
  age_group: string;
  duration_days: number;
  duration_months: number;
  pedagogy_model: string;
  hidden_mastery_rule: string;
  final_badge: string;
  status: string;
}

export interface CurriculumMonth {
  id: string;
  level_id: string;
  month_number: number;
  month_title: string;
  month_goal: string | null;
  pedagogical_emphasis: string | null;
  milestone_badge: string;
  sort_order: number;
}

export interface CurriculumWeek {
  id: string;
  level_id: string;
  month_id: string;
  week_number: number;
  week_title: string;
  weekly_focus: string;
  weekly_reward_label: string;
  weekly_logic: string | null;
  sort_order: number;
}

export interface CurriculumDay {
  id: string;
  level_id: string;
  month_id: string;
  week_id: string;
  day_number: number;
  title: string;
  theme: string;
  main_game: string;
  reward_badge: string;
  daily_xp: number;
  weekly_reward_path: string | null;
  hidden_mastery_tags: string[];
  day_objective: string | null;
  target_skills: string[];
  target_content: Record<string, unknown>;
  success_criteria: string[];
  adaptive_logic: Record<string, unknown>;
  end_of_day_outcome: string[];
  parent_todays_target: string | null;
  parent_words_learned: string | null;
  parent_confidence_note: string | null;
  parent_home_practice: string | null;
  parent_praise_line: string | null;
  is_gate_day: boolean;
  is_milestone_day: boolean;
  unlock_type: string;
  status: string;
}

export interface CurriculumDayPart {
  id: string;
  curriculum_day_id: string;
  part_number: number;
  part_name: string;
  xp_value: number;
  duration_minutes: number;
  interaction_type: string;
  prompt_logic: Record<string, unknown>;
  support_logic: Record<string, unknown>;
  celebration_logic: Record<string, unknown>;
  sort_order: number;
}

export interface LearnerCurriculumProgress {
  id: string;
  learner_id: string;
  level_id: string;
  current_month: number;
  current_week: number;
  current_day: number;
  current_part: number;
  total_xp: number;
  streak_count: number;
  treasure_progress: number;
  weekly_badges: string[];
  monthly_badges: string[];
  completion_percent: number;
  level_status: string;
  level_unlocked_next: boolean;
}

export interface LearnerDayAttempt {
  id: string;
  learner_id: string;
  curriculum_day_id: string;
  started_at: string;
  completed_at: string | null;
  completion_status: string;
  total_xp_earned: number;
  stars_earned: number;
  confidence_score: number;
  speaking_score: number;
  accuracy_score: number;
  hesitation_time: number;
  support_needed: boolean;
  mastery_state: string;
  part_progress: Record<string, unknown>;
  parent_sync_status: string;
}

export interface LearnerHiddenMastery {
  id: string;
  learner_id: string;
  concept_type: string;
  concept_key: string;
  mastery_score: number;
  confidence_score: number;
  last_seen_day: number;
  support_flag: boolean;
  recommended_review_day: number | null;
  strength_state: string;
  confusion_pairs: string[];
}

export interface LearnerParentOutput {
  id: string;
  learner_id: string;
  curriculum_day_id: string;
  todays_target: string;
  words_or_sounds_learned: string;
  confidence_note: string;
  home_practice: string;
  praise_line: string;
  generated_at: string;
  opened_at: string | null;
}

export type MasteryState = 'stable' | 'developing' | 'needs_support';

export const MASTERY_THRESHOLD = {
  accuracy: 80,
  confidence: 3,
  speaking: 3,
};

export const XP_PER_PART = [5, 5, 10, 10, 10, 10] as const;
export const TOTAL_DAILY_XP = 50;

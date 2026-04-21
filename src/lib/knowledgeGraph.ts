import { supabase } from '@/integrations/supabase/client';
import type { SkillCode } from './performance';

export type NodeMastery = 'completed' | 'in_progress' | 'focus_needed' | 'locked' | 'related';

export interface GraphNode {
  id: string;
  label: string;
  week_no: number;
  day_no: number;
  skill_code: SkillCode;
  mastery: NodeMastery;
  accuracy: number;
  is_milestone: boolean;
  is_current: boolean;
}

export interface GraphEdge {
  from: string;
  to: string;
  is_weak_path: boolean;
}

export interface KnowledgeGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  current_node_id: string | null;
  weak_focus: GraphNode | null;
  recommendation: string;
}

const SKILL_FROM_TAGS = (tags: unknown[]): SkillCode => {
  const t = (tags ?? []).map((x) => String(x).toLowerCase());
  if (t.some((x) => x.includes('vocab'))) return 'vocabulary';
  if (t.some((x) => x.includes('read'))) return 'reading';
  if (t.some((x) => x.includes('speak'))) return 'speaking';
  if (t.some((x) => x.includes('confid'))) return 'confidence';
  return 'phonics';
};

export async function getKnowledgeGraph(
  studentId: string,
  levelNo = 1
): Promise<KnowledgeGraph> {
  // Pull level + days + progress in parallel
  const { data: level } = await supabase
    .from('curriculum_levels')
    .select('id')
    .eq('level_code', `L${levelNo}`)
    .maybeSingle();

  const levelId = level?.id;
  if (!levelId) {
    return { nodes: [], edges: [], current_node_id: null, weak_focus: null, recommendation: '' };
  }

  const [{ data: days }, { data: progress }, { data: completions }] = await Promise.all([
    supabase
      .from('curriculum_days')
      .select('id, day_number, title, hidden_mastery_tags, is_milestone_day')
      .eq('level_id', levelId)
      .order('day_number'),
    supabase
      .from('learner_curriculum_progress')
      .select('current_day')
      .eq('learner_id', studentId)
      .eq('level_id', levelId)
      .maybeSingle(),
    supabase
      .from('learner_day_attempts')
      .select('curriculum_day_id, completion_status, accuracy_score')
      .eq('learner_id', studentId),
  ]);

  const currentDay = progress?.current_day ?? 1;
  const completionMap = new Map<string, { status: string; acc: number }>();
  (completions ?? []).forEach((c) => {
    completionMap.set(c.curriculum_day_id, {
      status: c.completion_status,
      acc: Number(c.accuracy_score ?? 0),
    });
  });

  // Limit to first 4 weeks (28 days) for readability on mobile
  const visibleDays = (days ?? []).slice(0, 28);

  const nodes: GraphNode[] = visibleDays.map((d) => {
    const c = completionMap.get(d.id);
    let mastery: NodeMastery;
    if (c?.status === 'completed') {
      mastery = c.acc >= 75 ? 'completed' : c.acc >= 50 ? 'in_progress' : 'focus_needed';
    } else if (d.day_number === currentDay) {
      mastery = 'in_progress';
    } else if (d.day_number < currentDay) {
      mastery = 'focus_needed';
    } else {
      mastery = 'locked';
    }

    const week = Math.ceil(d.day_number / 7);
    return {
      id: d.id,
      label: d.title,
      week_no: week,
      day_no: d.day_number,
      skill_code: SKILL_FROM_TAGS((d.hidden_mastery_tags as unknown[]) ?? []),
      mastery,
      accuracy: c?.acc ?? 0,
      is_milestone: d.is_milestone_day ?? false,
      is_current: d.day_number === currentDay,
    };
  });

  // Sequential edges with weak-path highlight
  const edges: GraphEdge[] = [];
  for (let i = 0; i < nodes.length - 1; i++) {
    edges.push({
      from: nodes[i].id,
      to: nodes[i + 1].id,
      is_weak_path: nodes[i].mastery === 'focus_needed',
    });
  }

  const weakFocus = nodes.find((n) => n.mastery === 'focus_needed') ?? null;
  const currentNode = nodes.find((n) => n.is_current) ?? null;

  const recommendation = weakFocus
    ? `Revise Day ${weakFocus.day_no}: ${weakFocus.label} to strengthen your foundation.`
    : currentNode
      ? `You're on Day ${currentNode.day_no}: ${currentNode.label}. Keep going!`
      : 'Start your adventure with Day 1.';

  return {
    nodes,
    edges,
    current_node_id: currentNode?.id ?? null,
    weak_focus: weakFocus,
    recommendation,
  };
}

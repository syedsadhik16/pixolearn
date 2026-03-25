// PIXO AI MCP + RAG Response Types

export interface PIXOChatResponse {
  success: boolean;
  mode: 'student' | 'parent' | 'admin';
  answer: string;
  cards: AICard[];
  quick_actions: string[];
  sources: AISource[];
  metadata: Record<string, unknown>;
}

export interface LessonSupportResponse {
  success: boolean;
  title: string;
  explanation: string;
  examples: string[];
  mini_practice: MiniPractice[];
  encouragement: string;
  next_step: string;
  sources: AISource[];
  metadata: Record<string, unknown>;
}

export interface ParentInsightResponse {
  success: boolean;
  title: string;
  summary: string;
  strengths: string[];
  weak_areas: string[];
  home_support_steps: string[];
  recommended_focus: string[];
  sources: AISource[];
  metadata: Record<string, unknown>;
}

export interface KnowledgeSearchResponse {
  success: boolean;
  results: KnowledgeChunkResult[];
}

export interface AICard {
  type: 'info' | 'tip' | 'practice' | 'achievement';
  title: string;
  content: string;
  icon?: string;
}

export interface AISource {
  chunk_id: string;
  title: string;
  source_type: string;
  level_no?: number;
  week_no?: number;
  day_no?: number;
}

export interface MiniPractice {
  type: 'say_it' | 'pick_one' | 'fill_blank';
  prompt: string;
  answer?: string;
  options?: string[];
}

export interface KnowledgeChunkResult {
  chunk_id: string;
  title: string;
  content: string;
  source_type: string;
  level_no: number | null;
  week_no: number | null;
  day_no: number | null;
  lesson_part: number | null;
  similarity: number | null;
  metadata: Record<string, unknown>;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  cards?: AICard[];
  quick_actions?: string[];
  timestamp: Date;
}

export type AIMode = 'student' | 'parent';

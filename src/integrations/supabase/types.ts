export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      ai_interactions: {
        Row: {
          created_at: string
          id: string
          interaction_type: string
          mcp_tools_used: Json
          parent_id: string | null
          query: string
          response_json: Json
          response_text: string | null
          retrieved_chunks: Json
          role_context: string
          status: string
          student_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          interaction_type: string
          mcp_tools_used?: Json
          parent_id?: string | null
          query: string
          response_json?: Json
          response_text?: string | null
          retrieved_chunks?: Json
          role_context: string
          status?: string
          student_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          interaction_type?: string
          mcp_tools_used?: Json
          parent_id?: string | null
          query?: string
          response_json?: Json
          response_text?: string | null
          retrieved_chunks?: Json
          role_context?: string
          status?: string
          student_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_interactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_results: {
        Row: {
          answers: Json | null
          assigned_level: string
          created_at: string
          id: string
          score: number
          student_id: string
          time_taken_seconds: number | null
          total_questions: number
        }
        Insert: {
          answers?: Json | null
          assigned_level?: string
          created_at?: string
          id?: string
          score?: number
          student_id: string
          time_taken_seconds?: number | null
          total_questions?: number
        }
        Update: {
          answers?: Json | null
          assigned_level?: string
          created_at?: string
          id?: string
          score?: number
          student_id?: string
          time_taken_seconds?: number | null
          total_questions?: number
        }
        Relationships: [
          {
            foreignKeyName: "assessment_results_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance: {
        Row: {
          created_at: string
          date: string
          id: string
          is_present: boolean
          lesson_completed: boolean
          student_id: string
        }
        Insert: {
          created_at?: string
          date?: string
          id?: string
          is_present?: boolean
          lesson_completed?: boolean
          student_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          is_present?: boolean
          lesson_completed?: boolean
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      badges: {
        Row: {
          created_at: string
          description: string
          icon: string
          id: string
          name: string
          requirement_type: string
          requirement_value: number
          xp_reward: number
        }
        Insert: {
          created_at?: string
          description: string
          icon?: string
          id?: string
          name: string
          requirement_type?: string
          requirement_value?: number
          xp_reward?: number
        }
        Update: {
          created_at?: string
          description?: string
          icon?: string
          id?: string
          name?: string
          requirement_type?: string
          requirement_value?: number
          xp_reward?: number
        }
        Relationships: []
      }
      curriculum_day_parts: {
        Row: {
          celebration_logic: Json | null
          curriculum_day_id: string
          duration_minutes: number
          id: string
          interaction_type: string
          part_name: string
          part_number: number
          prompt_logic: Json | null
          sort_order: number
          support_logic: Json | null
          xp_value: number
        }
        Insert: {
          celebration_logic?: Json | null
          curriculum_day_id: string
          duration_minutes?: number
          id?: string
          interaction_type?: string
          part_name: string
          part_number: number
          prompt_logic?: Json | null
          sort_order: number
          support_logic?: Json | null
          xp_value: number
        }
        Update: {
          celebration_logic?: Json | null
          curriculum_day_id?: string
          duration_minutes?: number
          id?: string
          interaction_type?: string
          part_name?: string
          part_number?: number
          prompt_logic?: Json | null
          sort_order?: number
          support_logic?: Json | null
          xp_value?: number
        }
        Relationships: [
          {
            foreignKeyName: "curriculum_day_parts_curriculum_day_id_fkey"
            columns: ["curriculum_day_id"]
            isOneToOne: false
            referencedRelation: "curriculum_days"
            referencedColumns: ["id"]
          },
        ]
      }
      curriculum_days: {
        Row: {
          adaptive_logic: Json | null
          created_at: string
          daily_xp: number
          day_number: number
          day_objective: string | null
          end_of_day_outcome: Json | null
          hidden_mastery_tags: Json | null
          id: string
          is_gate_day: boolean
          is_milestone_day: boolean
          level_id: string
          main_game: string
          month_id: string
          parent_confidence_note: string | null
          parent_home_practice: string | null
          parent_praise_line: string | null
          parent_todays_target: string | null
          parent_words_learned: string | null
          reward_badge: string
          status: string
          success_criteria: Json | null
          target_content: Json | null
          target_skills: Json | null
          theme: string
          title: string
          unlock_type: string
          week_id: string
          weekly_reward_path: string | null
        }
        Insert: {
          adaptive_logic?: Json | null
          created_at?: string
          daily_xp?: number
          day_number: number
          day_objective?: string | null
          end_of_day_outcome?: Json | null
          hidden_mastery_tags?: Json | null
          id?: string
          is_gate_day?: boolean
          is_milestone_day?: boolean
          level_id: string
          main_game: string
          month_id: string
          parent_confidence_note?: string | null
          parent_home_practice?: string | null
          parent_praise_line?: string | null
          parent_todays_target?: string | null
          parent_words_learned?: string | null
          reward_badge: string
          status?: string
          success_criteria?: Json | null
          target_content?: Json | null
          target_skills?: Json | null
          theme: string
          title: string
          unlock_type?: string
          week_id: string
          weekly_reward_path?: string | null
        }
        Update: {
          adaptive_logic?: Json | null
          created_at?: string
          daily_xp?: number
          day_number?: number
          day_objective?: string | null
          end_of_day_outcome?: Json | null
          hidden_mastery_tags?: Json | null
          id?: string
          is_gate_day?: boolean
          is_milestone_day?: boolean
          level_id?: string
          main_game?: string
          month_id?: string
          parent_confidence_note?: string | null
          parent_home_practice?: string | null
          parent_praise_line?: string | null
          parent_todays_target?: string | null
          parent_words_learned?: string | null
          reward_badge?: string
          status?: string
          success_criteria?: Json | null
          target_content?: Json | null
          target_skills?: Json | null
          theme?: string
          title?: string
          unlock_type?: string
          week_id?: string
          weekly_reward_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "curriculum_days_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "curriculum_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "curriculum_days_month_id_fkey"
            columns: ["month_id"]
            isOneToOne: false
            referencedRelation: "curriculum_months"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "curriculum_days_week_id_fkey"
            columns: ["week_id"]
            isOneToOne: false
            referencedRelation: "curriculum_weeks"
            referencedColumns: ["id"]
          },
        ]
      }
      curriculum_levels: {
        Row: {
          age_group: string
          created_at: string
          duration_days: number
          duration_months: number
          final_badge: string
          hidden_mastery_rule: string
          id: string
          level_code: string
          level_name: string
          pedagogy_model: string
          status: string
        }
        Insert: {
          age_group?: string
          created_at?: string
          duration_days?: number
          duration_months?: number
          final_badge?: string
          hidden_mastery_rule?: string
          id?: string
          level_code: string
          level_name: string
          pedagogy_model?: string
          status?: string
        }
        Update: {
          age_group?: string
          created_at?: string
          duration_days?: number
          duration_months?: number
          final_badge?: string
          hidden_mastery_rule?: string
          id?: string
          level_code?: string
          level_name?: string
          pedagogy_model?: string
          status?: string
        }
        Relationships: []
      }
      curriculum_months: {
        Row: {
          id: string
          level_id: string
          milestone_badge: string
          month_goal: string | null
          month_number: number
          month_title: string
          pedagogical_emphasis: string | null
          sort_order: number
        }
        Insert: {
          id?: string
          level_id: string
          milestone_badge: string
          month_goal?: string | null
          month_number: number
          month_title: string
          pedagogical_emphasis?: string | null
          sort_order: number
        }
        Update: {
          id?: string
          level_id?: string
          milestone_badge?: string
          month_goal?: string | null
          month_number?: number
          month_title?: string
          pedagogical_emphasis?: string | null
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "curriculum_months_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "curriculum_levels"
            referencedColumns: ["id"]
          },
        ]
      }
      curriculum_weeks: {
        Row: {
          id: string
          level_id: string
          month_id: string
          sort_order: number
          week_number: number
          week_title: string
          weekly_focus: string
          weekly_logic: string | null
          weekly_reward_label: string
        }
        Insert: {
          id?: string
          level_id: string
          month_id: string
          sort_order: number
          week_number: number
          week_title: string
          weekly_focus: string
          weekly_logic?: string | null
          weekly_reward_label: string
        }
        Update: {
          id?: string
          level_id?: string
          month_id?: string
          sort_order?: number
          week_number?: number
          week_title?: string
          weekly_focus?: string
          weekly_logic?: string | null
          weekly_reward_label?: string
        }
        Relationships: [
          {
            foreignKeyName: "curriculum_weeks_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "curriculum_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "curriculum_weeks_month_id_fkey"
            columns: ["month_id"]
            isOneToOne: false
            referencedRelation: "curriculum_months"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_challenges: {
        Row: {
          challenge_type: string
          created_at: string
          description: string
          id: string
          is_active: boolean
          target_count: number
          title: string
          xp_reward: number
        }
        Insert: {
          challenge_type?: string
          created_at?: string
          description: string
          id?: string
          is_active?: boolean
          target_count?: number
          title: string
          xp_reward?: number
        }
        Update: {
          challenge_type?: string
          created_at?: string
          description?: string
          id?: string
          is_active?: boolean
          target_count?: number
          title?: string
          xp_reward?: number
        }
        Relationships: []
      }
      daily_login_rewards: {
        Row: {
          claimed_at: string
          consecutive_days: number
          id: string
          login_date: string
          student_id: string
          xp_rewarded: number
        }
        Insert: {
          claimed_at?: string
          consecutive_days?: number
          id?: string
          login_date?: string
          student_id: string
          xp_rewarded?: number
        }
        Update: {
          claimed_at?: string
          consecutive_days?: number
          id?: string
          login_date?: string
          student_id?: string
          xp_rewarded?: number
        }
        Relationships: [
          {
            foreignKeyName: "daily_login_rewards_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      hidden_mastery_events: {
        Row: {
          confidence: number | null
          created_at: string
          curriculum_day_id: string | null
          id: string
          lesson_part: number | null
          metadata: Json
          score: number | null
          skill_code: string
          source: string
          student_id: string
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          curriculum_day_id?: string | null
          id?: string
          lesson_part?: number | null
          metadata?: Json
          score?: number | null
          skill_code: string
          source?: string
          student_id: string
        }
        Update: {
          confidence?: number | null
          created_at?: string
          curriculum_day_id?: string | null
          id?: string
          lesson_part?: number | null
          metadata?: Json
          score?: number | null
          skill_code?: string
          source?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hidden_mastery_events_curriculum_day_id_fkey"
            columns: ["curriculum_day_id"]
            isOneToOne: false
            referencedRelation: "curriculum_days"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hidden_mastery_events_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_chunks: {
        Row: {
          chunk_index: number
          chunk_type: string | null
          content: string
          created_at: string
          day_no: number | null
          document_id: string
          embedding: string | null
          id: string
          lesson_part: number | null
          level_no: number | null
          metadata: Json
          skill_code: string | null
          tags: string[]
          updated_at: string
          visibility: string
          week_no: number | null
        }
        Insert: {
          chunk_index: number
          chunk_type?: string | null
          content: string
          created_at?: string
          day_no?: number | null
          document_id: string
          embedding?: string | null
          id?: string
          lesson_part?: number | null
          level_no?: number | null
          metadata?: Json
          skill_code?: string | null
          tags?: string[]
          updated_at?: string
          visibility?: string
          week_no?: number | null
        }
        Update: {
          chunk_index?: number
          chunk_type?: string | null
          content?: string
          created_at?: string
          day_no?: number | null
          document_id?: string
          embedding?: string | null
          id?: string
          lesson_part?: number | null
          level_no?: number | null
          metadata?: Json
          skill_code?: string | null
          tags?: string[]
          updated_at?: string
          visibility?: string
          week_no?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_chunks_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "knowledge_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_documents: {
        Row: {
          audience: string
          created_at: string
          day_no: number | null
          id: string
          level_no: number | null
          metadata: Json
          source_type: string
          status: string
          title: string
          topic: string | null
          updated_at: string
          week_no: number | null
        }
        Insert: {
          audience?: string
          created_at?: string
          day_no?: number | null
          id?: string
          level_no?: number | null
          metadata?: Json
          source_type: string
          status?: string
          title: string
          topic?: string | null
          updated_at?: string
          week_no?: number | null
        }
        Update: {
          audience?: string
          created_at?: string
          day_no?: number | null
          id?: string
          level_no?: number | null
          metadata?: Json
          source_type?: string
          status?: string
          title?: string
          topic?: string | null
          updated_at?: string
          week_no?: number | null
        }
        Relationships: []
      }
      learner_curriculum_progress: {
        Row: {
          completion_percent: number
          created_at: string
          current_day: number
          current_month: number
          current_part: number
          current_week: number
          id: string
          learner_id: string
          level_id: string
          level_status: string
          level_unlocked_next: boolean
          monthly_badges: Json | null
          streak_count: number
          total_xp: number
          treasure_progress: number
          updated_at: string
          weekly_badges: Json | null
        }
        Insert: {
          completion_percent?: number
          created_at?: string
          current_day?: number
          current_month?: number
          current_part?: number
          current_week?: number
          id?: string
          learner_id: string
          level_id: string
          level_status?: string
          level_unlocked_next?: boolean
          monthly_badges?: Json | null
          streak_count?: number
          total_xp?: number
          treasure_progress?: number
          updated_at?: string
          weekly_badges?: Json | null
        }
        Update: {
          completion_percent?: number
          created_at?: string
          current_day?: number
          current_month?: number
          current_part?: number
          current_week?: number
          id?: string
          learner_id?: string
          level_id?: string
          level_status?: string
          level_unlocked_next?: boolean
          monthly_badges?: Json | null
          streak_count?: number
          total_xp?: number
          treasure_progress?: number
          updated_at?: string
          weekly_badges?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "learner_curriculum_progress_learner_id_fkey"
            columns: ["learner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learner_curriculum_progress_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "curriculum_levels"
            referencedColumns: ["id"]
          },
        ]
      }
      learner_day_attempts: {
        Row: {
          accuracy_score: number | null
          completed_at: string | null
          completion_status: string
          confidence_score: number | null
          created_at: string
          curriculum_day_id: string
          hesitation_time: number | null
          id: string
          learner_id: string
          mastery_state: string
          parent_sync_status: string
          part_progress: Json | null
          speaking_score: number | null
          stars_earned: number
          started_at: string
          support_needed: boolean
          total_xp_earned: number
        }
        Insert: {
          accuracy_score?: number | null
          completed_at?: string | null
          completion_status?: string
          confidence_score?: number | null
          created_at?: string
          curriculum_day_id: string
          hesitation_time?: number | null
          id?: string
          learner_id: string
          mastery_state?: string
          parent_sync_status?: string
          part_progress?: Json | null
          speaking_score?: number | null
          stars_earned?: number
          started_at?: string
          support_needed?: boolean
          total_xp_earned?: number
        }
        Update: {
          accuracy_score?: number | null
          completed_at?: string | null
          completion_status?: string
          confidence_score?: number | null
          created_at?: string
          curriculum_day_id?: string
          hesitation_time?: number | null
          id?: string
          learner_id?: string
          mastery_state?: string
          parent_sync_status?: string
          part_progress?: Json | null
          speaking_score?: number | null
          stars_earned?: number
          started_at?: string
          support_needed?: boolean
          total_xp_earned?: number
        }
        Relationships: [
          {
            foreignKeyName: "learner_day_attempts_curriculum_day_id_fkey"
            columns: ["curriculum_day_id"]
            isOneToOne: false
            referencedRelation: "curriculum_days"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learner_day_attempts_learner_id_fkey"
            columns: ["learner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      learner_hidden_mastery: {
        Row: {
          concept_key: string
          concept_type: string
          confidence_score: number
          confusion_pairs: Json | null
          created_at: string
          id: string
          last_seen_day: number
          learner_id: string
          mastery_score: number
          recommended_review_day: number | null
          strength_state: string
          support_flag: boolean
          updated_at: string
        }
        Insert: {
          concept_key: string
          concept_type: string
          confidence_score?: number
          confusion_pairs?: Json | null
          created_at?: string
          id?: string
          last_seen_day?: number
          learner_id: string
          mastery_score?: number
          recommended_review_day?: number | null
          strength_state?: string
          support_flag?: boolean
          updated_at?: string
        }
        Update: {
          concept_key?: string
          concept_type?: string
          confidence_score?: number
          confusion_pairs?: Json | null
          created_at?: string
          id?: string
          last_seen_day?: number
          learner_id?: string
          mastery_score?: number
          recommended_review_day?: number | null
          strength_state?: string
          support_flag?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "learner_hidden_mastery_learner_id_fkey"
            columns: ["learner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      learner_level_transitions: {
        Row: {
          bridge_word_list: Json | null
          family_support_plan: string | null
          from_level: string
          generated_at: string
          id: string
          learner_id: string
          readiness_summary: string | null
          strengths: Json | null
          support_needs: Json | null
          to_level: string
          transition_status: string
        }
        Insert: {
          bridge_word_list?: Json | null
          family_support_plan?: string | null
          from_level: string
          generated_at?: string
          id?: string
          learner_id: string
          readiness_summary?: string | null
          strengths?: Json | null
          support_needs?: Json | null
          to_level: string
          transition_status?: string
        }
        Update: {
          bridge_word_list?: Json | null
          family_support_plan?: string | null
          from_level?: string
          generated_at?: string
          id?: string
          learner_id?: string
          readiness_summary?: string | null
          strengths?: Json | null
          support_needs?: Json | null
          to_level?: string
          transition_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "learner_level_transitions_learner_id_fkey"
            columns: ["learner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      learner_parent_outputs: {
        Row: {
          confidence_note: string
          curriculum_day_id: string
          generated_at: string
          home_practice: string
          id: string
          learner_id: string
          opened_at: string | null
          praise_line: string
          todays_target: string
          words_or_sounds_learned: string
        }
        Insert: {
          confidence_note: string
          curriculum_day_id: string
          generated_at?: string
          home_practice: string
          id?: string
          learner_id: string
          opened_at?: string | null
          praise_line: string
          todays_target: string
          words_or_sounds_learned: string
        }
        Update: {
          confidence_note?: string
          curriculum_day_id?: string
          generated_at?: string
          home_practice?: string
          id?: string
          learner_id?: string
          opened_at?: string | null
          praise_line?: string
          todays_target?: string
          words_or_sounds_learned?: string
        }
        Relationships: [
          {
            foreignKeyName: "learner_parent_outputs_curriculum_day_id_fkey"
            columns: ["curriculum_day_id"]
            isOneToOne: false
            referencedRelation: "curriculum_days"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learner_parent_outputs_learner_id_fkey"
            columns: ["learner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      learner_profiles: {
        Row: {
          age_group: string | null
          avatar_character: string
          board: string | null
          child_name: string | null
          created_at: string
          english_level: string | null
          id: string
          learning_goals: string[] | null
          onboarding_completed: boolean
          school_stage: string | null
          student_id: string
          updated_at: string
        }
        Insert: {
          age_group?: string | null
          avatar_character?: string
          board?: string | null
          child_name?: string | null
          created_at?: string
          english_level?: string | null
          id?: string
          learning_goals?: string[] | null
          onboarding_completed?: boolean
          school_stage?: string | null
          student_id: string
          updated_at?: string
        }
        Update: {
          age_group?: string | null
          avatar_character?: string
          board?: string | null
          child_name?: string | null
          created_at?: string
          english_level?: string | null
          id?: string
          learning_goals?: string[] | null
          onboarding_completed?: boolean
          school_stage?: string | null
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "learner_profiles_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_sessions: {
        Row: {
          created_at: string
          duration_seconds: number | null
          ended_at: string | null
          id: string
          session_type: string
          started_at: string
          student_id: string
        }
        Insert: {
          created_at?: string
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          session_type?: string
          started_at?: string
          student_id: string
        }
        Update: {
          created_at?: string
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          session_type?: string
          started_at?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_sessions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_completions: {
        Row: {
          clarity_score: number | null
          completed_at: string
          confidence_score: number | null
          fluency_score: number | null
          id: string
          lesson_id: string
          practice_count: number
          pronunciation_score: number | null
          student_id: string
        }
        Insert: {
          clarity_score?: number | null
          completed_at?: string
          confidence_score?: number | null
          fluency_score?: number | null
          id?: string
          lesson_id: string
          practice_count?: number
          pronunciation_score?: number | null
          student_id: string
        }
        Update: {
          clarity_score?: number | null
          completed_at?: string
          confidence_score?: number | null
          fluency_score?: number | null
          id?: string
          lesson_id?: string
          practice_count?: number
          pronunciation_score?: number | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_completions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_completions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          created_at: string
          day_number: number
          description: string | null
          id: string
          is_active: boolean
          level: Database["public"]["Enums"]["lesson_level"]
          read_aloud_text: string | null
          sentences: Json
          title: string
          updated_at: string
          vocabulary: Json
        }
        Insert: {
          created_at?: string
          day_number: number
          description?: string | null
          id?: string
          is_active?: boolean
          level?: Database["public"]["Enums"]["lesson_level"]
          read_aloud_text?: string | null
          sentences?: Json
          title: string
          updated_at?: string
          vocabulary?: Json
        }
        Update: {
          created_at?: string
          day_number?: number
          description?: string | null
          id?: string
          is_active?: boolean
          level?: Database["public"]["Enums"]["lesson_level"]
          read_aloud_text?: string | null
          sentences?: Json
          title?: string
          updated_at?: string
          vocabulary?: Json
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          created_at: string
          id: string
          lesson_completed: boolean
          level_up: boolean
          parent_id: string
          streak_milestone: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          lesson_completed?: boolean
          level_up?: boolean
          parent_id: string
          streak_milestone?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          lesson_completed?: boolean
          level_up?: boolean
          parent_id?: string
          streak_milestone?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          child_id: string
          created_at: string
          id: string
          is_read: boolean
          message: string
          metadata: Json | null
          parent_id: string
          title: string
          type: string
        }
        Insert: {
          child_id: string
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          metadata?: Json | null
          parent_id: string
          title: string
          type?: string
        }
        Update: {
          child_id?: string
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          metadata?: Json | null
          parent_id?: string
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      parent_ai_outputs: {
        Row: {
          created_at: string
          generated_from: Json
          home_support_steps: Json
          id: string
          parent_id: string
          strengths: Json
          student_id: string
          summary: string | null
          title: string | null
          weak_areas: Json
        }
        Insert: {
          created_at?: string
          generated_from?: Json
          home_support_steps?: Json
          id?: string
          parent_id: string
          strengths?: Json
          student_id: string
          summary?: string | null
          title?: string | null
          weak_areas?: Json
        }
        Update: {
          created_at?: string
          generated_from?: Json
          home_support_steps?: Json
          id?: string
          parent_id?: string
          strengths?: Json
          student_id?: string
          summary?: string | null
          title?: string | null
          weak_areas?: Json
        }
        Relationships: [
          {
            foreignKeyName: "parent_ai_outputs_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parent_ai_outputs_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      parent_children: {
        Row: {
          child_id: string
          created_at: string
          id: string
          parent_id: string
        }
        Insert: {
          child_id: string
          created_at?: string
          id?: string
          parent_id: string
        }
        Update: {
          child_id?: string
          created_at?: string
          id?: string
          parent_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "parent_children_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parent_children_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      parent_goals: {
        Row: {
          child_id: string
          created_at: string
          daily_lessons_goal: number | null
          daily_minutes_goal: number | null
          daily_practice_goal: number | null
          id: string
          notes: string | null
          parent_id: string
          updated_at: string
        }
        Insert: {
          child_id: string
          created_at?: string
          daily_lessons_goal?: number | null
          daily_minutes_goal?: number | null
          daily_practice_goal?: number | null
          id?: string
          notes?: string | null
          parent_id: string
          updated_at?: string
        }
        Update: {
          child_id?: string
          created_at?: string
          daily_lessons_goal?: number | null
          daily_minutes_goal?: number | null
          daily_practice_goal?: number | null
          id?: string
          notes?: string | null
          parent_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "parent_goals_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parent_goals_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_history: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          plan_id: string
          razorpay_order_id: string
          razorpay_payment_id: string
          status: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          plan_id: string
          razorpay_order_id: string
          razorpay_payment_id: string
          status?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          plan_id?: string
          razorpay_order_id?: string
          razorpay_payment_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      practice_attempts: {
        Row: {
          attempt_type: string
          content: string
          created_at: string
          feedback: string | null
          id: string
          lesson_id: string
          pronunciation_score: number | null
          student_id: string
        }
        Insert: {
          attempt_type: string
          content: string
          created_at?: string
          feedback?: string | null
          id?: string
          lesson_id: string
          pronunciation_score?: number | null
          student_id: string
        }
        Update: {
          attempt_type?: string
          content?: string
          created_at?: string
          feedback?: string | null
          id?: string
          lesson_id?: string
          pronunciation_score?: number | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "practice_attempts_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "practice_attempts_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      practice_quiz_attempts: {
        Row: {
          correct_answer: string
          created_at: string
          difficulty: string
          hint_used: boolean
          id: string
          is_correct: boolean
          learner_id: string
          question_id: string | null
          question_text: string
          selected_answer: string | null
          session_id: string
          skill_code: string
          stage: string
          time_spent_seconds: number
          topic_key: string
        }
        Insert: {
          correct_answer: string
          created_at?: string
          difficulty?: string
          hint_used?: boolean
          id?: string
          is_correct?: boolean
          learner_id: string
          question_id?: string | null
          question_text: string
          selected_answer?: string | null
          session_id: string
          skill_code?: string
          stage?: string
          time_spent_seconds?: number
          topic_key: string
        }
        Update: {
          correct_answer?: string
          created_at?: string
          difficulty?: string
          hint_used?: boolean
          id?: string
          is_correct?: boolean
          learner_id?: string
          question_id?: string | null
          question_text?: string
          selected_answer?: string | null
          session_id?: string
          skill_code?: string
          stage?: string
          time_spent_seconds?: number
          topic_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "practice_quiz_attempts_learner_id_fkey"
            columns: ["learner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "practice_quiz_attempts_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "practice_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      practice_sessions: {
        Row: {
          accuracy_percent: number
          completed_at: string | null
          correct_count: number
          created_at: string
          current_stage: string
          difficulty: string
          id: string
          last_active_at: string
          learner_id: string
          level_id: string | null
          level_no: number | null
          resume_state: Json
          skill_code: string
          started_at: string
          status: string
          topic_key: string
          topic_label: string | null
          total_questions: number
          updated_at: string
        }
        Insert: {
          accuracy_percent?: number
          completed_at?: string | null
          correct_count?: number
          created_at?: string
          current_stage?: string
          difficulty?: string
          id?: string
          last_active_at?: string
          learner_id: string
          level_id?: string | null
          level_no?: number | null
          resume_state?: Json
          skill_code?: string
          started_at?: string
          status?: string
          topic_key: string
          topic_label?: string | null
          total_questions?: number
          updated_at?: string
        }
        Update: {
          accuracy_percent?: number
          completed_at?: string | null
          correct_count?: number
          created_at?: string
          current_stage?: string
          difficulty?: string
          id?: string
          last_active_at?: string
          learner_id?: string
          level_id?: string | null
          level_no?: number | null
          resume_state?: Json
          skill_code?: string
          started_at?: string
          status?: string
          topic_key?: string
          topic_label?: string | null
          total_questions?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "practice_sessions_learner_id_fkey"
            columns: ["learner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "practice_sessions_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "curriculum_levels"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          child_code: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          invite_token: string | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          subscription_type: Database["public"]["Enums"]["subscription_type"]
          trial_expires_at: string | null
          trial_started_at: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          child_code?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          invite_token?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          subscription_type?: Database["public"]["Enums"]["subscription_type"]
          trial_expires_at?: string | null
          trial_started_at?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          child_code?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          invite_token?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          subscription_type?: Database["public"]["Enums"]["subscription_type"]
          trial_expires_at?: string | null
          trial_started_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      purchased_items: {
        Row: {
          id: string
          is_equipped: boolean
          item_id: string
          purchased_at: string
          student_id: string
        }
        Insert: {
          id?: string
          is_equipped?: boolean
          item_id: string
          purchased_at?: string
          student_id: string
        }
        Update: {
          id?: string
          is_equipped?: boolean
          item_id?: string
          purchased_at?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchased_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "shop_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchased_items_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      question_bank: {
        Row: {
          correct_answer: string
          created_at: string
          difficulty: string
          explanation: string | null
          hint: string | null
          id: string
          is_active: boolean
          level_no: number | null
          metadata: Json
          options: Json
          question_text: string
          skill_code: string
          source_day_id: string | null
          topic_key: string
        }
        Insert: {
          correct_answer: string
          created_at?: string
          difficulty?: string
          explanation?: string | null
          hint?: string | null
          id?: string
          is_active?: boolean
          level_no?: number | null
          metadata?: Json
          options?: Json
          question_text: string
          skill_code?: string
          source_day_id?: string | null
          topic_key: string
        }
        Update: {
          correct_answer?: string
          created_at?: string
          difficulty?: string
          explanation?: string | null
          hint?: string | null
          id?: string
          is_active?: boolean
          level_no?: number | null
          metadata?: Json
          options?: Json
          question_text?: string
          skill_code?: string
          source_day_id?: string | null
          topic_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_bank_source_day_id_fkey"
            columns: ["source_day_id"]
            isOneToOne: false
            referencedRelation: "curriculum_days"
            referencedColumns: ["id"]
          },
        ]
      }
      rag_index_jobs: {
        Row: {
          created_at: string
          document_id: string | null
          error_message: string | null
          id: string
          job_type: string
          payload: Json
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          document_id?: string | null
          error_message?: string | null
          id?: string
          job_type: string
          payload?: Json
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          document_id?: string | null
          error_message?: string | null
          id?: string
          job_type?: string
          payload?: Json
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rag_index_jobs_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "knowledge_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_words: {
        Row: {
          created_at: string
          id: string
          meaning: string
          phonetic: string
          student_id: string
          word: string
        }
        Insert: {
          created_at?: string
          id?: string
          meaning?: string
          phonetic?: string
          student_id: string
          word: string
        }
        Update: {
          created_at?: string
          id?: string
          meaning?: string
          phonetic?: string
          student_id?: string
          word?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_words_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_items: {
        Row: {
          category: string
          created_at: string
          description: string
          icon: string
          id: string
          is_available: boolean
          name: string
          xp_cost: number
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string
          icon?: string
          id?: string
          is_available?: boolean
          name: string
          xp_cost?: number
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          icon?: string
          id?: string
          is_available?: boolean
          name?: string
          xp_cost?: number
        }
        Relationships: []
      }
      student_badges: {
        Row: {
          badge_id: string
          earned_at: string
          id: string
          student_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string
          id?: string
          student_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string
          id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_badges_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      student_challenges: {
        Row: {
          challenge_date: string
          challenge_id: string
          completed: boolean
          created_at: string
          current_count: number
          id: string
          student_id: string
          xp_claimed: boolean
        }
        Insert: {
          challenge_date?: string
          challenge_id: string
          completed?: boolean
          created_at?: string
          current_count?: number
          id?: string
          student_id: string
          xp_claimed?: boolean
        }
        Update: {
          challenge_date?: string
          challenge_id?: string
          completed?: boolean
          created_at?: string
          current_count?: number
          id?: string
          student_id?: string
          xp_claimed?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "student_challenges_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "daily_challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_challenges_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      student_progress: {
        Row: {
          created_at: string
          current_day: number
          current_level: Database["public"]["Enums"]["lesson_level"]
          id: string
          student_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_day?: number
          current_level?: Database["public"]["Enums"]["lesson_level"]
          id?: string
          student_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_day?: number
          current_level?: Database["public"]["Enums"]["lesson_level"]
          id?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_progress_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      student_topic_state: {
        Row: {
          consecutive_failures: number
          created_at: string
          current_difficulty: string
          id: string
          last_practiced_at: string | null
          learner_id: string
          level_no: number | null
          mastery_level: string
          recent_accuracy: number
          skill_code: string
          topic_key: string
          total_attempts: number
          total_correct: number
          updated_at: string
        }
        Insert: {
          consecutive_failures?: number
          created_at?: string
          current_difficulty?: string
          id?: string
          last_practiced_at?: string | null
          learner_id: string
          level_no?: number | null
          mastery_level?: string
          recent_accuracy?: number
          skill_code?: string
          topic_key: string
          total_attempts?: number
          total_correct?: number
          updated_at?: string
        }
        Update: {
          consecutive_failures?: number
          created_at?: string
          current_difficulty?: string
          id?: string
          last_practiced_at?: string | null
          learner_id?: string
          level_no?: number | null
          mastery_level?: string
          recent_accuracy?: number
          skill_code?: string
          topic_key?: string
          total_attempts?: number
          total_correct?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_topic_state_learner_id_fkey"
            columns: ["learner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      student_xp: {
        Row: {
          created_at: string
          id: string
          student_id: string
          total_xp: number
          updated_at: string
          xp_level: number
        }
        Insert: {
          created_at?: string
          id?: string
          student_id: string
          total_xp?: number
          updated_at?: string
          xp_level?: number
        }
        Update: {
          created_at?: string
          id?: string
          student_id?: string
          total_xp?: number
          updated_at?: string
          xp_level?: number
        }
        Relationships: [
          {
            foreignKeyName: "student_xp_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sync_queue: {
        Row: {
          action_type: string
          created_at: string
          id: string
          payload: Json
          portal_type: string
          retry_count: number
          sync_status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          action_type: string
          created_at?: string
          id?: string
          payload?: Json
          portal_type?: string
          retry_count?: number
          sync_status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          action_type?: string
          created_at?: string
          id?: string
          payload?: Json
          portal_type?: string
          retry_count?: number
          sync_status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_entitlements: {
        Row: {
          amount_paid: number | null
          created_at: string
          currency: string | null
          email: string | null
          entitlement_expiry_date: string | null
          entitlement_start_date: string | null
          entitlement_status: string
          id: string
          is_paid: boolean
          launch_check_completed: boolean
          order_id: string | null
          override_flag: boolean | null
          paid_at: string | null
          payment_id: string | null
          payment_status: string
          plan_duration_months: number | null
          recommended_level: string | null
          selected_level: string | null
          selected_plan: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_paid?: number | null
          created_at?: string
          currency?: string | null
          email?: string | null
          entitlement_expiry_date?: string | null
          entitlement_start_date?: string | null
          entitlement_status?: string
          id?: string
          is_paid?: boolean
          launch_check_completed?: boolean
          order_id?: string | null
          override_flag?: boolean | null
          paid_at?: string | null
          payment_id?: string | null
          payment_status?: string
          plan_duration_months?: number | null
          recommended_level?: string | null
          selected_level?: string | null
          selected_plan?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_paid?: number | null
          created_at?: string
          currency?: string | null
          email?: string | null
          entitlement_expiry_date?: string | null
          entitlement_start_date?: string | null
          entitlement_status?: string
          id?: string
          is_paid?: boolean
          launch_check_completed?: boolean
          order_id?: string | null
          override_flag?: boolean | null
          paid_at?: string | null
          payment_id?: string | null
          payment_status?: string
          plan_duration_months?: number | null
          recommended_level?: string | null
          selected_level?: string | null
          selected_plan?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          granted_by: string | null
          id: string
          is_active: boolean
          organization_id: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          granted_by?: string | null
          id?: string
          is_active?: boolean
          organization_id?: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          granted_by?: string | null
          id?: string
          is_active?: boolean
          organization_id?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      writing_submissions: {
        Row: {
          corrected_text: string | null
          created_at: string
          creativity_feedback: string | null
          grammar_feedback: string | null
          id: string
          prompt_id: string
          prompt_title: string
          score: number | null
          student_id: string
          suggestions: Json | null
          vocabulary_feedback: string | null
          writing_text: string
          xp_awarded: number | null
        }
        Insert: {
          corrected_text?: string | null
          created_at?: string
          creativity_feedback?: string | null
          grammar_feedback?: string | null
          id?: string
          prompt_id: string
          prompt_title: string
          score?: number | null
          student_id: string
          suggestions?: Json | null
          vocabulary_feedback?: string | null
          writing_text: string
          xp_awarded?: number | null
        }
        Update: {
          corrected_text?: string | null
          created_at?: string
          creativity_feedback?: string | null
          grammar_feedback?: string | null
          id?: string
          prompt_id?: string
          prompt_title?: string
          score?: number | null
          student_id?: string
          suggestions?: Json | null
          vocabulary_feedback?: string | null
          writing_text?: string
          xp_awarded?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "writing_submissions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      xp_history: {
        Row: {
          created_at: string
          id: string
          source: string
          source_id: string | null
          student_id: string
          xp_amount: number
        }
        Insert: {
          created_at?: string
          id?: string
          source: string
          source_id?: string | null
          student_id: string
          xp_amount: number
        }
        Update: {
          created_at?: string
          id?: string
          source?: string
          source_id?: string | null
          student_id?: string
          xp_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "xp_history_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      award_xp: {
        Args: {
          _source: string
          _source_id?: string
          _student_id: string
          _xp_amount: number
        }
        Returns: number
      }
      claim_badge: {
        Args: { _badge_id: string; _student_id: string }
        Returns: boolean
      }
      generate_child_code: { Args: never; Returns: string }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      get_user_roles: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"][]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      link_child_to_parent: {
        Args: { _method: string; _value: string }
        Returns: Json
      }
      lookup_child_for_linking: {
        Args: { _method: string; _value: string }
        Returns: {
          child_email: string
          child_id: string
          child_name: string
          child_role: string
        }[]
      }
      purchase_shop_item: {
        Args: { _item_id: string; _student_id: string }
        Returns: Json
      }
      search_knowledge_chunks:
        | {
            Args: {
              filter_audience?: string
              filter_day?: number
              filter_level?: number
              filter_week?: number
              match_count?: number
              query_embedding: string
            }
            Returns: {
              chunk_index: number
              chunk_type: string
              content: string
              day_no: number
              document_id: string
              id: string
              lesson_part: number
              level_no: number
              metadata: Json
              similarity: number
              skill_code: string
              tags: string[]
              week_no: number
            }[]
          }
        | {
            Args: {
              filter_audience?: string
              filter_day?: number
              filter_lesson_part?: number
              filter_level?: number
              filter_skill_code?: string
              filter_source_type?: string
              filter_week?: number
              match_count?: number
              query_embedding: string
            }
            Returns: {
              audience: string
              chunk_index: number
              chunk_type: string
              content: string
              day_no: number
              document_id: string
              document_title: string
              id: string
              lesson_part: number
              level_no: number
              metadata: Json
              similarity: number
              skill_code: string
              source_type: string
              tags: string[]
              week_no: number
            }[]
          }
    }
    Enums: {
      app_role: "student" | "parent" | "admin"
      lesson_level: "beginner" | "intermediate" | "advanced"
      subscription_type: "free" | "premium"
      user_role: "student" | "parent" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["student", "parent", "admin"],
      lesson_level: ["beginner", "intermediate", "advanced"],
      subscription_type: ["free", "premium"],
      user_role: ["student", "parent", "admin"],
    },
  },
} as const

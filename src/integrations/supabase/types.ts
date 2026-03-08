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
      learner_profiles: {
        Row: {
          age_group: string | null
          avatar_character: string
          created_at: string
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
          created_at?: string
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
          created_at?: string
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
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          subscription_type: Database["public"]["Enums"]["subscription_type"]
          trial_expires_at: string | null
          trial_started_at: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          role?: Database["public"]["Enums"]["user_role"]
          subscription_type?: Database["public"]["Enums"]["subscription_type"]
          trial_expires_at?: string | null
          trial_started_at?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
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
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
    }
    Enums: {
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
      lesson_level: ["beginner", "intermediate", "advanced"],
      subscription_type: ["free", "premium"],
      user_role: ["student", "parent", "admin"],
    },
  },
} as const

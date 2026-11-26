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
    PostgrestVersion: "14.18"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      ai_usage: {
        Row: {
          cost_usd: number
          created_at: string
          feature: string
          id: string
          input_tokens: number | null
          model_key: string | null
          output_tokens: number | null
          status: string
          submission_id: string | null
          usage_date: string
          user_id: string
        }
        Insert: {
          cost_usd?: number
          created_at?: string
          feature: string
          id?: string
          input_tokens?: number | null
          model_key?: string | null
          output_tokens?: number | null
          status: string
          submission_id?: string | null
          usage_date?: string
          user_id: string
        }
        Update: {
          cost_usd?: number
          created_at?: string
          feature?: string
          id?: string
          input_tokens?: number | null
          model_key?: string | null
          output_tokens?: number | null
          status?: string
          submission_id?: string | null
          usage_date?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_usage_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "essay_submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_usage_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      app_config: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      availability_slots: {
        Row: {
          id: string
          minutes: number
          start_time: string
          user_id: string
          weekday: number
        }
        Insert: {
          id?: string
          minutes: number
          start_time: string
          user_id: string
          weekday: number
        }
        Update: {
          id?: string
          minutes?: number
          start_time?: string
          user_id?: string
          weekday?: number
        }
        Relationships: [
          {
            foreignKeyName: "availability_slots_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      competency_contents: {
        Row: {
          competency: number
          content_id: string
          position: number
        }
        Insert: {
          competency: number
          content_id: string
          position?: number
        }
        Update: {
          competency?: number
          content_id?: string
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "competency_contents_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "contents"
            referencedColumns: ["id"]
          },
        ]
      }
      content_edges: {
        Row: {
          from_id: string
          kind: string
          to_id: string
        }
        Insert: {
          from_id: string
          kind: string
          to_id: string
        }
        Update: {
          from_id?: string
          kind?: string
          to_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_edges_from_id_fkey"
            columns: ["from_id"]
            isOneToOne: false
            referencedRelation: "contents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_edges_to_id_fkey"
            columns: ["to_id"]
            isOneToOne: false
            referencedRelation: "contents"
            referencedColumns: ["id"]
          },
        ]
      }
      content_progress: {
        Row: {
          content_id: string
          mastered_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          content_id: string
          mastered_at?: string | null
          status: string
          user_id: string
        }
        Update: {
          content_id?: string
          mastered_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_progress_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "contents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      content_sections: {
        Row: {
          body_md: string
          content_id: string
          id: string
          kind: string
          position: number
          quick_question: Json | null
          source_citation: string
          source_url: string | null
          title: string
        }
        Insert: {
          body_md: string
          content_id: string
          id?: string
          kind: string
          position: number
          quick_question?: Json | null
          source_citation: string
          source_url?: string | null
          title: string
        }
        Update: {
          body_md?: string
          content_id?: string
          id?: string
          kind?: string
          position?: number
          quick_question?: Json | null
          source_citation?: string
          source_url?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_sections_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "contents"
            referencedColumns: ["id"]
          },
        ]
      }
      contents: {
        Row: {
          id: string
          pos_x: number
          pos_y: number
          slug: string
          sort: number
          subject: string
          summary: string
          title: string
        }
        Insert: {
          id?: string
          pos_x?: number
          pos_y?: number
          slug: string
          sort?: number
          subject: string
          summary: string
          title: string
        }
        Update: {
          id?: string
          pos_x?: number
          pos_y?: number
          slug?: string
          sort?: number
          subject?: string
          summary?: string
          title?: string
        }
        Relationships: []
      }
      essay_feedbacks: {
        Row: {
          created_at: string
          id: string
          latency_ms: number | null
          model_key: string
          payload: Json
          prompt_version: string
          submission_id: string
          total_estimate: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          latency_ms?: number | null
          model_key: string
          payload: Json
          prompt_version: string
          submission_id: string
          total_estimate?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          latency_ms?: number | null
          model_key?: string
          payload?: Json
          prompt_version?: string
          submission_id?: string
          total_estimate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "essay_feedbacks_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: true
            referencedRelation: "essay_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      essay_submissions: {
        Row: {
          body: string
          created_at: string
          example_key: string | null
          id: string
          is_example: boolean
          part: string
          status: string
          topic_id: string
          user_id: string | null
        }
        Insert: {
          body: string
          created_at?: string
          example_key?: string | null
          id?: string
          is_example?: boolean
          part: string
          status?: string
          topic_id: string
          user_id?: string | null
        }
        Update: {
          body?: string
          created_at?: string
          example_key?: string | null
          id?: string
          is_example?: boolean
          part?: string
          status?: string
          topic_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "essay_submissions_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "essay_topics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "essay_submissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      essay_topics: {
        Row: {
          id: string
          motivating_text: string
          slug: string
          source_citation: string | null
          title: string
        }
        Insert: {
          id?: string
          motivating_text: string
          slug: string
          source_citation?: string | null
          title: string
        }
        Update: {
          id?: string
          motivating_text?: string
          slug?: string
          source_citation?: string | null
          title?: string
        }
        Relationships: []
      }
      flashcard_states: {
        Row: {
          due_on: string
          flashcard_id: string
          last_rating: number
          reviewed_at: string | null
          user_id: string
        }
        Insert: {
          due_on: string
          flashcard_id: string
          last_rating: number
          reviewed_at?: string | null
          user_id: string
        }
        Update: {
          due_on?: string
          flashcard_id?: string
          last_rating?: number
          reviewed_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flashcard_states_flashcard_id_fkey"
            columns: ["flashcard_id"]
            isOneToOne: false
            referencedRelation: "flashcards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flashcard_states_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      flashcards: {
        Row: {
          back: string
          content_id: string
          front: string
          id: string
        }
        Insert: {
          back: string
          content_id: string
          front: string
          id?: string
        }
        Update: {
          back?: string
          content_id?: string
          front?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flashcards_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "contents"
            referencedColumns: ["id"]
          },
        ]
      }
      journey_contents: {
        Row: {
          added_from: string
          content_id: string
          journey_id: string
          position: number
        }
        Insert: {
          added_from: string
          content_id: string
          journey_id: string
          position: number
        }
        Update: {
          added_from?: string
          content_id?: string
          journey_id?: string
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "journey_contents_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "contents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journey_contents_journey_id_fkey"
            columns: ["journey_id"]
            isOneToOne: false
            referencedRelation: "journeys"
            referencedColumns: ["id"]
          },
        ]
      }
      journeys: {
        Row: {
          base_type: string
          created_at: string
          deadline: string
          goal_description: string
          goal_type: string
          id: string
          methodology: string
          status: string
          trail_id: string | null
          user_id: string
        }
        Insert: {
          base_type: string
          created_at?: string
          deadline: string
          goal_description: string
          goal_type?: string
          id?: string
          methodology?: string
          status?: string
          trail_id?: string | null
          user_id: string
        }
        Update: {
          base_type?: string
          created_at?: string
          deadline?: string
          goal_description?: string
          goal_type?: string
          id?: string
          methodology?: string
          status?: string
          trail_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "journeys_trail_id_fkey"
            columns: ["trail_id"]
            isOneToOne: false
            referencedRelation: "trails"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journeys_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          essay_daily_limit_override: number | null
          id: string
          is_demo: boolean
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          essay_daily_limit_override?: number | null
          id: string
          is_demo?: boolean
        }
        Update: {
          created_at?: string
          display_name?: string | null
          essay_daily_limit_override?: number | null
          id?: string
          is_demo?: boolean
        }
        Relationships: []
      }
      question_keys: {
        Row: {
          correct_index: number
          explanation: string
          question_id: string
        }
        Insert: {
          correct_index: number
          explanation: string
          question_id: string
        }
        Update: {
          correct_index?: number
          explanation?: string
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_keys_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: true
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          content_id: string
          id: string
          options: Json
          origin: string
          section_id: string | null
          source_citation: string
          stem: string
        }
        Insert: {
          content_id: string
          id?: string
          options: Json
          origin: string
          section_id?: string | null
          source_citation: string
          stem: string
        }
        Update: {
          content_id?: string
          id?: string
          options?: Json
          origin?: string
          section_id?: string | null
          source_citation?: string
          stem?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "contents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "content_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_attempts: {
        Row: {
          answers: Json
          content_id: string
          correct: number
          created_at: string
          id: string
          passed: boolean
          threshold_pct: number
          total: number
          user_id: string
        }
        Insert: {
          answers: Json
          content_id: string
          correct: number
          created_at?: string
          id?: string
          passed: boolean
          threshold_pct: number
          total: number
          user_id: string
        }
        Update: {
          answers?: Json
          content_id?: string
          correct?: number
          created_at?: string
          id?: string
          passed?: boolean
          threshold_pct?: number
          total?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "contents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_sessions: {
        Row: {
          content_id: string
          id: string
          journey_id: string
          minutes: number
          starts_at: string
          status: string
          user_id: string
        }
        Insert: {
          content_id: string
          id?: string
          journey_id: string
          minutes: number
          starts_at: string
          status?: string
          user_id: string
        }
        Update: {
          content_id?: string
          id?: string
          journey_id?: string
          minutes?: number
          starts_at?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_sessions_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "contents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_sessions_journey_id_fkey"
            columns: ["journey_id"]
            isOneToOne: false
            referencedRelation: "journeys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      trail_contents: {
        Row: {
          content_id: string
          position: number
          trail_id: string
        }
        Insert: {
          content_id: string
          position: number
          trail_id: string
        }
        Update: {
          content_id?: string
          position?: number
          trail_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trail_contents_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "contents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trail_contents_trail_id_fkey"
            columns: ["trail_id"]
            isOneToOne: false
            referencedRelation: "trails"
            referencedColumns: ["id"]
          },
        ]
      }
      trails: {
        Row: {
          color: string | null
          id: string
          name: string
          objective: string
          origin: string
          slug: string
        }
        Insert: {
          color?: string | null
          id?: string
          name: string
          objective: string
          origin?: string
          slug: string
        }
        Update: {
          color?: string | null
          id?: string
          name?: string
          objective?: string
          origin?: string
          slug?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      demo_replace_essays: {
        Args: { p_essays: Json; p_user_id: string }
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

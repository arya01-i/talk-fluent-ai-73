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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          session_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          session_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_sessions: {
        Row: {
          created_at: string
          id: string
          learning_lang: string
          level: Database["public"]["Enums"]["cefr_level"]
          mode: string
          title: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          learning_lang: string
          level: Database["public"]["Enums"]["cefr_level"]
          mode?: string
          title?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          learning_lang?: string
          level?: Database["public"]["Enums"]["cefr_level"]
          mode?: string
          title?: string | null
          user_id?: string
        }
        Relationships: []
      }
      lesson_progress: {
        Row: {
          completed_at: string | null
          lesson_id: string
          passed: boolean
          score: number
          total: number
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          lesson_id: string
          passed?: boolean
          score?: number
          total?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          lesson_id?: string
          passed?: boolean
          score?: number
          total?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          created_at: string
          exam: Json
          id: string
          lang: string
          level: Database["public"]["Enums"]["cefr_level"]
          order_index: number
          sections: Json
          summary: string | null
          title: string
        }
        Insert: {
          created_at?: string
          exam?: Json
          id?: string
          lang: string
          level: Database["public"]["Enums"]["cefr_level"]
          order_index: number
          sections?: Json
          summary?: string | null
          title: string
        }
        Update: {
          created_at?: string
          exam?: Json
          id?: string
          lang?: string
          level?: Database["public"]["Enums"]["cefr_level"]
          order_index?: number
          sections?: Json
          summary?: string | null
          title?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          learning_lang: string
          level: Database["public"]["Enums"]["cefr_level"]
          native_lang: string
          streak: number
          updated_at: string
          xp: number
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id: string
          learning_lang?: string
          level?: Database["public"]["Enums"]["cefr_level"]
          native_lang?: string
          streak?: number
          updated_at?: string
          xp?: number
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          learning_lang?: string
          level?: Database["public"]["Enums"]["cefr_level"]
          native_lang?: string
          streak?: number
          updated_at?: string
          xp?: number
        }
        Relationships: []
      }
      quiz_attempts: {
        Row: {
          created_at: string
          id: string
          lang: string
          level: Database["public"]["Enums"]["cefr_level"]
          score: number
          total: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          lang: string
          level: Database["public"]["Enums"]["cefr_level"]
          score: number
          total: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          lang?: string
          level?: Database["public"]["Enums"]["cefr_level"]
          score?: number
          total?: number
          user_id?: string
        }
        Relationships: []
      }
      quiz_questions: {
        Row: {
          correct_index: number
          created_at: string
          explanation: string | null
          id: string
          lang: string
          level: Database["public"]["Enums"]["cefr_level"]
          options: Json
          question: string
        }
        Insert: {
          correct_index: number
          created_at?: string
          explanation?: string | null
          id?: string
          lang: string
          level: Database["public"]["Enums"]["cefr_level"]
          options: Json
          question: string
        }
        Update: {
          correct_index?: number
          created_at?: string
          explanation?: string | null
          id?: string
          lang?: string
          level?: Database["public"]["Enums"]["cefr_level"]
          options?: Json
          question?: string
        }
        Relationships: []
      }
      vocab_items: {
        Row: {
          created_at: string
          example: string | null
          id: string
          lang: string
          level: Database["public"]["Enums"]["cefr_level"]
          translation_en: string
          word: string
        }
        Insert: {
          created_at?: string
          example?: string | null
          id?: string
          lang: string
          level: Database["public"]["Enums"]["cefr_level"]
          translation_en: string
          word: string
        }
        Update: {
          created_at?: string
          example?: string | null
          id?: string
          lang?: string
          level?: Database["public"]["Enums"]["cefr_level"]
          translation_en?: string
          word?: string
        }
        Relationships: []
      }
      vocab_progress: {
        Row: {
          item_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          item_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          item_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vocab_progress_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "vocab_items"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      cefr_level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2"
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
      cefr_level: ["A1", "A2", "B1", "B2", "C1", "C2"],
    },
  },
} as const

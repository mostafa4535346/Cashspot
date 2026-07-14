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
      activity_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          id: string
          metadata: Json | null
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: []
      }
      ai_predictions: {
        Row: {
          atm_id: string
          created_at: string
          id: string
          probability_cash: number | null
          queue_estimate: number | null
          reasoning: string | null
        }
        Insert: {
          atm_id: string
          created_at?: string
          id?: string
          probability_cash?: number | null
          queue_estimate?: number | null
          reasoning?: string | null
        }
        Update: {
          atm_id?: string
          created_at?: string
          id?: string
          probability_cash?: number | null
          queue_estimate?: number | null
          reasoning?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_predictions_atm_id_fkey"
            columns: ["atm_id"]
            isOneToOne: false
            referencedRelation: "atms"
            referencedColumns: ["id"]
          },
        ]
      }
      atms: {
        Row: {
          accessible: boolean
          address: string | null
          bank_id: string | null
          city: string | null
          country: string
          created_at: string
          created_by: string | null
          governorate: string | null
          id: string
          last_status_at: string | null
          lat: number
          lng: number
          name: string
          name_ar: string | null
          open_24h: boolean
          status: Database["public"]["Enums"]["atm_status"]
          supports_cardless: boolean
          supports_deposit: boolean
          updated_at: string
        }
        Insert: {
          accessible?: boolean
          address?: string | null
          bank_id?: string | null
          city?: string | null
          country?: string
          created_at?: string
          created_by?: string | null
          governorate?: string | null
          id?: string
          last_status_at?: string | null
          lat: number
          lng: number
          name: string
          name_ar?: string | null
          open_24h?: boolean
          status?: Database["public"]["Enums"]["atm_status"]
          supports_cardless?: boolean
          supports_deposit?: boolean
          updated_at?: string
        }
        Update: {
          accessible?: boolean
          address?: string | null
          bank_id?: string | null
          city?: string | null
          country?: string
          created_at?: string
          created_by?: string | null
          governorate?: string | null
          id?: string
          last_status_at?: string | null
          lat?: number
          lng?: number
          name?: string
          name_ar?: string | null
          open_24h?: boolean
          status?: Database["public"]["Enums"]["atm_status"]
          supports_cardless?: boolean
          supports_deposit?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "atms_bank_id_fkey"
            columns: ["bank_id"]
            isOneToOne: false
            referencedRelation: "banks"
            referencedColumns: ["id"]
          },
        ]
      }
      badges: {
        Row: {
          code: string
          description: string | null
          icon: string | null
          id: string
          name: string
          name_ar: string | null
        }
        Insert: {
          code: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          name_ar?: string | null
        }
        Update: {
          code?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          name_ar?: string | null
        }
        Relationships: []
      }
      banks: {
        Row: {
          color: string | null
          country: string
          created_at: string
          id: string
          logo_url: string | null
          name: string
          name_ar: string | null
          slug: string
        }
        Insert: {
          color?: string | null
          country?: string
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          name_ar?: string | null
          slug: string
        }
        Update: {
          color?: string | null
          country?: string
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          name_ar?: string | null
          slug?: string
        }
        Relationships: []
      }
      favorites: {
        Row: {
          atm_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          atm_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          atm_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_atm_id_fkey"
            columns: ["atm_id"]
            isOneToOne: false
            referencedRelation: "atms"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          atm_id: string | null
          body: string | null
          created_at: string
          id: string
          read: boolean
          title: string
          user_id: string
        }
        Insert: {
          atm_id?: string | null
          body?: string | null
          created_at?: string
          id?: string
          read?: boolean
          title: string
          user_id: string
        }
        Update: {
          atm_id?: string | null
          body?: string | null
          created_at?: string
          id?: string
          read?: boolean
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_atm_id_fkey"
            columns: ["atm_id"]
            isOneToOne: false
            referencedRelation: "atms"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          country: string
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          language: string
          photo_url: string | null
          suspended: boolean
          updated_at: string
          xp: number
        }
        Insert: {
          country?: string
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
          language?: string
          photo_url?: string | null
          suspended?: boolean
          updated_at?: string
          xp?: number
        }
        Update: {
          country?: string
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          language?: string
          photo_url?: string | null
          suspended?: boolean
          updated_at?: string
          xp?: number
        }
        Relationships: []
      }
      reports: {
        Row: {
          approved: boolean
          atm_id: string
          comment: string | null
          created_at: string
          flagged: boolean
          id: string
          kind: Database["public"]["Enums"]["report_kind"]
          photo_url: string | null
          user_id: string
        }
        Insert: {
          approved?: boolean
          atm_id: string
          comment?: string | null
          created_at?: string
          flagged?: boolean
          id?: string
          kind: Database["public"]["Enums"]["report_kind"]
          photo_url?: string | null
          user_id: string
        }
        Update: {
          approved?: boolean
          atm_id?: string
          comment?: string | null
          created_at?: string
          flagged?: boolean
          id?: string
          kind?: Database["public"]["Enums"]["report_kind"]
          photo_url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_atm_id_fkey"
            columns: ["atm_id"]
            isOneToOne: false
            referencedRelation: "atms"
            referencedColumns: ["id"]
          },
        ]
      }
      user_badges: {
        Row: {
          awarded_at: string
          badge_id: string
          id: string
          user_id: string
        }
        Insert: {
          awarded_at?: string
          badge_id: string
          id?: string
          user_id: string
        }
        Update: {
          awarded_at?: string
          badge_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          granted_by: string | null
          id: string
          permissions: string[]
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          granted_by?: string | null
          id?: string
          permissions?: string[]
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          granted_by?: string | null
          id?: string
          permissions?: string[]
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      leaderboard: {
        Row: {
          display_name: string | null
          photo_url: string | null
          reports_count: number | null
          user_id: string | null
          xp: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "owner" | "admin" | "moderator" | "user"
      atm_status:
        | "cash_available"
        | "no_cash"
        | "busy"
        | "out_of_service"
        | "deposit_available"
        | "unknown"
      report_kind:
        | "cash_available"
        | "no_cash"
        | "broken"
        | "busy"
        | "deposit_working"
        | "cardless_working"
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
      app_role: ["owner", "admin", "moderator", "user"],
      atm_status: [
        "cash_available",
        "no_cash",
        "busy",
        "out_of_service",
        "deposit_available",
        "unknown",
      ],
      report_kind: [
        "cash_available",
        "no_cash",
        "broken",
        "busy",
        "deposit_working",
        "cardless_working",
      ],
    },
  },
} as const

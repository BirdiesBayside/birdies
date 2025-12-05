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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          sgt_user_id: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
          sgt_user_id?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          sgt_user_id?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      sgt_members: {
        Row: {
          updated_at: string | null
          user_active: number | null
          user_country_code: string | null
          user_email: string | null
          user_game_id: string | null
          user_has_avatar: string | null
          user_id: number
          user_name: string
        }
        Insert: {
          updated_at?: string | null
          user_active?: number | null
          user_country_code?: string | null
          user_email?: string | null
          user_game_id?: string | null
          user_has_avatar?: string | null
          user_id: number
          user_name: string
        }
        Update: {
          updated_at?: string | null
          user_active?: number | null
          user_country_code?: string | null
          user_email?: string | null
          user_game_id?: string | null
          user_has_avatar?: string | null
          user_id?: number
          user_name?: string
        }
        Relationships: []
      }
      sgt_scorecards: {
        Row: {
          course_name: string | null
          hcp_index: number | null
          hole_data: Json | null
          id: string
          in_gross: number | null
          in_net: number | null
          out_gross: number | null
          out_net: number | null
          player_id: number
          player_name: string | null
          rating: number | null
          round: number | null
          slope: number | null
          teetype: string | null
          to_par_gross: number | null
          to_par_net: number | null
          total_gross: number | null
          total_net: number | null
          tournament_id: number
          updated_at: string | null
        }
        Insert: {
          course_name?: string | null
          hcp_index?: number | null
          hole_data?: Json | null
          id?: string
          in_gross?: number | null
          in_net?: number | null
          out_gross?: number | null
          out_net?: number | null
          player_id: number
          player_name?: string | null
          rating?: number | null
          round?: number | null
          slope?: number | null
          teetype?: string | null
          to_par_gross?: number | null
          to_par_net?: number | null
          total_gross?: number | null
          total_net?: number | null
          tournament_id: number
          updated_at?: string | null
        }
        Update: {
          course_name?: string | null
          hcp_index?: number | null
          hole_data?: Json | null
          id?: string
          in_gross?: number | null
          in_net?: number | null
          out_gross?: number | null
          out_net?: number | null
          player_id?: number
          player_name?: string | null
          rating?: number | null
          round?: number | null
          slope?: number | null
          teetype?: string | null
          to_par_gross?: number | null
          to_par_net?: number | null
          total_gross?: number | null
          total_net?: number | null
          tournament_id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sgt_scorecards_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "sgt_tournaments"
            referencedColumns: ["tournament_id"]
          },
        ]
      }
      sgt_sync_log: {
        Row: {
          completed_at: string | null
          error_message: string | null
          id: string
          records_synced: number | null
          started_at: string | null
          status: string | null
          sync_type: string
        }
        Insert: {
          completed_at?: string | null
          error_message?: string | null
          id?: string
          records_synced?: number | null
          started_at?: string | null
          status?: string | null
          sync_type: string
        }
        Update: {
          completed_at?: string | null
          error_message?: string | null
          id?: string
          records_synced?: number | null
          started_at?: string | null
          status?: string | null
          sync_type?: string
        }
        Relationships: []
      }
      sgt_tour_members: {
        Row: {
          custom_hcp: number | null
          hcp_index: number | null
          id: string
          tour_id: number
          updated_at: string | null
          user_id: number
          user_name: string
        }
        Insert: {
          custom_hcp?: number | null
          hcp_index?: number | null
          id?: string
          tour_id: number
          updated_at?: string | null
          user_id: number
          user_name: string
        }
        Update: {
          custom_hcp?: number | null
          hcp_index?: number | null
          id?: string
          tour_id?: number
          updated_at?: string | null
          user_id?: number
          user_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "sgt_tour_members_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "sgt_tours"
            referencedColumns: ["tour_id"]
          },
        ]
      }
      sgt_tour_standings: {
        Row: {
          country_code: string | null
          events: number | null
          first: number | null
          gross_or_net: string | null
          hcp: number | null
          id: string
          points: number | null
          position: number | null
          top10: number | null
          top5: number | null
          tour_id: number
          updated_at: string | null
          user_has_avatar: string | null
          user_name: string
        }
        Insert: {
          country_code?: string | null
          events?: number | null
          first?: number | null
          gross_or_net?: string | null
          hcp?: number | null
          id?: string
          points?: number | null
          position?: number | null
          top10?: number | null
          top5?: number | null
          tour_id: number
          updated_at?: string | null
          user_has_avatar?: string | null
          user_name: string
        }
        Update: {
          country_code?: string | null
          events?: number | null
          first?: number | null
          gross_or_net?: string | null
          hcp?: number | null
          id?: string
          points?: number | null
          position?: number | null
          top10?: number | null
          top5?: number | null
          tour_id?: number
          updated_at?: string | null
          user_has_avatar?: string | null
          user_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "sgt_tour_standings_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "sgt_tours"
            referencedColumns: ["tour_id"]
          },
        ]
      }
      sgt_tournaments: {
        Row: {
          course_name: string | null
          end_date: string | null
          name: string
          start_date: string | null
          status: string | null
          tour_id: number
          tournament_id: number
          updated_at: string | null
        }
        Insert: {
          course_name?: string | null
          end_date?: string | null
          name: string
          start_date?: string | null
          status?: string | null
          tour_id: number
          tournament_id: number
          updated_at?: string | null
        }
        Update: {
          course_name?: string | null
          end_date?: string | null
          name?: string
          start_date?: string | null
          status?: string | null
          tour_id?: number
          tournament_id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sgt_tournaments_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "sgt_tours"
            referencedColumns: ["tour_id"]
          },
        ]
      }
      sgt_tours: {
        Row: {
          active: number | null
          end_date: string | null
          name: string
          start_date: string | null
          team_tour: number | null
          tour_id: number
          updated_at: string | null
        }
        Insert: {
          active?: number | null
          end_date?: string | null
          name: string
          start_date?: string | null
          team_tour?: number | null
          tour_id: number
          updated_at?: string | null
        }
        Update: {
          active?: number | null
          end_date?: string | null
          name?: string
          start_date?: string | null
          team_tour?: number | null
          tour_id?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      sgt_members_safe: {
        Row: {
          updated_at: string | null
          user_active: number | null
          user_country_code: string | null
          user_has_avatar: string | null
          user_id: number | null
          user_name: string | null
        }
        Insert: {
          updated_at?: string | null
          user_active?: number | null
          user_country_code?: string | null
          user_has_avatar?: string | null
          user_id?: number | null
          user_name?: string | null
        }
        Update: {
          updated_at?: string | null
          user_active?: number | null
          user_country_code?: string | null
          user_has_avatar?: string | null
          user_id?: number | null
          user_name?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_user_sgt_id: { Args: { _user_id: string }; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "member"
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
      app_role: ["admin", "member"],
    },
  },
} as const

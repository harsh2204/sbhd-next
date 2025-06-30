export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      card_decks: {
        Row: {
          cards: Json
          deck_type: string
          game_id: string
          id: string
          used_cards: Json
        }
        Insert: {
          cards?: Json
          deck_type: string
          game_id: string
          id?: string
          used_cards?: Json
        }
        Update: {
          cards?: Json
          deck_type?: string
          game_id?: string
          id?: string
          used_cards?: Json
        }
        Relationships: [
          {
            foreignKeyName: "card_decks_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      game_events: {
        Row: {
          created_at: string | null
          created_by: string | null
          event_data: Json | null
          event_type: string
          game_id: string
          id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          event_data?: Json | null
          event_type: string
          game_id: string
          id?: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          event_data?: Json | null
          event_type?: string
          game_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_events_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      games: {
        Row: {
          created_at: string | null
          current_player_turn: number | null
          current_round: number | null
          deceased_estate: string | null
          deceased_identity: string | null
          deceased_name: string | null
          estate_keeper_id: string | null
          game_code: string
          game_settings: Json | null
          host_id: string | null
          id: string
          max_rounds: number | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          current_player_turn?: number | null
          current_round?: number | null
          deceased_estate?: string | null
          deceased_identity?: string | null
          deceased_name?: string | null
          estate_keeper_id?: string | null
          game_code: string
          game_settings?: Json | null
          host_id?: string | null
          id?: string
          max_rounds?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          current_player_turn?: number | null
          current_round?: number | null
          deceased_estate?: string | null
          deceased_identity?: string | null
          deceased_name?: string | null
          estate_keeper_id?: string | null
          game_code?: string
          game_settings?: Json | null
          host_id?: string | null
          id?: string
          max_rounds?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      players: {
        Row: {
          cards: Json | null
          game_id: string
          id: string
          is_estate_keeper: boolean | null
          is_host: boolean | null
          is_ready: boolean | null
          joined_at: string | null
          name: string
          score: number | null
        }
        Insert: {
          cards?: Json | null
          game_id: string
          id?: string
          is_estate_keeper?: boolean | null
          is_host?: boolean | null
          is_ready?: boolean | null
          joined_at?: string | null
          name: string
          score?: number | null
        }
        Update: {
          cards?: Json | null
          game_id?: string
          id?: string
          is_estate_keeper?: boolean | null
          is_host?: boolean | null
          is_ready?: boolean | null
          joined_at?: string | null
          name?: string
          score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "players_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_game_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      initialize_card_decks: {
        Args: { game_id: string }
        Returns: undefined
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

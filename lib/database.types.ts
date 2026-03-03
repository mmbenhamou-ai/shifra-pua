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
      app_settings: {
        Row: {
          key: string
          updated_at: string | null
          value: string | null
        }
        Insert: {
          key: string
          updated_at?: string | null
          value?: string | null
        }
        Update: {
          key?: string
          updated_at?: string | null
          value?: string | null
        }
        Relationships: []
      }
      beneficiaries: {
        Row: {
          active: boolean
          birth_date: string | null
          children_ages: number[] | null
          cooking_notes: string | null
          created_at: string | null
          end_date: string | null
          id: string
          is_vegetarian: boolean | null
          num_adults: number | null
          num_breakfast_days: number
          num_children: number | null
          num_shabbat_weeks: number
          preferred_time_slot_id: string | null
          shabbat_friday: boolean | null
          shabbat_kashrut: string | null
          shabbat_saturday: boolean | null
          spicy_level: number | null
          start_date: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          active?: boolean
          birth_date?: string | null
          children_ages?: number[] | null
          cooking_notes?: string | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          is_vegetarian?: boolean | null
          num_adults?: number | null
          num_breakfast_days?: number
          num_children?: number | null
          num_shabbat_weeks?: number
          preferred_time_slot_id?: string | null
          shabbat_friday?: boolean | null
          shabbat_kashrut?: string | null
          shabbat_saturday?: boolean | null
          spicy_level?: number | null
          start_date: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          active?: boolean
          birth_date?: string | null
          children_ages?: number[] | null
          cooking_notes?: string | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          is_vegetarian?: boolean | null
          num_adults?: number | null
          num_breakfast_days?: number
          num_children?: number | null
          num_shabbat_weeks?: number
          preferred_time_slot_id?: string | null
          shabbat_friday?: boolean | null
          shabbat_kashrut?: string | null
          shabbat_saturday?: boolean | null
          spicy_level?: number | null
          start_date?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "beneficiaries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_beneficiaries_time_slot"
            columns: ["preferred_time_slot_id"]
            isOneToOne: false
            referencedRelation: "time_slots"
            referencedColumns: ["id"]
          },
        ]
      }
      feedbacks: {
        Row: {
          author_id: string
          created_at: string
          id: string
          meal_id: string
          message: string | null
          rating: number | null
          sent_wa: boolean
          target_id: string | null
        }
        Insert: {
          author_id: string
          created_at?: string
          id?: string
          meal_id: string
          message?: string | null
          rating?: number | null
          sent_wa?: boolean
          target_id?: string | null
        }
        Update: {
          author_id?: string
          created_at?: string
          id?: string
          meal_id?: string
          message?: string | null
          rating?: number | null
          sent_wa?: boolean
          target_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feedbacks_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedbacks_meal_id_fkey"
            columns: ["meal_id"]
            isOneToOne: false
            referencedRelation: "meals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedbacks_target_id_fkey"
            columns: ["target_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_items: {
        Row: {
          cook_id: string | null
          created_at: string
          id: string
          item_name: string
          item_type: string
          meal_id: string
          reserved_at: string | null
        }
        Insert: {
          cook_id?: string | null
          created_at?: string
          id?: string
          item_name: string
          item_type?: string
          meal_id: string
          reserved_at?: string | null
        }
        Update: {
          cook_id?: string | null
          created_at?: string
          id?: string
          item_name?: string
          item_type?: string
          meal_id?: string
          reserved_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meal_items_cook_id_fkey"
            columns: ["cook_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_items_meal_id_fkey"
            columns: ["meal_id"]
            isOneToOne: false
            referencedRelation: "meals"
            referencedColumns: ["id"]
          },
        ]
      }
      meals: {
        Row: {
          beneficiary_id: string
          conflict_at: string | null
          cook_id: string | null
          created_at: string | null
          date: string
          driver_id: string | null
          id: string
          menu_id: string | null
          status: string
          time_slot_id: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          beneficiary_id: string
          conflict_at?: string | null
          cook_id?: string | null
          created_at?: string | null
          date: string
          driver_id?: string | null
          id?: string
          menu_id?: string | null
          status?: string
          time_slot_id?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          beneficiary_id?: string
          conflict_at?: string | null
          cook_id?: string | null
          created_at?: string | null
          date?: string
          driver_id?: string | null
          id?: string
          menu_id?: string | null
          status?: string
          time_slot_id?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meals_beneficiary_id_fkey"
            columns: ["beneficiary_id"]
            isOneToOne: false
            referencedRelation: "beneficiaries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meals_cook_id_fkey"
            columns: ["cook_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meals_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meals_menu_id_fkey"
            columns: ["menu_id"]
            isOneToOne: false
            referencedRelation: "menus"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meals_time_slot_id_fkey"
            columns: ["time_slot_id"]
            isOneToOne: false
            referencedRelation: "time_slots"
            referencedColumns: ["id"]
          },
        ]
      }
      menus: {
        Row: {
          active: boolean
          created_at: string | null
          id: string
          items: string[]
          name: string
          type: string
        }
        Insert: {
          active?: boolean
          created_at?: string | null
          id?: string
          items?: string[]
          name: string
          type: string
        }
        Update: {
          active?: boolean
          created_at?: string | null
          id?: string
          items?: string[]
          name?: string
          type?: string
        }
        Relationships: []
      }
      notifications_log: {
        Row: {
          channel: string | null
          created_at: string
          id: string
          message: string
          read: boolean
          type: string | null
          user_id: string
        }
        Insert: {
          channel?: string | null
          created_at?: string
          id?: string
          message: string
          read?: boolean
          type?: string | null
          user_id: string
        }
        Update: {
          channel?: string | null
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      time_slots: {
        Row: {
          active: boolean
          created_at: string
          delivery_time: string
          id: string
          label: string
          max_per_slot: number
          meal_type: string
          pickup_time: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          delivery_time: string
          id?: string
          label: string
          max_per_slot?: number
          meal_type: string
          pickup_time: string
        }
        Update: {
          active?: boolean
          created_at?: string
          delivery_time?: string
          id?: string
          label?: string
          max_per_slot?: number
          meal_type?: string
          pickup_time?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          address: string | null
          also_driver: boolean | null
          approved: boolean
          created_at: string | null
          email: string | null
          id: string
          name: string | null
          neighborhood: string | null
          notif_cooking: boolean | null
          notif_delivery: boolean | null
          phone: string | null
          role: string
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          also_driver?: boolean | null
          approved?: boolean
          created_at?: string | null
          email?: string | null
          id: string
          name?: string | null
          neighborhood?: string | null
          notif_cooking?: boolean | null
          notif_delivery?: boolean | null
          phone?: string | null
          role: string
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          also_driver?: boolean | null
          approved?: boolean
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string | null
          neighborhood?: string | null
          notif_cooking?: boolean | null
          notif_delivery?: boolean | null
          phone?: string | null
          role?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      reserve_meal_item_atomic: {
        Args: { p_cook_id: string; p_item_id: string }
        Returns: {
          cook_id: string | null
          created_at: string
          id: string
          item_name: string
          item_type: string
          meal_id: string
          reserved_at: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "meal_items"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      take_meal_atomic: {
        Args: { p_meal_id: string; p_role: string; p_user_id: string }
        Returns: {
          beneficiary_id: string
          conflict_at: string | null
          cook_id: string | null
          created_at: string | null
          date: string
          driver_id: string | null
          id: string
          menu_id: string | null
          status: string
          time_slot_id: string | null
          type: string
          updated_at: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "meals"
          isOneToOne: false
          isSetofReturn: true
        }
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
    Enums: {},
  },
} as const


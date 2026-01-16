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
      clients: {
        Row: {
          active: boolean
          address: string
          created_at: string
          email: string
          first_name: string
          id: string
          last_name: string
          phone_number: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          active?: boolean
          address: string
          created_at?: string
          email: string
          first_name: string
          id?: string
          last_name: string
          phone_number: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          active?: boolean
          address?: string
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          phone_number?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      drivers: {
        Row: {
          active: boolean
          availability_status: string
          available_at: string | null
          created_at: string
          email: string
          first_name: string
          id: string
          last_name: string
          truck_number: string
          truck_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          availability_status?: string
          available_at?: string | null
          created_at?: string
          email: string
          first_name: string
          id?: string
          last_name: string
          truck_number: string
          truck_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          availability_status?: string
          available_at?: string | null
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          truck_number?: string
          truck_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      loads: {
        Row: {
          arrived_at: string | null
          arrived_at_delivery_at: string | null
          assigned_at: string | null
          bol_image_url: string | null
          client_id: string
          client_signature_url: string | null
          created_at: string
          delivered_at: string | null
          delivery_asap: boolean | null
          delivery_date: string | null
          delivery_time: string | null
          destination_address: string
          driver_id: string | null
          driver_name: string | null
          eta: string | null
          id: string
          in_transit_at: string | null
          loaded_at: string | null
          origin_address: string
          paid_at: string | null
          payment_intent_id: string | null
          payment_required: boolean | null
          payment_status: string | null
          pickup_date: string
          pickup_time: string | null
          price_cents: number | null
          signature_timestamp: string | null
          status: string
          trailer_type: string
          truck_number: string | null
          weight_lbs: number
        }
        Insert: {
          arrived_at?: string | null
          arrived_at_delivery_at?: string | null
          assigned_at?: string | null
          bol_image_url?: string | null
          client_id: string
          client_signature_url?: string | null
          created_at?: string
          delivered_at?: string | null
          delivery_asap?: boolean | null
          delivery_date?: string | null
          delivery_time?: string | null
          destination_address: string
          driver_id?: string | null
          driver_name?: string | null
          eta?: string | null
          id?: string
          in_transit_at?: string | null
          loaded_at?: string | null
          origin_address: string
          paid_at?: string | null
          payment_intent_id?: string | null
          payment_required?: boolean | null
          payment_status?: string | null
          pickup_date: string
          pickup_time?: string | null
          price_cents?: number | null
          signature_timestamp?: string | null
          status?: string
          trailer_type: string
          truck_number?: string | null
          weight_lbs: number
        }
        Update: {
          arrived_at?: string | null
          arrived_at_delivery_at?: string | null
          assigned_at?: string | null
          bol_image_url?: string | null
          client_id?: string
          client_signature_url?: string | null
          created_at?: string
          delivered_at?: string | null
          delivery_asap?: boolean | null
          delivery_date?: string | null
          delivery_time?: string | null
          destination_address?: string
          driver_id?: string | null
          driver_name?: string | null
          eta?: string | null
          id?: string
          in_transit_at?: string | null
          loaded_at?: string | null
          origin_address?: string
          paid_at?: string | null
          payment_intent_id?: string | null
          payment_required?: boolean | null
          payment_status?: string | null
          pickup_date?: string
          pickup_time?: string | null
          price_cents?: number | null
          signature_timestamp?: string | null
          status?: string
          trailer_type?: string
          truck_number?: string | null
          weight_lbs?: number
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          load_id: string | null
          message: string
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          load_id?: string | null
          message: string
          read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          load_id?: string | null
          message?: string
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_load_id_fkey"
            columns: ["load_id"]
            isOneToOne: false
            referencedRelation: "loads"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string
          user_id?: string
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
          role: Database["public"]["Enums"]["app_role"]
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
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "client" | "dispatcher" | "driver"
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
      app_role: ["client", "dispatcher", "driver"],
    },
  },
} as const

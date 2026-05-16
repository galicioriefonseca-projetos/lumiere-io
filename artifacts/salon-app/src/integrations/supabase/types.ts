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
      achievements: {
        Row: {
          amount: number
          category_id: string | null
          client_name: string | null
          created_at: string
          created_by: string | null
          description: string
          id: string
          kind: Database["public"]["Enums"]["achievement_kind"]
          occurred_at: string
          professional_id: string
          salon_id: string
        }
        Insert: {
          amount: number
          category_id?: string | null
          client_name?: string | null
          created_at?: string
          created_by?: string | null
          description: string
          id?: string
          kind: Database["public"]["Enums"]["achievement_kind"]
          occurred_at?: string
          professional_id: string
          salon_id: string
        }
        Update: {
          amount?: number
          category_id?: string | null
          client_name?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          kind?: Database["public"]["Enums"]["achievement_kind"]
          occurred_at?: string
          professional_id?: string
          salon_id?: string
        }
        Relationships: []
      }
      ai_insights: {
        Row: {
          body: Json
          created_at: string
          digital_signature: string
          generated_by: string | null
          id: string
          kind: string
          model: string
          salon_id: string
          summary: string
          title: string
        }
        Insert: {
          body?: Json
          created_at?: string
          digital_signature: string
          generated_by?: string | null
          id?: string
          kind: string
          model: string
          salon_id: string
          summary: string
          title: string
        }
        Update: {
          body?: Json
          created_at?: string
          digital_signature?: string
          generated_by?: string | null
          id?: string
          kind?: string
          model?: string
          salon_id?: string
          summary?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_insights_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          appointment_date: string
          client_id: string | null
          client_name: string | null
          created_at: string | null
          end_date: string
          id: string
          notes: string | null
          professional_id: string | null
          salon_id: string | null
          service_id: string | null
          status: Database["public"]["Enums"]["appointment_status"] | null
          updated_at: string | null
        }
        Insert: {
          appointment_date: string
          client_id?: string | null
          client_name?: string | null
          created_at?: string | null
          end_date: string
          id?: string
          notes?: string | null
          professional_id?: string | null
          salon_id?: string | null
          service_id?: string | null
          status?: Database["public"]["Enums"]["appointment_status"] | null
          updated_at?: string | null
        }
        Update: {
          appointment_date?: string
          client_id?: string | null
          client_name?: string | null
          created_at?: string | null
          end_date?: string
          id?: string
          notes?: string | null
          professional_id?: string | null
          salon_id?: string | null
          service_id?: string | null
          status?: Database["public"]["Enums"]["appointment_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          id: string
          meta: Json
          salon_id: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          id?: string
          meta?: Json
          salon_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          id?: string
          meta?: Json
          salon_id?: string | null
        }
        Relationships: []
      }
      badges: {
        Row: {
          awarded_at: string
          code: string
          id: string
          label: string
          professional_id: string
          reference_month: string
          salon_id: string
        }
        Insert: {
          awarded_at?: string
          code: string
          id?: string
          label: string
          professional_id: string
          reference_month: string
          salon_id: string
        }
        Update: {
          awarded_at?: string
          code?: string
          id?: string
          label?: string
          professional_id?: string
          reference_month?: string
          salon_id?: string
        }
        Relationships: []
      }
      checklist_run_items: {
        Row: {
          comment: string | null
          created_at: string
          done: boolean
          id: string
          label: string
          rating: number | null
          run_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          done?: boolean
          id?: string
          label: string
          rating?: number | null
          run_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          done?: boolean
          id?: string
          label?: string
          rating?: number | null
          run_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_run_items_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "checklist_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_runs: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          professional_id: string | null
          run_date: string
          salon_id: string
          score: number
          template_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          professional_id?: string | null
          run_date?: string
          salon_id: string
          score?: number
          template_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          professional_id?: string | null
          run_date?: string
          salon_id?: string
          score?: number
          template_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_runs_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_runs_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_runs_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "checklist_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_templates: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          id: string
          items: Json
          name: string
          salon_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          items?: Json
          name: string
          salon_id: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          items?: Json
          name?: string
          salon_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_templates_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      client_records: {
        Row: {
          anamnesis: Json
          birth_date: string | null
          client_email: string | null
          client_name: string
          client_phone: string | null
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          photos: Json
          professional_id: string | null
          salon_id: string
          updated_at: string
        }
        Insert: {
          anamnesis?: Json
          birth_date?: string | null
          client_email?: string | null
          client_name: string
          client_phone?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          photos?: Json
          professional_id?: string | null
          salon_id: string
          updated_at?: string
        }
        Update: {
          anamnesis?: Json
          birth_date?: string | null
          client_email?: string | null
          client_name?: string
          client_phone?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          photos?: Json
          professional_id?: string | null
          salon_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_records_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      commissions: {
        Row: {
          active: boolean
          category_id: string | null
          created_at: string
          id: string
          percent: number
          professional_id: string
          salon_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          category_id?: string | null
          created_at?: string
          id?: string
          percent: number
          professional_id: string
          salon_id: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          category_id?: string | null
          created_at?: string
          id?: string
          percent?: number
          professional_id?: string
          salon_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "commissions_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluations: {
        Row: {
          achievement_id: string | null
          client_name: string | null
          comment: string | null
          created_at: string
          id: string
          professional_id: string
          rating: number
          salon_id: string
        }
        Insert: {
          achievement_id?: string | null
          client_name?: string | null
          comment?: string | null
          created_at?: string
          id?: string
          professional_id: string
          rating: number
          salon_id: string
        }
        Update: {
          achievement_id?: string | null
          client_name?: string | null
          comment?: string | null
          created_at?: string
          id?: string
          professional_id?: string
          rating?: number
          salon_id?: string
        }
        Relationships: []
      }
      professionals: {
        Row: {
          active: boolean
          avatar_url: string | null
          created_at: string
          id: string
          name: string
          role: string | null
          salon_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          avatar_url?: string | null
          created_at?: string
          id?: string
          name: string
          role?: string | null
          salon_id: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          avatar_url?: string | null
          created_at?: string
          id?: string
          name?: string
          role?: string | null
          salon_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "professionals_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          birth_date: string | null
          created_at: string
          display_name: string | null
          email: string
          full_name: string | null
          id: string
          salon_id: string | null
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          birth_date?: string | null
          created_at?: string
          display_name?: string | null
          email: string
          full_name?: string | null
          id: string
          salon_id?: string | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          birth_date?: string | null
          created_at?: string
          display_name?: string | null
          email?: string
          full_name?: string | null
          id?: string
          salon_id?: string | null
          updated_at?: string
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      salon_goals: {
        Row: {
          created_at: string
          id: string
          month: number
          salon_id: string
          target_revenue: number
          updated_at: string
          year: number
        }
        Insert: {
          created_at?: string
          id?: string
          month: number
          salon_id: string
          target_revenue?: number
          updated_at?: string
          year: number
        }
        Update: {
          created_at?: string
          id?: string
          month?: number
          salon_id?: string
          target_revenue?: number
          updated_at?: string
          year?: number
        }
        Relationships: []
      }
      salon_invitations: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string | null
          role: Database["public"]["Enums"]["app_role"]
          salon_id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          salon_id: string
          token?: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          salon_id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "salon_invitations_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      salons: {
        Row: {
          activation_status: string
          brand_accent_color: string | null
          brand_primary_color: string | null
          business_type: Database["public"]["Enums"]["business_type"]
          created_at: string
          has_custom_branding: boolean
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          onboarded_at: string | null
          owner_name: string | null
          phone: string | null
          plan: Database["public"]["Enums"]["salon_plan"]
          tax_id: string | null
          tutorial_seen_at: string | null
          updated_at: string
        }
        Insert: {
          activation_status?: string
          brand_accent_color?: string | null
          brand_primary_color?: string | null
          business_type?: Database["public"]["Enums"]["business_type"]
          created_at?: string
          has_custom_branding?: boolean
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          onboarded_at?: string | null
          owner_name?: string | null
          phone?: string | null
          plan?: Database["public"]["Enums"]["salon_plan"]
          tax_id?: string | null
          tutorial_seen_at?: string | null
          updated_at?: string
        }
        Update: {
          activation_status?: string
          brand_accent_color?: string | null
          brand_primary_color?: string | null
          business_type?: Database["public"]["Enums"]["business_type"]
          created_at?: string
          has_custom_branding?: boolean
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          onboarded_at?: string | null
          owner_name?: string | null
          phone?: string | null
          plan?: Database["public"]["Enums"]["salon_plan"]
          tax_id?: string | null
          tutorial_seen_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      service_categories: {
        Row: {
          active: boolean
          color: string | null
          created_at: string
          icon: string | null
          id: string
          name: string
          salon_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          name: string
          salon_id: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
          salon_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_categories_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          category_id: string | null
          created_at: string | null
          description: string | null
          duration: number
          id: string
          is_active: boolean | null
          name: string
          price: number
          salon_id: string | null
          updated_at: string | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          duration?: number
          id?: string
          is_active?: boolean | null
          name: string
          price?: number
          salon_id?: string | null
          updated_at?: string | null
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          duration?: number
          id?: string
          is_active?: boolean | null
          name?: string
          price?: number
          salon_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "services_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "service_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          salon_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          salon_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          salon_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_salon_rpc: { Args: { _payload: Json }; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_master_admin: { Args: { _user_id: string }; Returns: boolean }
      salon_is_active: { Args: { _salon: string }; Returns: boolean }
    }
    Enums: {
      achievement_kind: "service" | "product"
      app_role: "master_admin" | "owner" | "manager" | "professional" | "platform_admin"
      appointment_status: "pending" | "confirmed" | "completed" | "cancelled"
      business_type: "salon" | "clinic"
      salon_plan: "studio" | "elite" | "start" | "performance" | "network" | "founder"
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
      achievement_kind: ["service", "product"],
      app_role: ["master_admin", "owner", "manager", "professional", "platform_admin"],
      appointment_status: ["pending", "confirmed", "completed", "cancelled"],
      business_type: ["salon", "clinic"],
      salon_plan: ["studio", "elite"],
    },
  },
} as const

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
      activity_log: {
        Row: {
          created_at: string
          description: string
          event_type: string
          id: number
          metadata: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          description: string
          event_type: string
          id?: number
          metadata?: Json
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string
          event_type?: string
          id?: number
          metadata?: Json
          user_id?: string
        }
        Relationships: []
      }
      activity_log_2026_03: {
        Row: {
          created_at: string
          description: string
          event_type: string
          id: number
          metadata: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          description: string
          event_type: string
          id?: number
          metadata?: Json
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string
          event_type?: string
          id?: number
          metadata?: Json
          user_id?: string
        }
        Relationships: []
      }
      activity_log_2026_04: {
        Row: {
          created_at: string
          description: string
          event_type: string
          id: number
          metadata: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          description: string
          event_type: string
          id?: number
          metadata?: Json
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string
          event_type?: string
          id?: number
          metadata?: Json
          user_id?: string
        }
        Relationships: []
      }
      activity_log_2026_05: {
        Row: {
          created_at: string
          description: string
          event_type: string
          id: number
          metadata: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          description: string
          event_type: string
          id?: number
          metadata?: Json
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string
          event_type?: string
          id?: number
          metadata?: Json
          user_id?: string
        }
        Relationships: []
      }
      activity_log_2026_06: {
        Row: {
          created_at: string
          description: string
          event_type: string
          id: number
          metadata: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          description: string
          event_type: string
          id?: number
          metadata?: Json
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string
          event_type?: string
          id?: number
          metadata?: Json
          user_id?: string
        }
        Relationships: []
      }
      activity_log_2026_07: {
        Row: {
          created_at: string
          description: string
          event_type: string
          id: number
          metadata: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          description: string
          event_type: string
          id?: number
          metadata?: Json
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string
          event_type?: string
          id?: number
          metadata?: Json
          user_id?: string
        }
        Relationships: []
      }
      activity_log_2026_08: {
        Row: {
          created_at: string
          description: string
          event_type: string
          id: number
          metadata: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          description: string
          event_type: string
          id?: number
          metadata?: Json
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string
          event_type?: string
          id?: number
          metadata?: Json
          user_id?: string
        }
        Relationships: []
      }
      activity_log_2026_09: {
        Row: {
          created_at: string
          description: string
          event_type: string
          id: number
          metadata: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          description: string
          event_type: string
          id?: number
          metadata?: Json
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string
          event_type?: string
          id?: number
          metadata?: Json
          user_id?: string
        }
        Relationships: []
      }
      activity_log_2026_10: {
        Row: {
          created_at: string
          description: string
          event_type: string
          id: number
          metadata: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          description: string
          event_type: string
          id?: number
          metadata?: Json
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string
          event_type?: string
          id?: number
          metadata?: Json
          user_id?: string
        }
        Relationships: []
      }
      activity_log_2026_11: {
        Row: {
          created_at: string
          description: string
          event_type: string
          id: number
          metadata: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          description: string
          event_type: string
          id?: number
          metadata?: Json
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string
          event_type?: string
          id?: number
          metadata?: Json
          user_id?: string
        }
        Relationships: []
      }
      activity_log_2026_12: {
        Row: {
          created_at: string
          description: string
          event_type: string
          id: number
          metadata: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          description: string
          event_type: string
          id?: number
          metadata?: Json
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string
          event_type?: string
          id?: number
          metadata?: Json
          user_id?: string
        }
        Relationships: []
      }
      activity_log_2027_01: {
        Row: {
          created_at: string
          description: string
          event_type: string
          id: number
          metadata: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          description: string
          event_type: string
          id?: number
          metadata?: Json
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string
          event_type?: string
          id?: number
          metadata?: Json
          user_id?: string
        }
        Relationships: []
      }
      activity_log_2027_02: {
        Row: {
          created_at: string
          description: string
          event_type: string
          id: number
          metadata: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          description: string
          event_type: string
          id?: number
          metadata?: Json
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string
          event_type?: string
          id?: number
          metadata?: Json
          user_id?: string
        }
        Relationships: []
      }
      ai_match_preferences: {
        Row: {
          bedrooms_max: number | null
          bedrooms_min: number | null
          budget_max: number | null
          budget_min: number | null
          id: string
          lifestyle_factors: Json | null
          location: string | null
          must_haves: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          bedrooms_max?: number | null
          bedrooms_min?: number | null
          budget_max?: number | null
          budget_min?: number | null
          id?: string
          lifestyle_factors?: Json | null
          location?: string | null
          must_haves?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          bedrooms_max?: number | null
          bedrooms_min?: number | null
          budget_max?: number | null
          budget_min?: number | null
          id?: string
          lifestyle_factors?: Json | null
          location?: string | null
          must_haves?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_match_results: {
        Row: {
          computed_at: string
          expires_at: string
          id: string
          listing_id: string
          match_reasons: Json | null
          match_score: number
          user_id: string
        }
        Insert: {
          computed_at?: string
          expires_at?: string
          id?: string
          listing_id: string
          match_reasons?: Json | null
          match_score: number
          user_id: string
        }
        Update: {
          computed_at?: string
          expires_at?: string
          id?: string
          listing_id?: string
          match_reasons?: Json | null
          match_score?: number
          user_id?: string
        }
        Relationships: []
      }
      auth_audit_log: {
        Row: {
          created_at: string | null
          event_details: Json | null
          event_type: string
          id: number
          ip_address: unknown
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_details?: Json | null
          event_type: string
          id?: number
          ip_address?: unknown
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_details?: Json | null
          event_type?: string
          id?: number
          ip_address?: unknown
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      booking_state_transitions: {
        Row: {
          allowed_by: string[]
          from_status: Database["public"]["Enums"]["booking_status"]
          id: string
          requires_reason: boolean
          to_status: Database["public"]["Enums"]["booking_status"]
        }
        Insert: {
          allowed_by?: string[]
          from_status: Database["public"]["Enums"]["booking_status"]
          id?: string
          requires_reason?: boolean
          to_status: Database["public"]["Enums"]["booking_status"]
        }
        Update: {
          allowed_by?: string[]
          from_status?: Database["public"]["Enums"]["booking_status"]
          id?: string
          requires_reason?: boolean
          to_status?: Database["public"]["Enums"]["booking_status"]
        }
        Relationships: []
      }
      booking_status_history: {
        Row: {
          booking_id: string
          changed_by: string | null
          created_at: string | null
          from_status: Database["public"]["Enums"]["booking_status"] | null
          id: string
          reason: string | null
          to_status: Database["public"]["Enums"]["booking_status"]
        }
        Insert: {
          booking_id: string
          changed_by?: string | null
          created_at?: string | null
          from_status?: Database["public"]["Enums"]["booking_status"] | null
          id?: string
          reason?: string | null
          to_status: Database["public"]["Enums"]["booking_status"]
        }
        Update: {
          booking_id?: string
          changed_by?: string | null
          created_at?: string | null
          from_status?: Database["public"]["Enums"]["booking_status"] | null
          id?: string
          reason?: string | null
          to_status?: Database["public"]["Enums"]["booking_status"]
        }
        Relationships: [
          {
            foreignKeyName: "booking_status_history_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          actual_end_date: string | null
          actual_start_date: string | null
          booking_reference: string | null
          cancellation_reason: string | null
          cancelled_by: string | null
          created_at: string | null
          id: string
          provider_id: string
          quote_id: string | null
          scheduled_end_date: string
          scheduled_start_date: string
          service_request_id: string | null
          status: Database["public"]["Enums"]["booking_status"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          actual_end_date?: string | null
          actual_start_date?: string | null
          booking_reference?: string | null
          cancellation_reason?: string | null
          cancelled_by?: string | null
          created_at?: string | null
          id?: string
          provider_id: string
          quote_id?: string | null
          scheduled_end_date: string
          scheduled_start_date: string
          service_request_id?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          actual_end_date?: string | null
          actual_start_date?: string | null
          booking_reference?: string | null
          cancellation_reason?: string | null
          cancelled_by?: string | null
          created_at?: string | null
          id?: string
          provider_id?: string
          quote_id?: string | null
          scheduled_end_date?: string
          scheduled_start_date?: string
          service_request_id?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_cancelled_by_fkey"
            columns: ["cancelled_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "service_provider_details"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "bookings_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_service_request_id_fkey"
            columns: ["service_request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      consent_audit_log: {
        Row: {
          consent_type: string
          created_at: string | null
          id: number
          ip_address: unknown
          new_value: boolean
          old_value: boolean | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          consent_type: string
          created_at?: string | null
          id?: number
          ip_address?: unknown
          new_value: boolean
          old_value?: boolean | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          consent_type?: string
          created_at?: string | null
          id?: number
          ip_address?: unknown
          new_value?: boolean
          old_value?: boolean | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      consent_records: {
        Row: {
          consent_type: string
          created_at: string | null
          granted: boolean
          id: string
          ip_address: unknown
          updated_at: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          consent_type: string
          created_at?: string | null
          granted?: boolean
          id?: string
          ip_address?: unknown
          updated_at?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          consent_type?: string
          created_at?: string | null
          granted?: boolean
          id?: string
          ip_address?: unknown
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      content_reports: {
        Row: {
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          reason: string
          reporter_id: string
          resolution_note: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string
        }
        Insert: {
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          reason: string
          reporter_id: string
          resolution_note?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          reason?: string
          reporter_id?: string
          resolution_note?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
        }
        Relationships: []
      }
      conversation_read_status: {
        Row: {
          conversation_id: string
          last_read_at: string
          user_id: string
        }
        Insert: {
          conversation_id: string
          last_read_at?: string
          user_id: string
        }
        Update: {
          conversation_id?: string
          last_read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_read_status_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          context_id: string | null
          context_type: string
          created_at: string
          id: string
          last_message_at: string
          participant_1_id: string
          participant_2_id: string
        }
        Insert: {
          context_id?: string | null
          context_type: string
          created_at?: string
          id?: string
          last_message_at?: string
          participant_1_id: string
          participant_2_id: string
        }
        Update: {
          context_id?: string | null
          context_type?: string
          created_at?: string
          id?: string
          last_message_at?: string
          participant_1_id?: string
          participant_2_id?: string
        }
        Relationships: []
      }
      deletion_requests: {
        Row: {
          id: string
          purged_at: string | null
          requested_at: string | null
          scheduled_purge_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          id?: string
          purged_at?: string | null
          requested_at?: string | null
          scheduled_purge_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          id?: string
          purged_at?: string | null
          requested_at?: string | null
          scheduled_purge_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      financial_entries: {
        Row: {
          amount: number
          category: string
          created_at: string | null
          description: string | null
          entry_date: string
          id: string
          property_id: string
          receipt_url: string | null
          type: Database["public"]["Enums"]["financial_entry_type"]
          user_id: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string | null
          description?: string | null
          entry_date?: string
          id?: string
          property_id: string
          receipt_url?: string | null
          type: Database["public"]["Enums"]["financial_entry_type"]
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string | null
          description?: string | null
          entry_date?: string
          id?: string
          property_id?: string
          receipt_url?: string | null
          type?: Database["public"]["Enums"]["financial_entry_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_entries_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_entries_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "search_listings"
            referencedColumns: ["property_id"]
          },
        ]
      }
      listing_moderation: {
        Row: {
          created_at: string
          flags: Json
          id: string
          listing_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
        }
        Insert: {
          created_at?: string
          flags?: Json
          id?: string
          listing_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          flags?: Json
          id?: string
          listing_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Relationships: []
      }
      listings: {
        Row: {
          available_from: string | null
          created_at: string | null
          deleted_at: string | null
          enquiry_count: number | null
          favorite_count: number | null
          ground_rent_annual: number | null
          id: string
          listed_date: string | null
          listing_type: Database["public"]["Enums"]["listing_type"]
          price: number
          price_qualifier: string | null
          property_id: string
          rent_frequency: string | null
          service_charge_annual: number | null
          slug: string | null
          status: Database["public"]["Enums"]["listing_status"] | null
          updated_at: string | null
          user_id: string
          view_count: number | null
        }
        Insert: {
          available_from?: string | null
          created_at?: string | null
          deleted_at?: string | null
          enquiry_count?: number | null
          favorite_count?: number | null
          ground_rent_annual?: number | null
          id?: string
          listed_date?: string | null
          listing_type: Database["public"]["Enums"]["listing_type"]
          price: number
          price_qualifier?: string | null
          property_id: string
          rent_frequency?: string | null
          service_charge_annual?: number | null
          slug?: string | null
          status?: Database["public"]["Enums"]["listing_status"] | null
          updated_at?: string | null
          user_id: string
          view_count?: number | null
        }
        Update: {
          available_from?: string | null
          created_at?: string | null
          deleted_at?: string | null
          enquiry_count?: number | null
          favorite_count?: number | null
          ground_rent_annual?: number | null
          id?: string
          listed_date?: string | null
          listing_type?: Database["public"]["Enums"]["listing_type"]
          price?: number
          price_qualifier?: string | null
          property_id?: string
          rent_frequency?: string | null
          service_charge_annual?: number | null
          slug?: string | null
          status?: Database["public"]["Enums"]["listing_status"] | null
          updated_at?: string | null
          user_id?: string
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "listings_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "search_listings"
            referencedColumns: ["property_id"]
          },
        ]
      }
      maintenance_requests: {
        Row: {
          created_at: string | null
          description: string
          id: string
          photo_urls: string[] | null
          priority: Database["public"]["Enums"]["maintenance_priority"]
          property_id: string
          reported_by: string
          resolution_notes: string | null
          resolved_at: string | null
          status: Database["public"]["Enums"]["maintenance_status"]
          tenancy_id: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: string
          photo_urls?: string[] | null
          priority?: Database["public"]["Enums"]["maintenance_priority"]
          property_id: string
          reported_by: string
          resolution_notes?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["maintenance_status"]
          tenancy_id?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          photo_urls?: string[] | null
          priority?: Database["public"]["Enums"]["maintenance_priority"]
          property_id?: string
          reported_by?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["maintenance_status"]
          tenancy_id?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_requests_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_requests_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "search_listings"
            referencedColumns: ["property_id"]
          },
          {
            foreignKeyName: "maintenance_requests_tenancy_id_fkey"
            columns: ["tenancy_id"]
            isOneToOne: false
            referencedRelation: "tenancies"
            referencedColumns: ["id"]
          },
        ]
      }
      market_pricing: {
        Row: {
          data_source: string
          id: string
          last_updated: string
          price_high: number
          price_low: number
          price_median: number
          region: string
          sample_size: number
          service_category: string
        }
        Insert: {
          data_source: string
          id?: string
          last_updated?: string
          price_high: number
          price_low: number
          price_median: number
          region: string
          sample_size?: number
          service_category: string
        }
        Update: {
          data_source?: string
          id?: string
          last_updated?: string
          price_high?: number
          price_low?: number
          price_median?: number
          region?: string
          sample_size?: number
          service_category?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          attachment_size_bytes: number | null
          attachment_type: string | null
          attachment_url: string | null
          content: string
          conversation_id: string
          created_at: string
          id: string
          sender_id: string
        }
        Insert: {
          attachment_size_bytes?: number | null
          attachment_type?: string | null
          attachment_url?: string | null
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          sender_id: string
        }
        Update: {
          attachment_size_bytes?: number | null
          attachment_type?: string | null
          attachment_url?: string | null
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      moderation_queue: {
        Row: {
          assigned_at: string | null
          assigned_to: string | null
          completed_at: string | null
          created_at: string | null
          decision: string | null
          id: string
          priority_score: number | null
          reason: string | null
          review_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string | null
          decision?: string | null
          id?: string
          priority_score?: number | null
          reason?: string | null
          review_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string | null
          decision?: string | null
          id?: string
          priority_score?: number | null
          reason?: string | null
          review_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "moderation_queue_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_queue_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      moving_checklist_items: {
        Row: {
          completed_at: string | null
          created_at: string
          description: string | null
          id: string
          is_completed: boolean
          offer_id: string | null
          offer_stage: string | null
          sort_order: number
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_completed?: boolean
          offer_id?: string | null
          offer_stage?: string | null
          sort_order?: number
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_completed?: boolean
          offer_id?: string | null
          offer_stage?: string | null
          sort_order?: number
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "moving_checklist_items_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
        ]
      }
      offer_status_history: {
        Row: {
          changed_by: string | null
          created_at: string
          from_status: string | null
          id: string
          notes: string | null
          offer_id: string
          to_status: string
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          from_status?: string | null
          id?: string
          notes?: string | null
          offer_id: string
          to_status: string
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          from_status?: string | null
          id?: string
          notes?: string | null
          offer_id?: string
          to_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "offer_status_history_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
        ]
      }
      offers: {
        Row: {
          agent_id: string
          aip_document_path: string | null
          amount: number
          conditions: string | null
          created_at: string
          id: string
          listing_id: string
          solicitor_email: string | null
          solicitor_id: string | null
          solicitor_name: string | null
          solicitor_phone: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          agent_id: string
          aip_document_path?: string | null
          amount: number
          conditions?: string | null
          created_at?: string
          id?: string
          listing_id: string
          solicitor_email?: string | null
          solicitor_id?: string | null
          solicitor_name?: string | null
          solicitor_phone?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          agent_id?: string
          aip_document_path?: string | null
          amount?: number
          conditions?: string | null
          created_at?: string
          id?: string
          listing_id?: string
          solicitor_email?: string | null
          solicitor_id?: string | null
          solicitor_name?: string | null
          solicitor_phone?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      platform_events: {
        Row: {
          actor_id: string
          created_at: string
          entity_id: string
          entity_type: string
          event_type: string
          id: number
          metadata: Json
        }
        Insert: {
          actor_id: string
          created_at?: string
          entity_id: string
          entity_type: string
          event_type: string
          id?: number
          metadata?: Json
        }
        Update: {
          actor_id?: string
          created_at?: string
          entity_id?: string
          entity_type?: string
          event_type?: string
          id?: number
          metadata?: Json
        }
        Relationships: []
      }
      price_history: {
        Row: {
          changed_at: string | null
          changed_by: string | null
          id: string
          listing_id: string
          new_price: number
          old_price: number
        }
        Insert: {
          changed_at?: string | null
          changed_by?: string | null
          id?: string
          listing_id: string
          new_price: number
          old_price: number
        }
        Update: {
          changed_at?: string | null
          changed_by?: string | null
          id?: string
          listing_id?: string
          new_price?: number
          old_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "price_history_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_history_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "search_listings"
            referencedColumns: ["listing_id"]
          },
        ]
      }
      profiles: {
        Row: {
          active_role: Database["public"]["Enums"]["user_role"]
          avatar_url: string | null
          created_at: string | null
          deleted_at: string | null
          display_name: string | null
          id: string
          is_admin: boolean | null
          notifications_read_at: string | null
          phone: string | null
          phone_verified: boolean | null
          preferences: Json
          provider_details: Json | null
          provider_verification_status: Database["public"]["Enums"]["provider_verification_status"]
          updated_at: string | null
          verification_level: Database["public"]["Enums"]["verification_level"]
        }
        Insert: {
          active_role?: Database["public"]["Enums"]["user_role"]
          avatar_url?: string | null
          created_at?: string | null
          deleted_at?: string | null
          display_name?: string | null
          id: string
          is_admin?: boolean | null
          notifications_read_at?: string | null
          phone?: string | null
          phone_verified?: boolean | null
          preferences?: Json
          provider_details?: Json | null
          provider_verification_status?: Database["public"]["Enums"]["provider_verification_status"]
          updated_at?: string | null
          verification_level?: Database["public"]["Enums"]["verification_level"]
        }
        Update: {
          active_role?: Database["public"]["Enums"]["user_role"]
          avatar_url?: string | null
          created_at?: string | null
          deleted_at?: string | null
          display_name?: string | null
          id?: string
          is_admin?: boolean | null
          notifications_read_at?: string | null
          phone?: string | null
          phone_verified?: boolean | null
          preferences?: Json
          provider_details?: Json | null
          provider_verification_status?: Database["public"]["Enums"]["provider_verification_status"]
          updated_at?: string | null
          verification_level?: Database["public"]["Enums"]["verification_level"]
        }
        Relationships: []
      }
      properties: {
        Row: {
          address_line1: string
          address_line2: string | null
          bathrooms: number
          bedrooms: number
          city: string
          coordinates: unknown
          council_tax_band: string | null
          county: string | null
          created_at: string | null
          deleted_at: string | null
          description: string
          description_tsv: unknown
          epc_rating: string | null
          epc_score: number | null
          features: Json | null
          id: string
          lease_remaining_years: number | null
          new_build: boolean | null
          postcode: string
          property_type: Database["public"]["Enums"]["property_type"]
          reception_rooms: number | null
          square_footage: number | null
          tenure: Database["public"]["Enums"]["tenure_type"] | null
          title: string
          updated_at: string | null
          year_built: number | null
        }
        Insert: {
          address_line1: string
          address_line2?: string | null
          bathrooms: number
          bedrooms: number
          city: string
          coordinates?: unknown
          council_tax_band?: string | null
          county?: string | null
          created_at?: string | null
          deleted_at?: string | null
          description: string
          description_tsv?: unknown
          epc_rating?: string | null
          epc_score?: number | null
          features?: Json | null
          id?: string
          lease_remaining_years?: number | null
          new_build?: boolean | null
          postcode: string
          property_type: Database["public"]["Enums"]["property_type"]
          reception_rooms?: number | null
          square_footage?: number | null
          tenure?: Database["public"]["Enums"]["tenure_type"] | null
          title: string
          updated_at?: string | null
          year_built?: number | null
        }
        Update: {
          address_line1?: string
          address_line2?: string | null
          bathrooms?: number
          bedrooms?: number
          city?: string
          coordinates?: unknown
          council_tax_band?: string | null
          county?: string | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string
          description_tsv?: unknown
          epc_rating?: string | null
          epc_score?: number | null
          features?: Json | null
          id?: string
          lease_remaining_years?: number | null
          new_build?: boolean | null
          postcode?: string
          property_type?: Database["public"]["Enums"]["property_type"]
          reception_rooms?: number | null
          square_footage?: number | null
          tenure?: Database["public"]["Enums"]["tenure_type"] | null
          title?: string
          updated_at?: string | null
          year_built?: number | null
        }
        Relationships: []
      }
      property_documents: {
        Row: {
          category: Database["public"]["Enums"]["document_category"]
          created_at: string | null
          expiry_date: string | null
          file_size: number | null
          file_url: string
          id: string
          name: string
          next_reminder_date: string | null
          property_id: string
          reminder_sent: boolean | null
          tenancy_id: string | null
          uploaded_by: string
        }
        Insert: {
          category: Database["public"]["Enums"]["document_category"]
          created_at?: string | null
          expiry_date?: string | null
          file_size?: number | null
          file_url: string
          id?: string
          name: string
          next_reminder_date?: string | null
          property_id: string
          reminder_sent?: boolean | null
          tenancy_id?: string | null
          uploaded_by: string
        }
        Update: {
          category?: Database["public"]["Enums"]["document_category"]
          created_at?: string | null
          expiry_date?: string | null
          file_size?: number | null
          file_url?: string
          id?: string
          name?: string
          next_reminder_date?: string | null
          property_id?: string
          reminder_sent?: boolean | null
          tenancy_id?: string | null
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_documents_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_documents_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "search_listings"
            referencedColumns: ["property_id"]
          },
          {
            foreignKeyName: "property_documents_tenancy_id_fkey"
            columns: ["tenancy_id"]
            isOneToOne: false
            referencedRelation: "tenancies"
            referencedColumns: ["id"]
          },
        ]
      }
      property_media: {
        Row: {
          alt_text: string | null
          caption: string | null
          created_at: string | null
          file_size: number | null
          id: string
          listing_id: string
          media_type: Database["public"]["Enums"]["media_type"]
          original_filename: string | null
          sort_order: number | null
          thumbnail_url: string | null
          uploaded_by: string | null
          url: string
        }
        Insert: {
          alt_text?: string | null
          caption?: string | null
          created_at?: string | null
          file_size?: number | null
          id?: string
          listing_id: string
          media_type: Database["public"]["Enums"]["media_type"]
          original_filename?: string | null
          sort_order?: number | null
          thumbnail_url?: string | null
          uploaded_by?: string | null
          url: string
        }
        Update: {
          alt_text?: string | null
          caption?: string | null
          created_at?: string | null
          file_size?: number | null
          id?: string
          listing_id?: string
          media_type?: Database["public"]["Enums"]["media_type"]
          original_filename?: string | null
          sort_order?: number | null
          thumbnail_url?: string | null
          uploaded_by?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_media_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_media_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "search_listings"
            referencedColumns: ["listing_id"]
          },
        ]
      }
      provider_availability: {
        Row: {
          created_at: string | null
          end_date: string
          id: string
          provider_id: string
          reason: string | null
          start_date: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          end_date: string
          id?: string
          provider_id: string
          reason?: string | null
          start_date: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          end_date?: string
          id?: string
          provider_id?: string
          reason?: string | null
          start_date?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "provider_availability_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "service_provider_details"
            referencedColumns: ["user_id"]
          },
        ]
      }
      provider_documents: {
        Row: {
          created_at: string | null
          document_type: Database["public"]["Enums"]["verification_document_type"]
          expiry_date: string | null
          file_name: string
          file_size: number
          file_url: string
          id: string
          mime_type: string
          reviewed_at: string | null
          reviewed_by: string | null
          reviewer_notes: string | null
          updated_at: string | null
          user_id: string
          verification_status: Database["public"]["Enums"]["document_verification_status"]
        }
        Insert: {
          created_at?: string | null
          document_type: Database["public"]["Enums"]["verification_document_type"]
          expiry_date?: string | null
          file_name: string
          file_size: number
          file_url: string
          id?: string
          mime_type: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          updated_at?: string | null
          user_id: string
          verification_status?: Database["public"]["Enums"]["document_verification_status"]
        }
        Update: {
          created_at?: string | null
          document_type?: Database["public"]["Enums"]["verification_document_type"]
          expiry_date?: string | null
          file_name?: string
          file_size?: number
          file_url?: string
          id?: string
          mime_type?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          updated_at?: string | null
          user_id?: string
          verification_status?: Database["public"]["Enums"]["document_verification_status"]
        }
        Relationships: [
          {
            foreignKeyName: "provider_documents_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_documents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_rating_stats: {
        Row: {
          average_rating: number | null
          avg_professionalism: number | null
          avg_punctuality: number | null
          avg_quality: number | null
          avg_value: number | null
          count_1_star: number | null
          count_2_star: number | null
          count_3_star: number | null
          count_4_star: number | null
          count_5_star: number | null
          last_review_date: string | null
          provider_id: string
          response_rate: number | null
          reviews_with_responses: number | null
          total_helpful_votes: number | null
          total_reviews: number | null
          updated_at: string | null
        }
        Insert: {
          average_rating?: number | null
          avg_professionalism?: number | null
          avg_punctuality?: number | null
          avg_quality?: number | null
          avg_value?: number | null
          count_1_star?: number | null
          count_2_star?: number | null
          count_3_star?: number | null
          count_4_star?: number | null
          count_5_star?: number | null
          last_review_date?: string | null
          provider_id: string
          response_rate?: number | null
          reviews_with_responses?: number | null
          total_helpful_votes?: number | null
          total_reviews?: number | null
          updated_at?: string | null
        }
        Update: {
          average_rating?: number | null
          avg_professionalism?: number | null
          avg_punctuality?: number | null
          avg_quality?: number | null
          avg_value?: number | null
          count_1_star?: number | null
          count_2_star?: number | null
          count_3_star?: number | null
          count_4_star?: number | null
          count_5_star?: number | null
          last_review_date?: string | null
          provider_id?: string
          response_rate?: number | null
          reviews_with_responses?: number | null
          total_helpful_votes?: number | null
          total_reviews?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "provider_rating_stats_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: true
            referencedRelation: "service_provider_details"
            referencedColumns: ["user_id"]
          },
        ]
      }
      provider_verifications: {
        Row: {
          created_at: string | null
          document_url: string | null
          id: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          stage: Database["public"]["Enums"]["verification_stage"]
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          document_url?: string | null
          id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          stage: Database["public"]["Enums"]["verification_stage"]
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          document_url?: string | null
          id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          stage?: Database["public"]["Enums"]["verification_stage"]
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          created_at: string
          endpoint: string
          id: string
          keys: Json
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          endpoint: string
          id?: string
          keys: Json
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          endpoint?: string
          id?: string
          keys?: Json
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      quotes: {
        Row: {
          created_at: string | null
          estimated_duration: string | null
          id: string
          line_items: Json
          payment_terms: string | null
          provider_id: string
          quote_number: string | null
          scope_of_work: string
          service_request_id: string
          status: Database["public"]["Enums"]["quote_status"]
          total_amount: number
          updated_at: string | null
          validity_date: string | null
          vat_included: boolean
          version: number
          warranty_info: string | null
        }
        Insert: {
          created_at?: string | null
          estimated_duration?: string | null
          id?: string
          line_items?: Json
          payment_terms?: string | null
          provider_id: string
          quote_number?: string | null
          scope_of_work: string
          service_request_id: string
          status?: Database["public"]["Enums"]["quote_status"]
          total_amount: number
          updated_at?: string | null
          validity_date?: string | null
          vat_included?: boolean
          version?: number
          warranty_info?: string | null
        }
        Update: {
          created_at?: string | null
          estimated_duration?: string | null
          id?: string
          line_items?: Json
          payment_terms?: string | null
          provider_id?: string
          quote_number?: string | null
          scope_of_work?: string
          service_request_id?: string
          status?: Database["public"]["Enums"]["quote_status"]
          total_amount?: number
          updated_at?: string | null
          validity_date?: string | null
          vat_included?: boolean
          version?: number
          warranty_info?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotes_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "service_provider_details"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "quotes_service_request_id_fkey"
            columns: ["service_request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_codes: {
        Row: {
          code: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      referral_conversions: {
        Row: {
          code_used: string
          converted_at: string
          id: string
          referred_id: string
          referrer_id: string
          status: string
        }
        Insert: {
          code_used: string
          converted_at?: string
          id?: string
          referred_id: string
          referrer_id: string
          status?: string
        }
        Update: {
          code_used?: string
          converted_at?: string
          id?: string
          referred_id?: string
          referrer_id?: string
          status?: string
        }
        Relationships: []
      }
      review_flags: {
        Row: {
          admin_status: string | null
          created_at: string | null
          description: string | null
          id: string
          reason: string
          review_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          user_id: string
        }
        Insert: {
          admin_status?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          reason: string
          review_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          user_id: string
        }
        Update: {
          admin_status?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          reason?: string
          review_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_flags_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_flags_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_flags_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      review_helpfulness: {
        Row: {
          created_at: string | null
          id: string
          is_helpful: boolean
          review_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_helpful: boolean
          review_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_helpful?: boolean
          review_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_helpfulness_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_helpfulness_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          authenticity_score: number | null
          booking_id: string
          created_at: string | null
          deleted_at: string | null
          fake_review_probability: number | null
          helpful_count: number | null
          id: string
          moderation_status: string
          not_helpful_count: number | null
          overall_rating: number
          professionalism_rating: number | null
          provider_id: string
          provider_response: string | null
          provider_response_at: string | null
          punctuality_rating: number | null
          quality_rating: number | null
          review_text: string
          reviewer_id: string
          search_vector: unknown
          sentiment: string | null
          spam_indicators: Json | null
          title: string
          updated_at: string | null
          value_rating: number | null
        }
        Insert: {
          authenticity_score?: number | null
          booking_id: string
          created_at?: string | null
          deleted_at?: string | null
          fake_review_probability?: number | null
          helpful_count?: number | null
          id?: string
          moderation_status?: string
          not_helpful_count?: number | null
          overall_rating: number
          professionalism_rating?: number | null
          provider_id: string
          provider_response?: string | null
          provider_response_at?: string | null
          punctuality_rating?: number | null
          quality_rating?: number | null
          review_text: string
          reviewer_id: string
          search_vector?: unknown
          sentiment?: string | null
          spam_indicators?: Json | null
          title: string
          updated_at?: string | null
          value_rating?: number | null
        }
        Update: {
          authenticity_score?: number | null
          booking_id?: string
          created_at?: string | null
          deleted_at?: string | null
          fake_review_probability?: number | null
          helpful_count?: number | null
          id?: string
          moderation_status?: string
          not_helpful_count?: number | null
          overall_rating?: number
          professionalism_rating?: number | null
          provider_id?: string
          provider_response?: string | null
          provider_response_at?: string | null
          punctuality_rating?: number | null
          quality_rating?: number | null
          review_text?: string
          reviewer_id?: string
          search_vector?: unknown
          sentiment?: string | null
          spam_indicators?: Json | null
          title?: string
          updated_at?: string | null
          value_rating?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "service_provider_details"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_properties: {
        Row: {
          created_at: string | null
          id: string
          listing_id: string
          notes: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          listing_id: string
          notes?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          listing_id?: string
          notes?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_properties_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_properties_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "search_listings"
            referencedColumns: ["listing_id"]
          },
        ]
      }
      saved_searches: {
        Row: {
          alert_frequency: string | null
          alerts_enabled: boolean | null
          created_at: string | null
          filters: Json
          id: string
          last_alerted_at: string | null
          name: string
          new_results_count: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          alert_frequency?: string | null
          alerts_enabled?: boolean | null
          created_at?: string | null
          filters: Json
          id?: string
          last_alerted_at?: string | null
          name: string
          new_results_count?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          alert_frequency?: string | null
          alerts_enabled?: boolean | null
          created_at?: string | null
          filters?: Json
          id?: string
          last_alerted_at?: string | null
          name?: string
          new_results_count?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      search_analytics: {
        Row: {
          created_at: string | null
          filters: Json
          id: number
          query_duration_ms: number | null
          result_count: number
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          filters: Json
          id?: number
          query_duration_ms?: number | null
          result_count: number
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          filters?: Json
          id?: number
          query_duration_ms?: number | null
          result_count?: number
          user_id?: string | null
        }
        Relationships: []
      }
      service_job_milestones: {
        Row: {
          booking_id: string
          id: string
          milestone_key: string
          notes: string | null
          status: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          booking_id: string
          id?: string
          milestone_key: string
          notes?: string | null
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          booking_id?: string
          id?: string
          milestone_key?: string
          notes?: string | null
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      service_provider_details: {
        Row: {
          accreditations: string[] | null
          base_location: unknown
          business_description: string | null
          business_name: string
          company_number: string | null
          completed_jobs_count: number | null
          created_at: string | null
          insurance_details: Json | null
          portfolio_urls: string[] | null
          pricing: Json | null
          qualifications: string[] | null
          response_time_hours: number | null
          service_postcodes: string[]
          service_radius: number | null
          services: Database["public"]["Enums"]["service_category"][]
          slug: string
          trading_name: string | null
          updated_at: string | null
          user_id: string
          vat_number: string | null
          website_url: string | null
          years_in_business: number | null
        }
        Insert: {
          accreditations?: string[] | null
          base_location?: unknown
          business_description?: string | null
          business_name: string
          company_number?: string | null
          completed_jobs_count?: number | null
          created_at?: string | null
          insurance_details?: Json | null
          portfolio_urls?: string[] | null
          pricing?: Json | null
          qualifications?: string[] | null
          response_time_hours?: number | null
          service_postcodes?: string[]
          service_radius?: number | null
          services?: Database["public"]["Enums"]["service_category"][]
          slug: string
          trading_name?: string | null
          updated_at?: string | null
          user_id: string
          vat_number?: string | null
          website_url?: string | null
          years_in_business?: number | null
        }
        Update: {
          accreditations?: string[] | null
          base_location?: unknown
          business_description?: string | null
          business_name?: string
          company_number?: string | null
          completed_jobs_count?: number | null
          created_at?: string | null
          insurance_details?: Json | null
          portfolio_urls?: string[] | null
          pricing?: Json | null
          qualifications?: string[] | null
          response_time_hours?: number | null
          service_postcodes?: string[]
          service_radius?: number | null
          services?: Database["public"]["Enums"]["service_category"][]
          slug?: string
          trading_name?: string | null
          updated_at?: string | null
          user_id?: string
          vat_number?: string | null
          website_url?: string | null
          years_in_business?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "service_provider_details_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      service_requests: {
        Row: {
          attachments: Json | null
          budget_max: number | null
          budget_min: number | null
          created_at: string | null
          description: string
          expires_at: string | null
          id: string
          preferred_start_date: string | null
          property_address: string | null
          property_location: unknown
          property_postcode: string
          quote_count: number | null
          service_category: Database["public"]["Enums"]["service_category"]
          status: Database["public"]["Enums"]["rfq_status"]
          title: string
          updated_at: string | null
          urgency_level: string
          user_id: string
          view_count: number | null
        }
        Insert: {
          attachments?: Json | null
          budget_max?: number | null
          budget_min?: number | null
          created_at?: string | null
          description: string
          expires_at?: string | null
          id?: string
          preferred_start_date?: string | null
          property_address?: string | null
          property_location?: unknown
          property_postcode: string
          quote_count?: number | null
          service_category: Database["public"]["Enums"]["service_category"]
          status?: Database["public"]["Enums"]["rfq_status"]
          title: string
          updated_at?: string | null
          urgency_level?: string
          user_id: string
          view_count?: number | null
        }
        Update: {
          attachments?: Json | null
          budget_max?: number | null
          budget_min?: number | null
          created_at?: string | null
          description?: string
          expires_at?: string | null
          id?: string
          preferred_start_date?: string | null
          property_address?: string | null
          property_location?: unknown
          property_postcode?: string
          quote_count?: number | null
          service_category?: Database["public"]["Enums"]["service_category"]
          status?: Database["public"]["Enums"]["rfq_status"]
          title?: string
          updated_at?: string | null
          urgency_level?: string
          user_id?: string
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "service_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      spatial_ref_sys: {
        Row: {
          auth_name: string | null
          auth_srid: number | null
          proj4text: string | null
          srid: number
          srtext: string | null
        }
        Insert: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid: number
          srtext?: string | null
        }
        Update: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid?: number
          srtext?: string | null
        }
        Relationships: []
      }
      tenancies: {
        Row: {
          created_at: string | null
          deposit_amount: number | null
          deposit_scheme: string | null
          id: string
          landlord_id: string
          lease_end_date: string
          lease_start_date: string
          monthly_rent: number
          notes: string | null
          property_id: string
          status: Database["public"]["Enums"]["tenancy_status"]
          tenant_email: string | null
          tenant_name: string
          tenant_phone: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          deposit_amount?: number | null
          deposit_scheme?: string | null
          id?: string
          landlord_id: string
          lease_end_date: string
          lease_start_date: string
          monthly_rent: number
          notes?: string | null
          property_id: string
          status?: Database["public"]["Enums"]["tenancy_status"]
          tenant_email?: string | null
          tenant_name: string
          tenant_phone?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          deposit_amount?: number | null
          deposit_scheme?: string | null
          id?: string
          landlord_id?: string
          lease_end_date?: string
          lease_start_date?: string
          monthly_rent?: number
          notes?: string | null
          property_id?: string
          status?: Database["public"]["Enums"]["tenancy_status"]
          tenant_email?: string | null
          tenant_name?: string
          tenant_phone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenancies_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenancies_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "search_listings"
            referencedColumns: ["property_id"]
          },
        ]
      }
      transaction_milestones: {
        Row: {
          completed_date: string | null
          id: string
          milestone_key: string
          notes: string | null
          status: string
          transaction_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          completed_date?: string | null
          id?: string
          milestone_key: string
          notes?: string | null
          status?: string
          transaction_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          completed_date?: string | null
          id?: string
          milestone_key?: string
          notes?: string | null
          status?: string
          transaction_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      transport_stops: {
        Row: {
          atco_code: string
          coordinates: unknown
          created_at: string
          id: string
          locality: string | null
          name: string
          source: string
          stop_type: string
        }
        Insert: {
          atco_code: string
          coordinates: unknown
          created_at?: string
          id?: string
          locality?: string | null
          name: string
          source?: string
          stop_type: string
        }
        Update: {
          atco_code?: string
          coordinates?: unknown
          created_at?: string
          id?: string
          locality?: string | null
          name?: string
          source?: string
          stop_type?: string
        }
        Relationships: []
      }
      user_documents: {
        Row: {
          created_at: string
          document_type: string
          file_name: string
          file_size_bytes: number
          id: string
          mime_type: string
          offer_id: string | null
          status: string
          storage_path: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          document_type: string
          file_name: string
          file_size_bytes: number
          id?: string
          mime_type: string
          offer_id?: string | null
          status?: string
          storage_path: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          document_type?: string
          file_name?: string
          file_size_bytes?: number
          id?: string
          mime_type?: string
          offer_id?: string | null
          status?: string
          storage_path?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_documents_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          granted_at: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          granted_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          granted_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: []
      }
      viewing_history: {
        Row: {
          id: number
          listing_id: string
          user_id: string
          viewed_at: string | null
        }
        Insert: {
          id?: number
          listing_id: string
          user_id: string
          viewed_at?: string | null
        }
        Update: {
          id?: number
          listing_id?: string
          user_id?: string
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "viewing_history_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "viewing_history_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "search_listings"
            referencedColumns: ["listing_id"]
          },
        ]
      }
      viewing_slots: {
        Row: {
          agent_id: string
          created_at: string
          end_time: string
          id: string
          listing_id: string
          start_time: string
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          agent_id: string
          created_at?: string
          end_time: string
          id?: string
          listing_id: string
          start_time: string
          status?: string
          type: string
          updated_at?: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          end_time?: string
          id?: string
          listing_id?: string
          start_time?: string
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      viewings: {
        Row: {
          created_at: string
          id: string
          listing_id: string
          notes: string | null
          slot_id: string
          status: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          listing_id: string
          notes?: string | null
          slot_id: string
          status?: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          listing_id?: string
          notes?: string | null
          slot_id?: string
          status?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "viewings_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "viewing_slots"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      geography_columns: {
        Row: {
          coord_dimension: number | null
          f_geography_column: unknown
          f_table_catalog: unknown
          f_table_name: unknown
          f_table_schema: unknown
          srid: number | null
          type: string | null
        }
        Relationships: []
      }
      geometry_columns: {
        Row: {
          coord_dimension: number | null
          f_geometry_column: unknown
          f_table_catalog: string | null
          f_table_name: unknown
          f_table_schema: unknown
          srid: number | null
          type: string | null
        }
        Insert: {
          coord_dimension?: number | null
          f_geometry_column?: unknown
          f_table_catalog?: string | null
          f_table_name?: unknown
          f_table_schema?: unknown
          srid?: number | null
          type?: string | null
        }
        Update: {
          coord_dimension?: number | null
          f_geometry_column?: unknown
          f_table_catalog?: string | null
          f_table_name?: unknown
          f_table_schema?: unknown
          srid?: number | null
          type?: string | null
        }
        Relationships: []
      }
      search_listings: {
        Row: {
          address_line1: string | null
          bathrooms: number | null
          bedrooms: number | null
          city: string | null
          coordinates: unknown
          description_tsv: unknown
          enquiry_count: number | null
          epc_rating: string | null
          favorite_count: number | null
          features: Json | null
          listed_date: string | null
          listing_id: string | null
          listing_type: Database["public"]["Enums"]["listing_type"] | null
          new_build: boolean | null
          postcode: string | null
          price: number | null
          price_qualifier: string | null
          property_id: string | null
          property_type: Database["public"]["Enums"]["property_type"] | null
          reception_rooms: number | null
          rent_frequency: string | null
          slug: string | null
          square_footage: number | null
          status: Database["public"]["Enums"]["listing_status"] | null
          thumbnail_url: string | null
          title: string | null
          view_count: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      _postgis_deprecate: {
        Args: { newname: string; oldname: string; version: string }
        Returns: undefined
      }
      _postgis_index_extent: {
        Args: { col: string; tbl: unknown }
        Returns: unknown
      }
      _postgis_pgsql_version: { Args: never; Returns: string }
      _postgis_scripts_pgsql_version: { Args: never; Returns: string }
      _postgis_selectivity: {
        Args: { att_name: string; geom: unknown; mode?: string; tbl: unknown }
        Returns: number
      }
      _postgis_stats: {
        Args: { ""?: string; att_name: string; tbl: unknown }
        Returns: string
      }
      _st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_coveredby:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_covers:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_crosses: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      _st_equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_intersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      _st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      _st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      _st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_sortablehash: { Args: { geom: unknown }; Returns: number }
      _st_touches: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_voronoi: {
        Args: {
          clip?: unknown
          g1: unknown
          return_polygons?: boolean
          tolerance?: number
        }
        Returns: unknown
      }
      _st_within: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      addauth: { Args: { "": string }; Returns: boolean }
      addgeometrycolumn:
        | {
            Args: {
              catalog_name: string
              column_name: string
              new_dim: number
              new_srid_in: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
      book_viewing_slot: {
        Args: {
          p_listing_id: string
          p_slot_id: string
          p_type: string
          p_user_id: string
        }
        Returns: Json
      }
      cancel_viewing: { Args: { p_viewing_id: string }; Returns: Json }
      disablelongtransactions: { Args: never; Returns: string }
      dropgeometrycolumn:
        | {
            Args: {
              catalog_name: string
              column_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | { Args: { column_name: string; table_name: string }; Returns: string }
      dropgeometrytable:
        | {
            Args: {
              catalog_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | { Args: { schema_name: string; table_name: string }; Returns: string }
        | { Args: { table_name: string }; Returns: string }
      enablelongtransactions: { Args: never; Returns: string }
      equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      geometry: { Args: { "": string }; Returns: unknown }
      geometry_above: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_below: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_cmp: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_contained_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_distance_box: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_distance_centroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_eq: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_ge: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_gt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_le: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_left: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_lt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overabove: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overbelow: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overleft: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overright: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_right: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_within: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geomfromewkt: { Args: { "": string }; Returns: unknown }
      get_documents_due_for_reminder: {
        Args: never
        Returns: {
          category: Database["public"]["Enums"]["document_category"]
          days_until_expiry: number
          document_id: string
          document_name: string
          expiry_date: string
          property_id: string
          uploaded_by: string
        }[]
      }
      get_nearby_transport_stops: {
        Args: {
          center_lat: number
          center_lng: number
          max_results?: number
          radius_meters?: number
        }
        Returns: {
          distance_meters: number
          name: string
          stop_type: string
        }[]
      }
      get_property_financial_summary: {
        Args: {
          p_end_date?: string
          p_property_id: string
          p_start_date?: string
        }
        Returns: {
          entry_count: number
          net_income: number
          total_expenses: number
          total_income: number
        }[]
      }
      gettransactionid: { Args: never; Returns: unknown }
      increment_favorite_count: {
        Args: { p_delta: number; p_listing_id: string }
        Returns: undefined
      }
      increment_listing_view_count: {
        Args: { p_listing_id: string }
        Returns: undefined
      }
      longtransactionsenabled: { Args: never; Returns: boolean }
      populate_geometry_columns:
        | { Args: { tbl_oid: unknown; use_typmod?: boolean }; Returns: number }
        | { Args: { use_typmod?: boolean }; Returns: string }
      postgis_constraint_dims: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_srid: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_type: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: string
      }
      postgis_extensions_upgrade: { Args: never; Returns: string }
      postgis_full_version: { Args: never; Returns: string }
      postgis_geos_version: { Args: never; Returns: string }
      postgis_lib_build_date: { Args: never; Returns: string }
      postgis_lib_revision: { Args: never; Returns: string }
      postgis_lib_version: { Args: never; Returns: string }
      postgis_libjson_version: { Args: never; Returns: string }
      postgis_liblwgeom_version: { Args: never; Returns: string }
      postgis_libprotobuf_version: { Args: never; Returns: string }
      postgis_libxml_version: { Args: never; Returns: string }
      postgis_proj_version: { Args: never; Returns: string }
      postgis_scripts_build_date: { Args: never; Returns: string }
      postgis_scripts_installed: { Args: never; Returns: string }
      postgis_scripts_released: { Args: never; Returns: string }
      postgis_svn_version: { Args: never; Returns: string }
      postgis_type_name: {
        Args: {
          coord_dimension: number
          geomname: string
          use_new_name?: boolean
        }
        Returns: string
      }
      postgis_version: { Args: never; Returns: string }
      postgis_wagyu_version: { Args: never; Returns: string }
      refresh_search_listings: { Args: never; Returns: undefined }
      reschedule_viewing: {
        Args: { p_new_slot_id: string; p_viewing_id: string }
        Returns: Json
      }
      search_listings_by_polygon: {
        Args: {
          p_cursor?: string
          p_limit?: number
          p_listing_type?: Database["public"]["Enums"]["listing_type"]
          p_max_price?: number
          p_min_bedrooms?: number
          p_min_price?: number
          p_property_type?: Database["public"]["Enums"]["property_type"]
          polygon_geojson: string
        }
        Returns: {
          address_line1: string
          bathrooms: number
          bedrooms: number
          city: string
          epc_rating: string
          listed_date: string
          listing_id: string
          listing_type: Database["public"]["Enums"]["listing_type"]
          new_build: boolean
          postcode: string
          price: number
          price_qualifier: string
          property_id: string
          property_type: Database["public"]["Enums"]["property_type"]
          rent_frequency: string
          slug: string
          status: Database["public"]["Enums"]["listing_status"]
          thumbnail_url: string
          title: string
        }[]
      }
      search_listings_by_radius: {
        Args: {
          center_lat: number
          center_lng: number
          p_cursor?: string
          p_limit?: number
          p_listing_type?: Database["public"]["Enums"]["listing_type"]
          p_max_price?: number
          p_min_bedrooms?: number
          p_min_price?: number
          p_property_type?: Database["public"]["Enums"]["property_type"]
          radius_meters: number
        }
        Returns: {
          address_line1: string
          bathrooms: number
          bedrooms: number
          city: string
          distance_meters: number
          epc_rating: string
          listed_date: string
          listing_id: string
          listing_type: Database["public"]["Enums"]["listing_type"]
          new_build: boolean
          postcode: string
          price: number
          price_qualifier: string
          property_id: string
          property_type: Database["public"]["Enums"]["property_type"]
          rent_frequency: string
          slug: string
          status: Database["public"]["Enums"]["listing_status"]
          thumbnail_url: string
          title: string
        }[]
      }
      search_providers: {
        Args: {
          p_lat?: number
          p_limit?: number
          p_lng?: number
          p_min_rating?: number
          p_offset?: number
          p_postcode?: string
          p_radius_miles?: number
          p_search_query?: string
          p_service_category?: Database["public"]["Enums"]["service_category"]
        }
        Returns: {
          avatar_url: string
          average_rating: number
          business_description: string
          business_name: string
          completed_jobs_count: number
          distance_miles: number
          provider_id: string
          review_count: number
          services: Database["public"]["Enums"]["service_category"][]
          slug: string
          years_in_business: number
        }[]
      }
      set_property_coordinates: {
        Args: { p_lat: number; p_lng: number; p_property_id: string }
        Returns: undefined
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      st_3dclosestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3ddistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_3dlongestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmakebox: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmaxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dshortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_addpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_angle:
        | { Args: { line1: unknown; line2: unknown }; Returns: number }
        | {
            Args: { pt1: unknown; pt2: unknown; pt3: unknown; pt4?: unknown }
            Returns: number
          }
      st_area:
        | { Args: { geog: unknown; use_spheroid?: boolean }; Returns: number }
        | { Args: { "": string }; Returns: number }
      st_asencodedpolyline: {
        Args: { geom: unknown; nprecision?: number }
        Returns: string
      }
      st_asewkt: { Args: { "": string }; Returns: string }
      st_asgeojson:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | {
            Args: {
              geom_column?: string
              maxdecimaldigits?: number
              pretty_bool?: boolean
              r: Record<string, unknown>
            }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_asgml:
        | {
            Args: {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
            }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
        | {
            Args: {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
            Returns: string
          }
        | {
            Args: {
              geom: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
            Returns: string
          }
      st_askml:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; nprefix?: string }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; nprefix?: string }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_aslatlontext: {
        Args: { geom: unknown; tmpl?: string }
        Returns: string
      }
      st_asmarc21: { Args: { format?: string; geom: unknown }; Returns: string }
      st_asmvtgeom: {
        Args: {
          bounds: unknown
          buffer?: number
          clip_geom?: boolean
          extent?: number
          geom: unknown
        }
        Returns: unknown
      }
      st_assvg:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; rel?: number }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; rel?: number }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_astext: { Args: { "": string }; Returns: string }
      st_astwkb:
        | {
            Args: {
              geom: unknown
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              geom: unknown[]
              ids: number[]
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
            Returns: string
          }
      st_asx3d: {
        Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
        Returns: string
      }
      st_azimuth:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: number }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
      st_boundingdiagonal: {
        Args: { fits?: boolean; geom: unknown }
        Returns: unknown
      }
      st_buffer:
        | {
            Args: { geom: unknown; options?: string; radius: number }
            Returns: unknown
          }
        | {
            Args: { geom: unknown; quadsegs: number; radius: number }
            Returns: unknown
          }
      st_centroid: { Args: { "": string }; Returns: unknown }
      st_clipbybox2d: {
        Args: { box: unknown; geom: unknown }
        Returns: unknown
      }
      st_closestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_collect: { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
      st_concavehull: {
        Args: {
          param_allow_holes?: boolean
          param_geom: unknown
          param_pctconvex: number
        }
        Returns: unknown
      }
      st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_coorddim: { Args: { geometry: unknown }; Returns: number }
      st_coveredby:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_covers:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_crosses: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_curvetoline: {
        Args: { flags?: number; geom: unknown; tol?: number; toltype?: number }
        Returns: unknown
      }
      st_delaunaytriangles: {
        Args: { flags?: number; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_difference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_disjoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_distance:
        | {
            Args: { geog1: unknown; geog2: unknown; use_spheroid?: boolean }
            Returns: number
          }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
      st_distancesphere:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
        | {
            Args: { geom1: unknown; geom2: unknown; radius: number }
            Returns: number
          }
      st_distancespheroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      st_equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_expand:
        | { Args: { box: unknown; dx: number; dy: number }; Returns: unknown }
        | {
            Args: { box: unknown; dx: number; dy: number; dz?: number }
            Returns: unknown
          }
        | {
            Args: {
              dm?: number
              dx: number
              dy: number
              dz?: number
              geom: unknown
            }
            Returns: unknown
          }
      st_force3d: { Args: { geom: unknown; zvalue?: number }; Returns: unknown }
      st_force3dm: {
        Args: { geom: unknown; mvalue?: number }
        Returns: unknown
      }
      st_force3dz: {
        Args: { geom: unknown; zvalue?: number }
        Returns: unknown
      }
      st_force4d: {
        Args: { geom: unknown; mvalue?: number; zvalue?: number }
        Returns: unknown
      }
      st_generatepoints:
        | { Args: { area: unknown; npoints: number }; Returns: unknown }
        | {
            Args: { area: unknown; npoints: number; seed: number }
            Returns: unknown
          }
      st_geogfromtext: { Args: { "": string }; Returns: unknown }
      st_geographyfromtext: { Args: { "": string }; Returns: unknown }
      st_geohash:
        | { Args: { geog: unknown; maxchars?: number }; Returns: string }
        | { Args: { geom: unknown; maxchars?: number }; Returns: string }
      st_geomcollfromtext: { Args: { "": string }; Returns: unknown }
      st_geometricmedian: {
        Args: {
          fail_if_not_converged?: boolean
          g: unknown
          max_iter?: number
          tolerance?: number
        }
        Returns: unknown
      }
      st_geometryfromtext: { Args: { "": string }; Returns: unknown }
      st_geomfromewkt: { Args: { "": string }; Returns: unknown }
      st_geomfromgeojson:
        | { Args: { "": Json }; Returns: unknown }
        | { Args: { "": Json }; Returns: unknown }
        | { Args: { "": string }; Returns: unknown }
      st_geomfromgml: { Args: { "": string }; Returns: unknown }
      st_geomfromkml: { Args: { "": string }; Returns: unknown }
      st_geomfrommarc21: { Args: { marc21xml: string }; Returns: unknown }
      st_geomfromtext: { Args: { "": string }; Returns: unknown }
      st_gmltosql: { Args: { "": string }; Returns: unknown }
      st_hasarc: { Args: { geometry: unknown }; Returns: boolean }
      st_hausdorffdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_hexagon: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_hexagongrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_interpolatepoint: {
        Args: { line: unknown; point: unknown }
        Returns: number
      }
      st_intersection: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_intersects:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_isvaliddetail: {
        Args: { flags?: number; geom: unknown }
        Returns: Database["public"]["CompositeTypes"]["valid_detail"]
        SetofOptions: {
          from: "*"
          to: "valid_detail"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      st_length:
        | { Args: { geog: unknown; use_spheroid?: boolean }; Returns: number }
        | { Args: { "": string }; Returns: number }
      st_letters: { Args: { font?: Json; letters: string }; Returns: unknown }
      st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      st_linefromencodedpolyline: {
        Args: { nprecision?: number; txtin: string }
        Returns: unknown
      }
      st_linefromtext: { Args: { "": string }; Returns: unknown }
      st_linelocatepoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_linetocurve: { Args: { geometry: unknown }; Returns: unknown }
      st_locatealong: {
        Args: { geometry: unknown; leftrightoffset?: number; measure: number }
        Returns: unknown
      }
      st_locatebetween: {
        Args: {
          frommeasure: number
          geometry: unknown
          leftrightoffset?: number
          tomeasure: number
        }
        Returns: unknown
      }
      st_locatebetweenelevations: {
        Args: { fromelevation: number; geometry: unknown; toelevation: number }
        Returns: unknown
      }
      st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makebox2d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makeline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makevalid: {
        Args: { geom: unknown; params: string }
        Returns: unknown
      }
      st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_minimumboundingcircle: {
        Args: { inputgeom: unknown; segs_per_quarter?: number }
        Returns: unknown
      }
      st_mlinefromtext: { Args: { "": string }; Returns: unknown }
      st_mpointfromtext: { Args: { "": string }; Returns: unknown }
      st_mpolyfromtext: { Args: { "": string }; Returns: unknown }
      st_multilinestringfromtext: { Args: { "": string }; Returns: unknown }
      st_multipointfromtext: { Args: { "": string }; Returns: unknown }
      st_multipolygonfromtext: { Args: { "": string }; Returns: unknown }
      st_node: { Args: { g: unknown }; Returns: unknown }
      st_normalize: { Args: { geom: unknown }; Returns: unknown }
      st_offsetcurve: {
        Args: { distance: number; line: unknown; params?: string }
        Returns: unknown
      }
      st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_perimeter: {
        Args: { geog: unknown; use_spheroid?: boolean }
        Returns: number
      }
      st_pointfromtext: { Args: { "": string }; Returns: unknown }
      st_pointm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
        }
        Returns: unknown
      }
      st_pointz: {
        Args: {
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_pointzm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_polyfromtext: { Args: { "": string }; Returns: unknown }
      st_polygonfromtext: { Args: { "": string }; Returns: unknown }
      st_project: {
        Args: { azimuth: number; distance: number; geog: unknown }
        Returns: unknown
      }
      st_quantizecoordinates: {
        Args: {
          g: unknown
          prec_m?: number
          prec_x: number
          prec_y?: number
          prec_z?: number
        }
        Returns: unknown
      }
      st_reduceprecision: {
        Args: { geom: unknown; gridsize: number }
        Returns: unknown
      }
      st_relate: { Args: { geom1: unknown; geom2: unknown }; Returns: string }
      st_removerepeatedpoints: {
        Args: { geom: unknown; tolerance?: number }
        Returns: unknown
      }
      st_segmentize: {
        Args: { geog: unknown; max_segment_length: number }
        Returns: unknown
      }
      st_setsrid:
        | { Args: { geog: unknown; srid: number }; Returns: unknown }
        | { Args: { geom: unknown; srid: number }; Returns: unknown }
      st_sharedpaths: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_shortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_simplifypolygonhull: {
        Args: { geom: unknown; is_outer?: boolean; vertex_fraction: number }
        Returns: unknown
      }
      st_split: { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
      st_square: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_squaregrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_srid:
        | { Args: { geog: unknown }; Returns: number }
        | { Args: { geom: unknown }; Returns: number }
      st_subdivide: {
        Args: { geom: unknown; gridsize?: number; maxvertices?: number }
        Returns: unknown[]
      }
      st_swapordinates: {
        Args: { geom: unknown; ords: unknown }
        Returns: unknown
      }
      st_symdifference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_symmetricdifference: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_tileenvelope: {
        Args: {
          bounds?: unknown
          margin?: number
          x: number
          y: number
          zoom: number
        }
        Returns: unknown
      }
      st_touches: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_transform:
        | {
            Args: { from_proj: string; geom: unknown; to_proj: string }
            Returns: unknown
          }
        | {
            Args: { from_proj: string; geom: unknown; to_srid: number }
            Returns: unknown
          }
        | { Args: { geom: unknown; to_proj: string }; Returns: unknown }
      st_triangulatepolygon: { Args: { g1: unknown }; Returns: unknown }
      st_union:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
        | {
            Args: { geom1: unknown; geom2: unknown; gridsize: number }
            Returns: unknown
          }
      st_voronoilines: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_voronoipolygons: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_within: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_wkbtosql: { Args: { wkb: string }; Returns: unknown }
      st_wkttosql: { Args: { "": string }; Returns: unknown }
      st_wrapx: {
        Args: { geom: unknown; move: number; wrap: number }
        Returns: unknown
      }
      unlockrows: { Args: { "": string }; Returns: number }
      updategeometrysrid: {
        Args: {
          catalogn_name: string
          column_name: string
          new_srid_in: number
          schema_name: string
          table_name: string
        }
        Returns: string
      }
    }
    Enums: {
      booking_status:
        | "pending_confirmation"
        | "confirmed"
        | "in_progress"
        | "completed"
        | "cancelled"
        | "disputed"
      document_category:
        | "gas_safety"
        | "epc"
        | "electrical"
        | "insurance"
        | "tenancy_agreement"
        | "inventory"
        | "other"
      document_verification_status:
        | "pending"
        | "approved"
        | "rejected"
        | "more_info_required"
      financial_entry_type: "income" | "expense"
      listing_status:
        | "draft"
        | "active"
        | "under_offer"
        | "sold"
        | "let"
        | "withdrawn"
        | "archived"
      listing_type: "sale" | "rent"
      maintenance_priority: "low" | "medium" | "high" | "emergency"
      maintenance_status:
        | "reported"
        | "acknowledged"
        | "in_progress"
        | "resolved"
        | "closed"
      media_type: "image" | "floor_plan" | "epc_document"
      property_type:
        | "detached"
        | "semi_detached"
        | "terraced"
        | "flat"
        | "bungalow"
        | "land"
        | "cottage"
        | "penthouse"
        | "studio"
        | "maisonette"
        | "other"
      provider_verification_status:
        | "unverified"
        | "pending_review"
        | "verified"
        | "suspended"
        | "rejected"
      quote_status:
        | "draft"
        | "sent"
        | "viewed"
        | "accepted"
        | "declined"
        | "expired"
        | "withdrawn"
      rfq_status:
        | "open"
        | "quotes_received"
        | "awarded"
        | "cancelled"
        | "expired"
      service_category:
        | "conveyancing"
        | "surveying"
        | "mortgage_broker"
        | "moving_company"
        | "home_inspector"
        | "cleaning"
        | "handyman"
        | "plumber"
        | "electrician"
        | "landscaping"
        | "interior_design"
        | "architect"
        | "property_management"
        | "pest_control"
        | "locksmith"
        | "builder"
        | "plasterer"
        | "painter"
        | "carpenter"
        | "other"
      tenancy_status: "active" | "expired" | "terminated" | "pending"
      tenure_type: "freehold" | "leasehold" | "shared_ownership"
      user_role:
        | "homebuyer"
        | "renter"
        | "seller"
        | "landlord"
        | "agent"
        | "service_provider"
      verification_document_type:
        | "identity_proof"
        | "qualification_certificate"
        | "insurance_certificate"
        | "business_registration"
        | "dbs_check"
        | "reference_letter"
      verification_level: "basic" | "standard" | "enhanced" | "professional"
      verification_stage:
        | "email"
        | "phone"
        | "identity"
        | "insurance"
        | "qualifications"
        | "admin_review"
    }
    CompositeTypes: {
      geometry_dump: {
        path: number[] | null
        geom: unknown
      }
      valid_detail: {
        valid: boolean | null
        reason: string | null
        location: unknown
      }
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      booking_status: [
        "pending_confirmation",
        "confirmed",
        "in_progress",
        "completed",
        "cancelled",
        "disputed",
      ],
      document_category: [
        "gas_safety",
        "epc",
        "electrical",
        "insurance",
        "tenancy_agreement",
        "inventory",
        "other",
      ],
      document_verification_status: [
        "pending",
        "approved",
        "rejected",
        "more_info_required",
      ],
      financial_entry_type: ["income", "expense"],
      listing_status: [
        "draft",
        "active",
        "under_offer",
        "sold",
        "let",
        "withdrawn",
        "archived",
      ],
      listing_type: ["sale", "rent"],
      maintenance_priority: ["low", "medium", "high", "emergency"],
      maintenance_status: [
        "reported",
        "acknowledged",
        "in_progress",
        "resolved",
        "closed",
      ],
      media_type: ["image", "floor_plan", "epc_document"],
      property_type: [
        "detached",
        "semi_detached",
        "terraced",
        "flat",
        "bungalow",
        "land",
        "cottage",
        "penthouse",
        "studio",
        "maisonette",
        "other",
      ],
      provider_verification_status: [
        "unverified",
        "pending_review",
        "verified",
        "suspended",
        "rejected",
      ],
      quote_status: [
        "draft",
        "sent",
        "viewed",
        "accepted",
        "declined",
        "expired",
        "withdrawn",
      ],
      rfq_status: [
        "open",
        "quotes_received",
        "awarded",
        "cancelled",
        "expired",
      ],
      service_category: [
        "conveyancing",
        "surveying",
        "mortgage_broker",
        "moving_company",
        "home_inspector",
        "cleaning",
        "handyman",
        "plumber",
        "electrician",
        "landscaping",
        "interior_design",
        "architect",
        "property_management",
        "pest_control",
        "locksmith",
        "builder",
        "plasterer",
        "painter",
        "carpenter",
        "other",
      ],
      tenancy_status: ["active", "expired", "terminated", "pending"],
      tenure_type: ["freehold", "leasehold", "shared_ownership"],
      user_role: [
        "homebuyer",
        "renter",
        "seller",
        "landlord",
        "agent",
        "service_provider",
      ],
      verification_document_type: [
        "identity_proof",
        "qualification_certificate",
        "insurance_certificate",
        "business_registration",
        "dbs_check",
        "reference_letter",
      ],
      verification_level: ["basic", "standard", "enhanced", "professional"],
      verification_stage: [
        "email",
        "phone",
        "identity",
        "insurance",
        "qualifications",
        "admin_review",
      ],
    },
  },
} as const

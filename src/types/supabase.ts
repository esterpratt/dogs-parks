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
      checkins: {
        Row: {
          checkin_timestamp: string
          checkout_timestamp: string | null
          id: string
          park_id: string | null
          user_id: string | null
        }
        Insert: {
          checkin_timestamp?: string
          checkout_timestamp?: string | null
          id?: string
          park_id?: string | null
          user_id?: string | null
        }
        Update: {
          checkin_timestamp?: string
          checkout_timestamp?: string | null
          id?: string
          park_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "checkins_park_id_fkey"
            columns: ["park_id"]
            isOneToOne: false
            referencedRelation: "parks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkins_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      device_tokens: {
        Row: {
          created_at: string
          device_id: string
          id: string
          platform: Database["public"]["Enums"]["platform"]
          token: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          device_id: string
          id?: string
          platform: Database["public"]["Enums"]["platform"]
          token: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          device_id?: string
          id?: string
          platform?: Database["public"]["Enums"]["platform"]
          token?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "device_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      dog_images: {
        Row: {
          bucket_id: string
          created_at: string
          dog_id: string
          id: string
          is_primary: boolean
          storage_path: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          dog_id: string
          id?: string
          is_primary?: boolean
          storage_path: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          dog_id?: string
          id?: string
          is_primary?: boolean
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "dog_images_dog_id_fkey"
            columns: ["dog_id"]
            isOneToOne: false
            referencedRelation: "dogs"
            referencedColumns: ["id"]
          },
        ]
      }
      dog_invites: {
        Row: {
          created_at: string
          dog_id: string
          id: string
          invitee_user_id: string
          inviter_user_id: string
          is_primary_transfer: boolean
          responded_at: string | null
          role_offered: Database["public"]["Enums"]["dog_member_role"]
          status: Database["public"]["Enums"]["dog_invite_status"]
        }
        Insert: {
          created_at?: string
          dog_id: string
          id?: string
          invitee_user_id: string
          inviter_user_id: string
          is_primary_transfer?: boolean
          responded_at?: string | null
          role_offered: Database["public"]["Enums"]["dog_member_role"]
          status?: Database["public"]["Enums"]["dog_invite_status"]
        }
        Update: {
          created_at?: string
          dog_id?: string
          id?: string
          invitee_user_id?: string
          inviter_user_id?: string
          is_primary_transfer?: boolean
          responded_at?: string | null
          role_offered?: Database["public"]["Enums"]["dog_member_role"]
          status?: Database["public"]["Enums"]["dog_invite_status"]
        }
        Relationships: [
          {
            foreignKeyName: "dog_invites_dog_id_fkey"
            columns: ["dog_id"]
            isOneToOne: false
            referencedRelation: "dogs"
            referencedColumns: ["id"]
          },
        ]
      }
      dog_members: {
        Row: {
          created_at: string
          dog_id: string
          id: string
          role: Database["public"]["Enums"]["dog_member_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          dog_id: string
          id?: string
          role: Database["public"]["Enums"]["dog_member_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          dog_id?: string
          id?: string
          role?: Database["public"]["Enums"]["dog_member_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dog_members_dog_id_fkey"
            columns: ["dog_id"]
            isOneToOne: false
            referencedRelation: "dogs"
            referencedColumns: ["id"]
          },
        ]
      }
      dogs: {
        Row: {
          birthday: string
          breed: string | null
          deleted_at: string | null
          description: string | null
          dislikes: string[] | null
          energy: string | null
          gender: string | null
          id: string
          likes: string[] | null
          name: string | null
          owner: string | null
          possessive: string | null
          size: string | null
          temperament: string | null
        }
        Insert: {
          birthday?: string
          breed?: string | null
          deleted_at?: string | null
          description?: string | null
          dislikes?: string[] | null
          energy?: string | null
          gender?: string | null
          id?: string
          likes?: string[] | null
          name?: string | null
          owner?: string | null
          possessive?: string | null
          size?: string | null
          temperament?: string | null
        }
        Update: {
          birthday?: string
          breed?: string | null
          deleted_at?: string | null
          description?: string | null
          dislikes?: string[] | null
          energy?: string | null
          gender?: string | null
          id?: string
          likes?: string[] | null
          name?: string | null
          owner?: string | null
          possessive?: string | null
          size?: string | null
          temperament?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dogs_owner_fkey"
            columns: ["owner"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      dogs_count_reports: {
        Row: {
          count: number | null
          id: string
          park_id: string | null
          timestamp: string
        }
        Insert: {
          count?: number | null
          id?: string
          park_id?: string | null
          timestamp?: string
        }
        Update: {
          count?: number | null
          id?: string
          park_id?: string | null
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "dogs_count_reports_park_id_fkey"
            columns: ["park_id"]
            isOneToOne: false
            referencedRelation: "parks"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          id: string
          park_id: string
          user_id: string
        }
        Insert: {
          id?: string
          park_id: string
          user_id: string
        }
        Update: {
          id?: string
          park_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_park_id_fkey"
            columns: ["park_id"]
            isOneToOne: false
            referencedRelation: "parks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      friendships: {
        Row: {
          id: string
          requestee_id: string | null
          requester_id: string | null
          status: string
          updated_at: string
          user_high: string | null
          user_low: string | null
        }
        Insert: {
          id?: string
          requestee_id?: string | null
          requester_id?: string | null
          status?: string
          updated_at?: string
          user_high?: string | null
          user_low?: string | null
        }
        Update: {
          id?: string
          requestee_id?: string | null
          requester_id?: string | null
          status?: string
          updated_at?: string
          user_high?: string | null
          user_low?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "friendships_requestee_id_fkey"
            columns: ["requestee_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friendships_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          app_message: string | null
          created_at: string
          data: Json | null
          delivered_at: string | null
          delivery_attempts: number
          id: string
          is_ready: boolean
          push_message: string | null
          read_at: string | null
          receiver_id: string
          seen_at: string | null
          sender_id: string | null
          target_id: string | null
          target_type:
            | Database["public"]["Enums"]["notification_target_type"]
            | null
          title: string | null
          type: Database["public"]["Enums"]["notification_type"]
          updated_at: string
        }
        Insert: {
          app_message?: string | null
          created_at?: string
          data?: Json | null
          delivered_at?: string | null
          delivery_attempts?: number
          id?: string
          is_ready?: boolean
          push_message?: string | null
          read_at?: string | null
          receiver_id: string
          seen_at?: string | null
          sender_id?: string | null
          target_id?: string | null
          target_type?:
            | Database["public"]["Enums"]["notification_target_type"]
            | null
          title?: string | null
          type: Database["public"]["Enums"]["notification_type"]
          updated_at?: string
        }
        Update: {
          app_message?: string | null
          created_at?: string
          data?: Json | null
          delivered_at?: string | null
          delivery_attempts?: number
          id?: string
          is_ready?: boolean
          push_message?: string | null
          read_at?: string | null
          receiver_id?: string
          seen_at?: string | null
          sender_id?: string | null
          target_id?: string | null
          target_type?:
            | Database["public"]["Enums"]["notification_target_type"]
            | null
          title?: string | null
          type?: Database["public"]["Enums"]["notification_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications_preferences: {
        Row: {
          created_at: string
          dog_invite: boolean | null
          dog_invite_accept: boolean | null
          dog_invite_decline: boolean | null
          dog_primary_transfer_accept: boolean | null
          dog_primary_transfer_invite: boolean | null
          friend_approval: boolean
          friend_request: boolean
          id: string
          muted: boolean
          park_invite: boolean
          park_invite_accept: boolean
          park_invite_cancelled: boolean
          park_invite_decline: boolean
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          dog_invite?: boolean | null
          dog_invite_accept?: boolean | null
          dog_invite_decline?: boolean | null
          dog_primary_transfer_accept?: boolean | null
          dog_primary_transfer_invite?: boolean | null
          friend_approval?: boolean
          friend_request?: boolean
          id?: string
          muted?: boolean
          park_invite?: boolean
          park_invite_accept?: boolean
          park_invite_cancelled: boolean
          park_invite_decline?: boolean
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          dog_invite?: boolean | null
          dog_invite_accept?: boolean | null
          dog_invite_decline?: boolean | null
          dog_primary_transfer_accept?: boolean | null
          dog_primary_transfer_invite?: boolean | null
          friend_approval?: boolean
          friend_request?: boolean
          id?: string
          muted?: boolean
          park_invite?: boolean
          park_invite_accept?: boolean
          park_invite_cancelled?: boolean
          park_invite_decline?: boolean
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      park_condition_observations: {
        Row: {
          condition: Database["public"]["Enums"]["park_condition"]
          created_at: string
          id: string
          park_id: string
          reporter_id: string
          status: Database["public"]["Enums"]["condition_observed_status"]
        }
        Insert: {
          condition: Database["public"]["Enums"]["park_condition"]
          created_at?: string
          id?: string
          park_id: string
          reporter_id: string
          status: Database["public"]["Enums"]["condition_observed_status"]
        }
        Update: {
          condition?: Database["public"]["Enums"]["park_condition"]
          created_at?: string
          id?: string
          park_id?: string
          reporter_id?: string
          status?: Database["public"]["Enums"]["condition_observed_status"]
        }
        Relationships: [
          {
            foreignKeyName: "park_condition_observations_park_id_fkey"
            columns: ["park_id"]
            isOneToOne: false
            referencedRelation: "parks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "park_condition_observations_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      park_condition_rules: {
        Row: {
          condition: Database["public"]["Enums"]["park_condition"]
          ttl: string
        }
        Insert: {
          condition: Database["public"]["Enums"]["park_condition"]
          ttl: string
        }
        Update: {
          condition?: Database["public"]["Enums"]["park_condition"]
          ttl?: string
        }
        Relationships: []
      }
      park_event_invitees: {
        Row: {
          added_at: string
          added_by: string
          event_id: string
          responded_at: string | null
          status: Database["public"]["Enums"]["invite_status"]
          user_id: string
        }
        Insert: {
          added_at?: string
          added_by: string
          event_id: string
          responded_at?: string | null
          status?: Database["public"]["Enums"]["invite_status"]
          user_id: string
        }
        Update: {
          added_at?: string
          added_by?: string
          event_id?: string
          responded_at?: string | null
          status?: Database["public"]["Enums"]["invite_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "park_event_invitees_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "park_event_invitees_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "park_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "park_event_invitees_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      park_events: {
        Row: {
          created_at: string
          creator_id: string
          duration_minutes: number
          end_at: string
          id: string
          message: string | null
          park_id: string
          start_at: string
          status: Database["public"]["Enums"]["park_event_status"]
          updated_at: string
          visibility: Database["public"]["Enums"]["park_event_visibility"]
        }
        Insert: {
          created_at?: string
          creator_id: string
          duration_minutes?: number
          end_at: string
          id?: string
          message?: string | null
          park_id: string
          start_at: string
          status?: Database["public"]["Enums"]["park_event_status"]
          updated_at?: string
          visibility: Database["public"]["Enums"]["park_event_visibility"]
        }
        Update: {
          created_at?: string
          creator_id?: string
          duration_minutes?: number
          end_at?: string
          id?: string
          message?: string | null
          park_id?: string
          start_at?: string
          status?: Database["public"]["Enums"]["park_event_status"]
          updated_at?: string
          visibility?: Database["public"]["Enums"]["park_event_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "park_events_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "park_events_park_id_fkey"
            columns: ["park_id"]
            isOneToOne: false
            referencedRelation: "parks"
            referencedColumns: ["id"]
          },
        ]
      }
      park_reports: {
        Row: {
          content: string | null
          id: string
          park_id: string
          user_id: string
        }
        Insert: {
          content?: string | null
          id?: string
          park_id?: string
          user_id?: string
        }
        Update: {
          content?: string | null
          id?: string
          park_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "park_reports_park_id_fkey"
            columns: ["park_id"]
            isOneToOne: false
            referencedRelation: "parks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "park_reports_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      park_suggestions: {
        Row: {
          address: string
          city: string
          id: string
          location: Json
          name: string | null
          size_category:
            | Database["public"]["Enums"]["park_size_category"]
            | null
          user_id: string
        }
        Insert: {
          address: string
          city: string
          id?: string
          location: Json
          name?: string | null
          size_category?:
            | Database["public"]["Enums"]["park_size_category"]
            | null
          user_id?: string
        }
        Update: {
          address?: string
          city?: string
          id?: string
          location?: Json
          name?: string | null
          size_category?:
            | Database["public"]["Enums"]["park_size_category"]
            | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "park_suggestion_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      park_translations: {
        Row: {
          address: string
          city: string
          created_at: string
          id: string
          language: Database["public"]["Enums"]["app_language"]
          name: string
          park_id: string
          updated_at: string
        }
        Insert: {
          address: string
          city: string
          created_at?: string
          id?: string
          language: Database["public"]["Enums"]["app_language"]
          name: string
          park_id: string
          updated_at?: string
        }
        Update: {
          address?: string
          city?: string
          created_at?: string
          id?: string
          language?: Database["public"]["Enums"]["app_language"]
          name?: string
          park_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "park_translations_park_id_fkey"
            columns: ["park_id"]
            isOneToOne: false
            referencedRelation: "parks"
            referencedColumns: ["id"]
          },
        ]
      }
      parks: {
        Row: {
          address: string | null
          city: string | null
          created_at: string | null
          has_facilities: boolean | null
          id: string
          location: Json | null
          materials: string[] | null
          name: string | null
          shade: number | null
          size_category:
            | Database["public"]["Enums"]["park_size_category"]
            | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string | null
          has_facilities?: boolean | null
          id?: string
          location?: Json | null
          materials?: string[] | null
          name?: string | null
          shade?: number | null
          size_category?:
            | Database["public"]["Enums"]["park_size_category"]
            | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string | null
          has_facilities?: boolean | null
          id?: string
          location?: Json | null
          materials?: string[] | null
          name?: string | null
          shade?: number | null
          size_category?:
            | Database["public"]["Enums"]["park_size_category"]
            | null
          updated_at?: string | null
        }
        Relationships: []
      }
      review_reports: {
        Row: {
          id: string
          reason: string | null
          review_id: string | null
        }
        Insert: {
          id?: string
          reason?: string | null
          review_id?: string | null
        }
        Update: {
          id?: string
          reason?: string | null
          review_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "review_reports_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      review_reports_count: {
        Row: {
          count: number
          id: string
          review_id: string
        }
        Insert: {
          count: number
          id?: string
          review_id?: string
        }
        Update: {
          count?: number
          id?: string
          review_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_reports_count_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: true
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          content: string | null
          created_at: string
          id: string
          park_id: string | null
          rank: number | null
          title: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          park_id?: string | null
          rank?: number | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          park_id?: string | null
          rank?: number | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_park_id_fkey"
            columns: ["park_id"]
            isOneToOne: false
            referencedRelation: "parks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          id: string
          name: string
          private: boolean | null
        }
        Insert: {
          id?: string
          name: string
          private?: boolean | null
        }
        Update: {
          id?: string
          name?: string
          private?: boolean | null
        }
        Relationships: []
      }
    }
    Views: {
      event_participations_v: {
        Row: {
          end_at: string | null
          event_id: string | null
          start_at: string | null
          time_range: unknown
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      accept_dog_invite: { Args: { p_invite_id: string }; Returns: undefined }
      accept_primary_transfer: {
        Args: { p_invite_id: string }
        Returns: undefined
      }
      add_event_invitees: {
        Args: { p_event_id: string; p_invitee_ids: string[] }
        Returns: undefined
      }
      add_park_condition_observation: {
        Args: {
          p_condition: Database["public"]["Enums"]["park_condition"]
          p_park_id: string
          p_status: Database["public"]["Enums"]["condition_observed_status"]
        }
        Returns: string
      }
      api_cleanup_device_tokens: {
        Args: { p_device_id?: string }
        Returns: number
      }
      api_update_missing_park_details: {
        Args: {
          p_has_facilities?: boolean
          p_materials?: string[]
          p_park_id: string
          p_shade?: number
          p_size_category?: Database["public"]["Enums"]["park_size_category"]
        }
        Returns: undefined
      }
      api_upsert_device_token: {
        Args: {
          p_device_id: string
          p_platform: Database["public"]["Enums"]["platform"]
          p_token: string
        }
        Returns: undefined
      }
      can_access_dog_storage_object: {
        Args: { p_object_name: string }
        Returns: boolean
      }
      cancel_dog_invite: { Args: { p_invite_id: string }; Returns: undefined }
      check_device_token_match: {
        Args: { p_device_id: string; p_token: string }
        Returns: {
          created_at: string
          id: string
          platform: string
          token_len: number
          updated_at: string
          user_id: string
        }[]
      }
      count_unseen_notifications: { Args: never; Returns: number }
      create_dog_invite: {
        Args: {
          p_dog_id: string
          p_invitee_user_id: string
          p_role_offered: Database["public"]["Enums"]["dog_member_role"]
        }
        Returns: string
      }
      create_park_event: {
        Args: {
          invitee_ids?: string[]
          message?: string
          park_id: string
          preset_offset_minutes?: number
          visibility: Database["public"]["Enums"]["park_event_visibility"]
        }
        Returns: string
      }
      create_primary_transfer_invite: {
        Args: { p_dog_id: string; p_invitee_user_id: string }
        Returns: string
      }
      decline_dog_invite: { Args: { p_invite_id: string }; Returns: undefined }
      delete_dog: { Args: { dog_id: string }; Returns: undefined }
      get_active_park_conditions: {
        Args: { p_now?: string; p_park_id: string }
        Returns: {
          condition: Database["public"]["Enums"]["park_condition"]
          last_reported_at: string
          park_id: string
        }[]
      }
      get_event_with_invitees: { Args: { p_event_id: string }; Returns: Json }
      get_favorite_park: {
        Args: never
        Returns: {
          park_id: string
        }[]
      }
      get_notifications: {
        Args: { p_cursor?: string; p_limit?: number; p_user_id: string }
        Returns: {
          app_message: string
          created_at: string
          id: string
          push_message: string
          read_at: string
          seen_at: string
          sender: Json
          sender_id: string
          target_id: string
          target_type: string
          title: string
          type: string
        }[]
      }
      get_park_checkins: {
        Args: { p_park_id: string }
        Returns: {
          checkin_timestamp: string
          checkout_timestamp: string | null
          id: string
          park_id: string | null
          user_id: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "checkins"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_parks_with_translations: {
        Args: { lang: Database["public"]["Enums"]["app_language"] }
        Returns: {
          address: string
          base_address: string
          base_city: string
          base_name: string
          city: string
          id: string
          name: string
        }[]
      }
      get_seen_notifications: {
        Args: { p_cursor?: string; p_limit?: number; p_user_id: string }
        Returns: {
          app_message: string
          created_at: string
          id: string
          push_message: string
          read_at: string
          receiver_id: string
          seen_at: string
          sender: Json
          sender_id: string
          target_id: string
          target_type: string
          title: string
          type: string
        }[]
      }
      get_unseen_notifications: {
        Args: { p_user_id: string }
        Returns: {
          app_message: string
          created_at: string
          id: string
          push_message: string
          read_at: string
          receiver_id: string
          seen_at: string
          sender: Json
          sender_id: string
          target_id: string
          target_type: string
          title: string
          type: string
        }[]
      }
      get_user_events_invited: {
        Args: never
        Returns: {
          created_at: string
          duration_minutes: number
          end_at: string
          id: string
          message: string
          my_invite_added_at: string
          my_invite_added_by: string
          my_invite_added_by_name: string
          my_invite_responded_at: string
          my_invite_status: Database["public"]["Enums"]["invite_status"]
          park_id: string
          start_at: string
          status: Database["public"]["Enums"]["park_event_status"]
          updated_at: string
          visibility: Database["public"]["Enums"]["park_event_visibility"]
        }[]
      }
      get_user_events_organized: {
        Args: never
        Returns: {
          created_at: string
          duration_minutes: number
          end_at: string
          id: string
          message: string
          park_id: string
          start_at: string
          status: Database["public"]["Enums"]["park_event_status"]
          updated_at: string
          visibility: Database["public"]["Enums"]["park_event_visibility"]
        }[]
      }
      is_active_dog_member: { Args: { p_dog_id: string }; Returns: boolean }
      is_solo_primary_dog_owner: {
        Args: { p_dog_id: string }
        Returns: boolean
      }
      mark_all_notifications_as_read: { Args: never; Returns: number }
      mark_all_notifications_as_seen: { Args: never; Returns: number }
      mark_notification_read: {
        Args: { notification_id: string }
        Returns: undefined
      }
      mark_notifications_seen: {
        Args: { p_notification_ids: string[] }
        Returns: number
      }
      remove_device_token_by_device: {
        Args: { p_device_id: string; p_token: string }
        Returns: number
      }
      safe_update_friendship: {
        Args: { expected_updated_at: string; fid: string; new_status: string }
        Returns: undefined
      }
      search_users_with_dogs: {
        Args: { input: string }
        Returns: {
          dogs: Json
          id: string
          name: string
        }[]
      }
      update_checkout: { Args: { checkin_id: string }; Returns: undefined }
    }
    Enums: {
      app_language: "en" | "he" | "ar"
      condition_observed_status: "PRESENT" | "NOT_PRESENT"
      dog_invite_status: "PENDING" | "ACCEPTED" | "DECLINED" | "CANCELED"
      dog_member_role: "PRIMARY_OWNER" | "EDITOR" | "VIEWER"
      friendship_status: "APPROVED" | "PENDING"
      invite_status: "INVITED" | "ACCEPTED" | "DECLINED" | "REMOVED"
      notification_target_type:
        | "USER"
        | "PARK_EVENT"
        | "PARK"
        | "SYSTEM"
        | "DOG_INVITE"
      notification_type:
        | "friend_request"
        | "friend_approval"
        | "park_invite"
        | "park_invite_accept"
        | "park_invite_cancelled"
        | "park_invite_decline"
        | "dog_invite"
        | "dog_primary_transfer_invite"
        | "dog_invite_accept"
        | "dog_invite_decline"
        | "dog_primary_transfer_accept"
      park_condition:
        | "MUDDY"
        | "BROKEN_FOUNTAIN"
        | "GATE_CLOSED"
        | "UNDER_CONSTRUCTION"
      park_event_status: "ACTIVE" | "CANCELED"
      park_event_visibility: "FRIENDS_ALL" | "FRIENDS_SELECTED"
      park_size_category: "small" | "medium" | "large" | "huge"
      platform: "web" | "ios" | "android"
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
      app_language: ["en", "he", "ar"],
      condition_observed_status: ["PRESENT", "NOT_PRESENT"],
      dog_invite_status: ["PENDING", "ACCEPTED", "DECLINED", "CANCELED"],
      dog_member_role: ["PRIMARY_OWNER", "EDITOR", "VIEWER"],
      friendship_status: ["APPROVED", "PENDING"],
      invite_status: ["INVITED", "ACCEPTED", "DECLINED", "REMOVED"],
      notification_target_type: [
        "USER",
        "PARK_EVENT",
        "PARK",
        "SYSTEM",
        "DOG_INVITE",
      ],
      notification_type: [
        "friend_request",
        "friend_approval",
        "park_invite",
        "park_invite_accept",
        "park_invite_cancelled",
        "park_invite_decline",
        "dog_invite",
        "dog_primary_transfer_invite",
        "dog_invite_accept",
        "dog_invite_decline",
        "dog_primary_transfer_accept",
      ],
      park_condition: [
        "MUDDY",
        "BROKEN_FOUNTAIN",
        "GATE_CLOSED",
        "UNDER_CONSTRUCTION",
      ],
      park_event_status: ["ACTIVE", "CANCELED"],
      park_event_visibility: ["FRIENDS_ALL", "FRIENDS_SELECTED"],
      park_size_category: ["small", "medium", "large", "huge"],
      platform: ["web", "ios", "android"],
    },
  },
} as const


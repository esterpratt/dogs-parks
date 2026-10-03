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
      app_feature_compatibility: {
        Row: {
          enabled: boolean
          feature: Database["public"]["Enums"]["app_feature"]
          minimum_build: number
          platform: Database["public"]["Enums"]["app_platform"]
          updated_at: string
        }
        Insert: {
          enabled?: boolean
          feature: Database["public"]["Enums"]["app_feature"]
          minimum_build: number
          platform: Database["public"]["Enums"]["app_platform"]
          updated_at?: string
        }
        Update: {
          enabled?: boolean
          feature?: Database["public"]["Enums"]["app_feature"]
          minimum_build?: number
          platform?: Database["public"]["Enums"]["app_platform"]
          updated_at?: string
        }
        Relationships: []
      }
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
      dog_deletion_consents: {
        Row: {
          decided_at: string
          decision: Database["public"]["Enums"]["dog_deletion_consent_decision"]
          member_id: string
          proposal_id: string
        }
        Insert: {
          decided_at?: string
          decision: Database["public"]["Enums"]["dog_deletion_consent_decision"]
          member_id: string
          proposal_id: string
        }
        Update: {
          decided_at?: string
          decision?: Database["public"]["Enums"]["dog_deletion_consent_decision"]
          member_id?: string
          proposal_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dog_deletion_consents_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "dog_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dog_deletion_consents_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "dog_deletion_proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      dog_deletion_proposals: {
        Row: {
          approved_consent_count: number
          cancellation_reason:
            | Database["public"]["Enums"]["dog_action_cancellation_reason"]
            | null
          created_at: string
          dog_id: string
          expires_at: string
          id: string
          idempotency_key: string
          ownership_version_at_creation: number
          proposed_by_member_id: string | null
          required_consent_count: number
          responded_at: string | null
          status: Database["public"]["Enums"]["dog_deletion_proposal_status"]
        }
        Insert: {
          approved_consent_count?: number
          cancellation_reason?:
            | Database["public"]["Enums"]["dog_action_cancellation_reason"]
            | null
          created_at?: string
          dog_id: string
          expires_at?: string
          id?: string
          idempotency_key: string
          ownership_version_at_creation: number
          proposed_by_member_id?: string | null
          required_consent_count: number
          responded_at?: string | null
          status?: Database["public"]["Enums"]["dog_deletion_proposal_status"]
        }
        Update: {
          approved_consent_count?: number
          cancellation_reason?:
            | Database["public"]["Enums"]["dog_action_cancellation_reason"]
            | null
          created_at?: string
          dog_id?: string
          expires_at?: string
          id?: string
          idempotency_key?: string
          ownership_version_at_creation?: number
          proposed_by_member_id?: string | null
          required_consent_count?: number
          responded_at?: string | null
          status?: Database["public"]["Enums"]["dog_deletion_proposal_status"]
        }
        Relationships: [
          {
            foreignKeyName: "dog_deletion_proposals_dog_id_fkey"
            columns: ["dog_id"]
            isOneToOne: false
            referencedRelation: "dogs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dog_deletion_proposals_proposed_by_member_id_fkey"
            columns: ["proposed_by_member_id"]
            isOneToOne: false
            referencedRelation: "dog_members"
            referencedColumns: ["id"]
          },
        ]
      }
      dog_images: {
        Row: {
          bucket_id: string
          created_at: string
          deleted_at: string | null
          dog_id: string
          id: string
          reservation_expires_at: string | null
          storage_path: string
          upload_state: Database["public"]["Enums"]["dog_image_upload_state"]
          uploader_member_id: string | null
        }
        Insert: {
          bucket_id: string
          created_at?: string
          deleted_at?: string | null
          dog_id: string
          id?: string
          reservation_expires_at?: string | null
          storage_path: string
          upload_state?: Database["public"]["Enums"]["dog_image_upload_state"]
          uploader_member_id?: string | null
        }
        Update: {
          bucket_id?: string
          created_at?: string
          deleted_at?: string | null
          dog_id?: string
          id?: string
          reservation_expires_at?: string | null
          storage_path?: string
          upload_state?: Database["public"]["Enums"]["dog_image_upload_state"]
          uploader_member_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dog_images_dog_id_fkey"
            columns: ["dog_id"]
            isOneToOne: false
            referencedRelation: "dogs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dog_images_uploader_member_id_fkey"
            columns: ["uploader_member_id"]
            isOneToOne: false
            referencedRelation: "dog_members"
            referencedColumns: ["id"]
          },
        ]
      }
      dog_invites: {
        Row: {
          cancellation_reason:
            | Database["public"]["Enums"]["dog_action_cancellation_reason"]
            | null
          created_at: string
          dog_id: string
          expires_at: string
          id: string
          idempotency_key: string
          invitee_user_id: string | null
          inviter_member_id: string | null
          ownership_version_at_creation: number
          primary_user_id_at_creation: string | null
          responded_at: string | null
          status: Database["public"]["Enums"]["dog_invite_status"]
        }
        Insert: {
          cancellation_reason?:
            | Database["public"]["Enums"]["dog_action_cancellation_reason"]
            | null
          created_at?: string
          dog_id: string
          expires_at?: string
          id?: string
          idempotency_key: string
          invitee_user_id?: string | null
          inviter_member_id?: string | null
          ownership_version_at_creation: number
          primary_user_id_at_creation?: string | null
          responded_at?: string | null
          status?: Database["public"]["Enums"]["dog_invite_status"]
        }
        Update: {
          cancellation_reason?:
            | Database["public"]["Enums"]["dog_action_cancellation_reason"]
            | null
          created_at?: string
          dog_id?: string
          expires_at?: string
          id?: string
          idempotency_key?: string
          invitee_user_id?: string | null
          inviter_member_id?: string | null
          ownership_version_at_creation?: number
          primary_user_id_at_creation?: string | null
          responded_at?: string | null
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
          {
            foreignKeyName: "dog_invites_invitee_user_id_fkey"
            columns: ["invitee_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dog_invites_inviter_member_id_fkey"
            columns: ["inviter_member_id"]
            isOneToOne: false
            referencedRelation: "dog_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dog_invites_primary_user_id_at_creation_fkey"
            columns: ["primary_user_id_at_creation"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      dog_members: {
        Row: {
          departure_reason:
            | Database["public"]["Enums"]["dog_member_departure_reason"]
            | null
          dog_id: string
          id: string
          joined_at: string
          left_at: string | null
          role: Database["public"]["Enums"]["dog_member_role"]
          user_id: string | null
        }
        Insert: {
          departure_reason?:
            | Database["public"]["Enums"]["dog_member_departure_reason"]
            | null
          dog_id: string
          id?: string
          joined_at?: string
          left_at?: string | null
          role: Database["public"]["Enums"]["dog_member_role"]
          user_id?: string | null
        }
        Update: {
          departure_reason?:
            | Database["public"]["Enums"]["dog_member_departure_reason"]
            | null
          dog_id?: string
          id?: string
          joined_at?: string
          left_at?: string | null
          role?: Database["public"]["Enums"]["dog_member_role"]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dog_members_dog_id_fkey"
            columns: ["dog_id"]
            isOneToOne: false
            referencedRelation: "dogs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dog_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      dog_ownership_audit: {
        Row: {
          actor_member_id: string | null
          details: Json
          dog_id: string | null
          event: Database["public"]["Enums"]["dog_ownership_audit_event"]
          id: number
          occurred_at: string
          ownership_version: number
        }
        Insert: {
          actor_member_id?: string | null
          details?: Json
          dog_id?: string | null
          event: Database["public"]["Enums"]["dog_ownership_audit_event"]
          id?: number
          occurred_at?: string
          ownership_version: number
        }
        Update: {
          actor_member_id?: string | null
          details?: Json
          dog_id?: string | null
          event?: Database["public"]["Enums"]["dog_ownership_audit_event"]
          id?: number
          occurred_at?: string
          ownership_version?: number
        }
        Relationships: [
          {
            foreignKeyName: "dog_ownership_audit_actor_member_id_fkey"
            columns: ["actor_member_id"]
            isOneToOne: false
            referencedRelation: "dog_members"
            referencedColumns: ["id"]
          },
        ]
      }
      dog_ownership_requests: {
        Row: {
          cancellation_reason:
            | Database["public"]["Enums"]["dog_action_cancellation_reason"]
            | null
          created_at: string
          disclosure_accepted_at: string
          dog_id: string
          expires_at: string
          id: string
          idempotency_key: string
          ownership_version_at_creation: number
          primary_user_id_at_creation: string | null
          requester_user_id: string | null
          responded_at: string | null
          status: Database["public"]["Enums"]["dog_invite_status"]
        }
        Insert: {
          cancellation_reason?:
            | Database["public"]["Enums"]["dog_action_cancellation_reason"]
            | null
          created_at?: string
          disclosure_accepted_at: string
          dog_id: string
          expires_at?: string
          id?: string
          idempotency_key: string
          ownership_version_at_creation: number
          primary_user_id_at_creation?: string | null
          requester_user_id?: string | null
          responded_at?: string | null
          status?: Database["public"]["Enums"]["dog_invite_status"]
        }
        Update: {
          cancellation_reason?:
            | Database["public"]["Enums"]["dog_action_cancellation_reason"]
            | null
          created_at?: string
          disclosure_accepted_at?: string
          dog_id?: string
          expires_at?: string
          id?: string
          idempotency_key?: string
          ownership_version_at_creation?: number
          primary_user_id_at_creation?: string | null
          requester_user_id?: string | null
          responded_at?: string | null
          status?: Database["public"]["Enums"]["dog_invite_status"]
        }
        Relationships: [
          {
            foreignKeyName: "dog_ownership_requests_dog_id_fkey"
            columns: ["dog_id"]
            isOneToOne: false
            referencedRelation: "dogs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dog_ownership_requests_primary_user_id_at_creation_fkey"
            columns: ["primary_user_id_at_creation"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dog_ownership_requests_requester_user_id_fkey"
            columns: ["requester_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      dog_primary_transfers: {
        Row: {
          cancellation_reason:
            | Database["public"]["Enums"]["dog_action_cancellation_reason"]
            | null
          created_at: string
          dog_id: string
          expires_at: string
          from_member_id: string | null
          id: string
          idempotency_key: string
          ownership_version_at_creation: number
          responded_at: string | null
          status: Database["public"]["Enums"]["dog_invite_status"]
          to_member_id: string | null
        }
        Insert: {
          cancellation_reason?:
            | Database["public"]["Enums"]["dog_action_cancellation_reason"]
            | null
          created_at?: string
          dog_id: string
          expires_at?: string
          from_member_id?: string | null
          id?: string
          idempotency_key: string
          ownership_version_at_creation: number
          responded_at?: string | null
          status?: Database["public"]["Enums"]["dog_invite_status"]
          to_member_id?: string | null
        }
        Update: {
          cancellation_reason?:
            | Database["public"]["Enums"]["dog_action_cancellation_reason"]
            | null
          created_at?: string
          dog_id?: string
          expires_at?: string
          from_member_id?: string | null
          id?: string
          idempotency_key?: string
          ownership_version_at_creation?: number
          responded_at?: string | null
          status?: Database["public"]["Enums"]["dog_invite_status"]
          to_member_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dog_primary_transfers_dog_id_fkey"
            columns: ["dog_id"]
            isOneToOne: false
            referencedRelation: "dogs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dog_primary_transfers_from_member_id_fkey"
            columns: ["from_member_id"]
            isOneToOne: false
            referencedRelation: "dog_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dog_primary_transfers_to_member_id_fkey"
            columns: ["to_member_id"]
            isOneToOne: false
            referencedRelation: "dog_members"
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
          lifecycle_state: Database["public"]["Enums"]["dog_lifecycle_state"]
          likes: string[] | null
          name: string | null
          owner: string | null
          ownership_version: number
          possessive: string | null
          primary_image_id: string | null
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
          lifecycle_state?: Database["public"]["Enums"]["dog_lifecycle_state"]
          likes?: string[] | null
          name?: string | null
          owner?: string | null
          ownership_version?: number
          possessive?: string | null
          primary_image_id?: string | null
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
          lifecycle_state?: Database["public"]["Enums"]["dog_lifecycle_state"]
          likes?: string[] | null
          name?: string | null
          owner?: string | null
          ownership_version?: number
          possessive?: string | null
          primary_image_id?: string | null
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
          {
            foreignKeyName: "dogs_primary_image_id_fkey"
            columns: ["primary_image_id"]
            isOneToOne: false
            referencedRelation: "dog_images"
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
      api_cancel_dog_deletion: {
        Args: {
          p_client_build: number
          p_client_platform: Database["public"]["Enums"]["app_platform"]
          p_proposal_id: string
        }
        Returns: Json
      }
      api_cancel_dog_invite: {
        Args: {
          p_client_build: number
          p_client_platform: Database["public"]["Enums"]["app_platform"]
          p_invite_id: string
        }
        Returns: Json
      }
      api_cancel_dog_ownership_request: {
        Args: {
          p_client_build: number
          p_client_platform: Database["public"]["Enums"]["app_platform"]
          p_request_id: string
        }
        Returns: Json
      }
      api_cancel_primary_transfer: {
        Args: {
          p_client_build: number
          p_client_platform: Database["public"]["Enums"]["app_platform"]
          p_transfer_id: string
        }
        Returns: Json
      }
      api_cleanup_device_tokens: {
        Args: { p_device_id?: string }
        Returns: number
      }
      api_create_dog: { Args: { p_dog: Json }; Returns: Json }
      api_create_dog_invite: {
        Args: {
          p_client_build: number
          p_client_platform: Database["public"]["Enums"]["app_platform"]
          p_dog_id: string
          p_idempotency_key: string
          p_invitee_user_id: string
        }
        Returns: Json
      }
      api_create_dog_ownership_request: {
        Args: {
          p_client_build: number
          p_client_platform: Database["public"]["Enums"]["app_platform"]
          p_dog_id: string
          p_idempotency_key: string
        }
        Returns: Json
      }
      api_create_primary_transfer: {
        Args: {
          p_client_build: number
          p_client_platform: Database["public"]["Enums"]["app_platform"]
          p_dog_id: string
          p_idempotency_key: string
          p_to_member_id: string
        }
        Returns: Json
      }
      api_delete_dog_image: { Args: { p_image_id: string }; Returns: undefined }
      api_finalize_dog_image: {
        Args: { p_image_id: string }
        Returns: undefined
      }
      api_get_current_dog_deletion_proposal: {
        Args: {
          p_client_build: number
          p_client_platform: Database["public"]["Enums"]["app_platform"]
          p_dog_id: string
        }
        Returns: Json
      }
      api_get_dog_deletion_proposal: {
        Args: {
          p_client_build: number
          p_client_platform: Database["public"]["Enums"]["app_platform"]
          p_proposal_id: string
        }
        Returns: Json
      }
      api_get_dog_ownership_capabilities: {
        Args: {
          p_client_build: number
          p_client_platform: Database["public"]["Enums"]["app_platform"]
          p_dog_id: string
        }
        Returns: Json
      }
      api_get_dog_page: {
        Args: {
          p_client_build: number
          p_client_platform: Database["public"]["Enums"]["app_platform"]
          p_dog_id: string
        }
        Returns: Json
      }
      api_get_user_dogs: { Args: { p_user_id: string }; Returns: Json }
      api_get_users_dogs: { Args: { p_user_ids: string[] }; Returns: Json }
      api_leave_dog: {
        Args: {
          p_client_build: number
          p_client_platform: Database["public"]["Enums"]["app_platform"]
          p_dog_id: string
          p_expected_ownership_version: number
          p_selected_successor_member_id: string
        }
        Returns: Json
      }
      api_prepare_account_erasure: {
        Args: {
          p_client_build: number
          p_client_platform: Database["public"]["Enums"]["app_platform"]
          p_successor_selections: Json
        }
        Returns: Json
      }
      api_propose_dog_deletion: {
        Args: {
          p_client_build: number
          p_client_platform: Database["public"]["Enums"]["app_platform"]
          p_dog_id: string
          p_idempotency_key: string
        }
        Returns: Json
      }
      api_reserve_dog_image: {
        Args: { p_dog_id: string; p_extension: string }
        Returns: {
          bucket_id: string
          id: string
          reservation_expires_at: string
          storage_path: string
          upload_state: Database["public"]["Enums"]["dog_image_upload_state"]
        }[]
      }
      api_respond_dog_deletion: {
        Args: {
          p_approve: boolean
          p_client_build: number
          p_client_platform: Database["public"]["Enums"]["app_platform"]
          p_proposal_id: string
        }
        Returns: Json
      }
      api_respond_dog_invite: {
        Args: {
          p_accept: boolean
          p_client_build: number
          p_client_platform: Database["public"]["Enums"]["app_platform"]
          p_disclosure_accepted: boolean
          p_invite_id: string
        }
        Returns: Json
      }
      api_respond_dog_ownership_request: {
        Args: {
          p_approve: boolean
          p_client_build: number
          p_client_platform: Database["public"]["Enums"]["app_platform"]
          p_request_id: string
        }
        Returns: Json
      }
      api_respond_primary_transfer: {
        Args: {
          p_accept: boolean
          p_client_build: number
          p_client_platform: Database["public"]["Enums"]["app_platform"]
          p_transfer_id: string
        }
        Returns: Json
      }
      api_set_primary_dog_image: {
        Args: { p_image_id: string }
        Returns: undefined
      }
      api_update_dog: {
        Args: {
          p_changes: Json
          p_client_build: number
          p_client_platform: Database["public"]["Enums"]["app_platform"]
          p_dog_id: string
        }
        Returns: Json
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
      api_withdraw_dog_deletion: {
        Args: {
          p_client_build: number
          p_client_platform: Database["public"]["Enums"]["app_platform"]
          p_proposal_id: string
        }
        Returns: Json
      }
      are_accepted_friends: {
        Args: { p_first_user_id: string; p_second_user_id: string }
        Returns: boolean
      }
      assert_dog_ownership_invariants: {
        Args: { p_dog_id: string }
        Returns: undefined
      }
      can_access_dog_storage_object: {
        Args: { p_object_name: string }
        Returns: boolean
      }
      can_read_dog_deletion_proposal: {
        Args: { p_proposal_id: string }
        Returns: boolean
      }
      can_upload_reserved_dog_image_object: {
        Args: { p_object_name: string }
        Returns: boolean
      }
      can_view_dog_image_object: {
        Args: { p_object_name: string }
        Returns: boolean
      }
      cancel_pending_dog_actions_for_deletion: {
        Args: { p_actor_user_id: string; p_dog_id: string }
        Returns: undefined
      }
      cancel_pending_dog_deletion_proposals: {
        Args: {
          p_actor_user_id: string
          p_dog_id: string
          p_reason: Database["public"]["Enums"]["dog_action_cancellation_reason"]
        }
        Returns: undefined
      }
      cancel_pending_primary_transfers: {
        Args: {
          p_actor_user_id: string
          p_dog_id: string
          p_except_transfer_id?: string
          p_reason: Database["public"]["Enums"]["dog_action_cancellation_reason"]
        }
        Returns: undefined
      }
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
      claim_dog_storage_jobs: {
        Args: { p_limit?: number }
        Returns: {
          attempts: number
          checksum: string
          destination_bucket: string
          destination_path: string
          dog_id: string
          expected_size: number
          id: string
          image_id: string
          operation: Database["public"]["Enums"]["dog_storage_job_operation"]
          source_bucket: string
          source_path: string
        }[]
      }
      complete_dog_storage_job: {
        Args: {
          p_checksum?: string
          p_job_id: string
          p_verified_size?: number
        }
        Returns: undefined
      }
      count_unseen_notifications: { Args: never; Returns: number }
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
      delete_dog: { Args: { dog_id: string }; Returns: undefined }
      dog_ownership_feature_outcome: {
        Args: {
          p_client_build: number
          p_client_platform: Database["public"]["Enums"]["app_platform"]
        }
        Returns: string
      }
      expire_dog_deletion_proposal: {
        Args: { p_proposal_id: string }
        Returns: boolean
      }
      expire_dog_join_actions: {
        Args: { p_dog_id: string }
        Returns: undefined
      }
      expire_primary_transfers: {
        Args: { p_dog_id: string }
        Returns: undefined
      }
      fail_dog_storage_job: {
        Args: { p_error_code: string; p_job_id: string }
        Returns: undefined
      }
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
      insert_dog_information_notification: {
        Args: {
          p_data?: Json
          p_dog_id: string
          p_receiver_id: string
          p_sender_id: string
          p_type: Database["public"]["Enums"]["notification_type"]
        }
        Returns: undefined
      }
      insert_dog_ownership_notification: {
        Args: {
          p_action_id: string
          p_dog_id: string
          p_receiver_id: string
          p_sender_id: string
          p_type: Database["public"]["Enums"]["notification_type"]
        }
        Returns: undefined
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
      notify_dog_deletion_participants: {
        Args: {
          p_excluded_user_id?: string
          p_proposal_id: string
          p_sender_id: string
          p_type: Database["public"]["Enums"]["notification_type"]
        }
        Returns: undefined
      }
      notify_existing_co_owners_of_join: {
        Args: {
          p_dog_id: string
          p_joined_user_id: string
          p_primary_user_id: string
        }
        Returns: undefined
      }
      record_dog_ownership_audit: {
        Args: {
          p_actor_member_id: string
          p_details?: Json
          p_dog_id: string
          p_event: Database["public"]["Enums"]["dog_ownership_audit_event"]
          p_ownership_version: number
        }
        Returns: undefined
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
      transition_dog_member_departure: {
        Args: {
          p_dog_id: string
          p_expected_ownership_version: number
          p_reason: Database["public"]["Enums"]["dog_member_departure_reason"]
          p_selected_successor_member_id: string
          p_user_id: string
        }
        Returns: Json
      }
      update_checkout: { Args: { checkin_id: string }; Returns: undefined }
    }
    Enums: {
      app_feature: "SHARED_DOG_OWNERSHIP"
      app_language: "en" | "he" | "ar"
      app_platform: "IOS" | "ANDROID" | "WEB"
      condition_observed_status: "PRESENT" | "NOT_PRESENT"
      dog_action_cancellation_reason:
        | "CANCELED_BY_ACTOR"
        | "FRIENDSHIP_ENDED"
        | "PRIMARY_CHANGED"
        | "DOG_UNAVAILABLE"
        | "MEMBER_DEPARTED"
        | "ACCOUNT_ERASURE"
        | "OWNER_SET_CHANGED"
        | "APPROVAL_WITHDRAWN"
      dog_deletion_consent_decision: "APPROVED" | "REJECTED"
      dog_deletion_proposal_status:
        | "PENDING"
        | "REJECTED"
        | "CANCELED"
        | "EXPIRED"
        | "COMPLETED"
      dog_image_upload_state: "RESERVED" | "ACTIVE" | "DELETING"
      dog_invite_status:
        | "PENDING"
        | "ACCEPTED"
        | "DECLINED"
        | "CANCELED"
        | "EXPIRED"
      dog_lifecycle_state: "ACTIVE" | "DELETING" | "DELETED"
      dog_member_departure_reason: "LEFT" | "ACCOUNT_ERASED" | "DOG_DELETED"
      dog_member_role: "PRIMARY_OWNER" | "CO_OWNER" | "VIEWER"
      dog_ownership_audit_event:
        | "PRIMARY_TRANSFER_CREATED"
        | "PRIMARY_TRANSFER_CANCELED"
        | "PRIMARY_TRANSFER_DECLINED"
        | "PRIMARY_TRANSFER_ACCEPTED"
        | "OWNER_LEFT"
        | "ACCOUNT_ERASURE_PREPARED"
        | "SOLO_DOG_DELETION_PREPARED"
        | "DOG_DELETION_PROPOSED"
        | "DOG_DELETION_REJECTED"
        | "DOG_DELETION_CANCELED"
        | "DOG_DELETION_PREPARED"
        | "DOG_DELETION_COMPLETED"
      dog_storage_job_operation:
        | "COPY_LEGACY_DOG_IMAGE"
        | "DELETE_DOG_ASSETS"
        | "DELETE_ORPHAN_UPLOAD"
      dog_storage_job_state: "PENDING" | "PROCESSING" | "COMPLETED"
      friendship_status: "APPROVED" | "PENDING"
      invite_status: "INVITED" | "ACCEPTED" | "DECLINED" | "REMOVED"
      notification_target_type:
        | "USER"
        | "PARK_EVENT"
        | "PARK"
        | "SYSTEM"
        | "DOG_INVITE"
        | "DOG_OWNERSHIP_ACTION"
        | "DOG"
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
        | "dog_ownership_invite_received"
        | "dog_ownership_invite_accepted"
        | "dog_ownership_invite_declined"
        | "dog_ownership_invite_canceled"
        | "dog_ownership_request_received"
        | "dog_ownership_request_approved"
        | "dog_ownership_request_declined"
        | "dog_ownership_request_canceled"
        | "dog_owner_joined"
        | "dog_primary_transfer_offered"
        | "dog_primary_transfer_accepted"
        | "dog_primary_transfer_declined"
        | "dog_primary_transfer_canceled"
        | "dog_owner_left"
        | "dog_primary_changed"
        | "dog_deletion_consent_requested"
        | "dog_deletion_proposal_rejected"
        | "dog_deletion_proposal_canceled"
        | "dog_deletion_proposal_expired"
        | "dog_deletion_completed"
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
      app_feature: ["SHARED_DOG_OWNERSHIP"],
      app_language: ["en", "he", "ar"],
      app_platform: ["IOS", "ANDROID", "WEB"],
      condition_observed_status: ["PRESENT", "NOT_PRESENT"],
      dog_action_cancellation_reason: [
        "CANCELED_BY_ACTOR",
        "FRIENDSHIP_ENDED",
        "PRIMARY_CHANGED",
        "DOG_UNAVAILABLE",
        "MEMBER_DEPARTED",
        "ACCOUNT_ERASURE",
        "OWNER_SET_CHANGED",
        "APPROVAL_WITHDRAWN",
      ],
      dog_deletion_consent_decision: ["APPROVED", "REJECTED"],
      dog_deletion_proposal_status: [
        "PENDING",
        "REJECTED",
        "CANCELED",
        "EXPIRED",
        "COMPLETED",
      ],
      dog_image_upload_state: ["RESERVED", "ACTIVE", "DELETING"],
      dog_invite_status: [
        "PENDING",
        "ACCEPTED",
        "DECLINED",
        "CANCELED",
        "EXPIRED",
      ],
      dog_lifecycle_state: ["ACTIVE", "DELETING", "DELETED"],
      dog_member_departure_reason: ["LEFT", "ACCOUNT_ERASED", "DOG_DELETED"],
      dog_member_role: ["PRIMARY_OWNER", "CO_OWNER", "VIEWER"],
      dog_ownership_audit_event: [
        "PRIMARY_TRANSFER_CREATED",
        "PRIMARY_TRANSFER_CANCELED",
        "PRIMARY_TRANSFER_DECLINED",
        "PRIMARY_TRANSFER_ACCEPTED",
        "OWNER_LEFT",
        "ACCOUNT_ERASURE_PREPARED",
        "SOLO_DOG_DELETION_PREPARED",
        "DOG_DELETION_PROPOSED",
        "DOG_DELETION_REJECTED",
        "DOG_DELETION_CANCELED",
        "DOG_DELETION_PREPARED",
        "DOG_DELETION_COMPLETED",
      ],
      dog_storage_job_operation: [
        "COPY_LEGACY_DOG_IMAGE",
        "DELETE_DOG_ASSETS",
        "DELETE_ORPHAN_UPLOAD",
      ],
      dog_storage_job_state: ["PENDING", "PROCESSING", "COMPLETED"],
      friendship_status: ["APPROVED", "PENDING"],
      invite_status: ["INVITED", "ACCEPTED", "DECLINED", "REMOVED"],
      notification_target_type: [
        "USER",
        "PARK_EVENT",
        "PARK",
        "SYSTEM",
        "DOG_INVITE",
        "DOG_OWNERSHIP_ACTION",
        "DOG",
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
        "dog_ownership_invite_received",
        "dog_ownership_invite_accepted",
        "dog_ownership_invite_declined",
        "dog_ownership_invite_canceled",
        "dog_ownership_request_received",
        "dog_ownership_request_approved",
        "dog_ownership_request_declined",
        "dog_ownership_request_canceled",
        "dog_owner_joined",
        "dog_primary_transfer_offered",
        "dog_primary_transfer_accepted",
        "dog_primary_transfer_declined",
        "dog_primary_transfer_canceled",
        "dog_owner_left",
        "dog_primary_changed",
        "dog_deletion_consent_requested",
        "dog_deletion_proposal_rejected",
        "dog_deletion_proposal_canceled",
        "dog_deletion_proposal_expired",
        "dog_deletion_completed",
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


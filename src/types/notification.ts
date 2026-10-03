enum NotificationType {
  FRIEND_REQUEST = 'friend_request',
  FRIEND_APPROVAL = 'friend_approval',
  PARK_INVITE = 'park_invite',
  PARK_INVITE_ACCEPT = 'park_invite_accept',
  PARK_INVITE_DECLINE = 'park_invite_decline',
  PARK_INVITE_CANCELLED = 'park_invite_cancelled',
  DOG_OWNERSHIP_INVITE_RECEIVED = 'dog_ownership_invite_received',
  DOG_OWNERSHIP_INVITE_ACCEPTED = 'dog_ownership_invite_accepted',
  DOG_OWNERSHIP_INVITE_DECLINED = 'dog_ownership_invite_declined',
  DOG_OWNERSHIP_INVITE_CANCELED = 'dog_ownership_invite_canceled',
  DOG_OWNERSHIP_REQUEST_RECEIVED = 'dog_ownership_request_received',
  DOG_OWNERSHIP_REQUEST_APPROVED = 'dog_ownership_request_approved',
  DOG_OWNERSHIP_REQUEST_DECLINED = 'dog_ownership_request_declined',
  DOG_OWNERSHIP_REQUEST_CANCELED = 'dog_ownership_request_canceled',
  DOG_OWNER_JOINED = 'dog_owner_joined',
  DOG_OWNER_LEFT = 'dog_owner_left',
  DOG_PRIMARY_CHANGED = 'dog_primary_changed',
  DOG_PRIMARY_TRANSFER_OFFERED = 'dog_primary_transfer_offered',
  DOG_PRIMARY_TRANSFER_ACCEPTED = 'dog_primary_transfer_accepted',
  DOG_PRIMARY_TRANSFER_DECLINED = 'dog_primary_transfer_declined',
  DOG_PRIMARY_TRANSFER_CANCELED = 'dog_primary_transfer_canceled',
  DOG_DELETION_CONSENT_REQUESTED = 'dog_deletion_consent_requested',
  DOG_DELETION_PROPOSAL_REJECTED = 'dog_deletion_proposal_rejected',
  DOG_DELETION_PROPOSAL_CANCELED = 'dog_deletion_proposal_canceled',
  DOG_DELETION_PROPOSAL_EXPIRED = 'dog_deletion_proposal_expired',
  DOG_DELETION_COMPLETED = 'dog_deletion_completed',
}

enum NotificationTargetType {
  USER = 'user',
  PARK_EVENT = 'park_event',
  PARK = 'park',
  SYSTEM = 'system',
  DOG_OWNERSHIP_ACTION = 'dog_ownership_action',
  DOG = 'dog',
}

enum Platform {
  IOS = 'ios',
  ANDROID = 'android',
  WEB = 'web',
}

interface Notification {
  id: string;
  target_type: NotificationTargetType;
  target_id: string;
  type: NotificationType;
  sender_id: string;
  receiver_id: string;
  title: string;
  app_message: string | null;
  push_message: string | null;
  read_at: string | null;
  seen_at: string | null;
  created_at: string;
  sender?: {
    id: string;
    name: string | null;
  };
}

export type { Notification };
export { NotificationType, NotificationTargetType, Platform };

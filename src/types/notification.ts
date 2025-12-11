enum NotificationType {
  FRIEND_REQUEST = 'friend_request',
  FRIEND_APPROVAL = 'friend_approval',
  PARK_INVITE = 'park_invite',
  PARK_INVITE_ACCEPT = 'park_invite_accept',
  PARK_INVITE_DECLINE = 'park_invite_decline',
  PARK_INVITE_CANCELLED = 'park_invite_cancelled',
}

enum NotificationTargetType {
  USER = 'user',
  PARK_EVENT = 'park_event',
  PARK = 'park',
  SYSTEM = 'system',
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

enum NotificationType {
  FRIEND_REQUEST = 'friend_request',
  FRIEND_APPROVAL = 'friend_approval',
  PARK_INVITE = 'park_invite',
  PARK_INVITE_RESPONSE = 'park_invite_response',
  PARK_INVITE_CANCELLED = 'park_invite_cancelled',
}

enum Platform {
  IOS = 'ios',
  ANDROID = 'android',
  WEB = 'web',
}

interface Notification {
  id: string;
  type: NotificationType;
  sender_id: string;
  receiver_id: string;
  title: string;
  app_message: string;
  push_message?: string;
  read_at: string | null;
  seen_at: string | null;
  delivered_at: boolean;
  created_at: string;
  is_ready: boolean;
  sender?: {
    id: string;
    name: string | null;
  };
}

export type { Notification };
export { NotificationType, Platform };

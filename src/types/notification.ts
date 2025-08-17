enum NotificationType {
  FRIEND_REQUEST = 'friend_request',
  FRIEND_APPROVAL = 'friend_approval',
}

enum Platform {
  IOS = 'ios',
  ANDROID = 'android',
  WEB = 'web'
}

interface Notification {
  id: string;
  type: NotificationType;
  sender_id: string;
  title: string;
  app_message: string;
  push_message?: string;
  read_at: string | null;
  seen_at: string | null;
  created_at: string;
}

export type { Notification };
export { NotificationType, Platform }
import { Capacitor } from '@capacitor/core';
import { supabase } from './supabase-client';
import { NotificationType, Platform } from '../types/notification';
import { throwError } from './error';

interface NotificationPreferences {
  user_id: string;
  muted: boolean;
  friend_request: boolean;
  friend_approval: boolean;
  created_at?: string;
  updated_at?: string;
}

interface GetNotificationsParams {
  userId: string;
  limit: number;
  cursor?: string;
}

interface MarkAsReadParams {
  notificationId: string;
}

interface GetNotificationPreferencesParams {
  userId: string;
}

interface UpsertDeviceTokenParams {
  userId: string;
  deviceId: string;
  platform: Platform;
  token: string;
}

interface RemoveDeviceTokenParams {
  token: string;
  deviceId: string;
}

const upsertDeviceToken = async (params: UpsertDeviceTokenParams) => {
  const { userId, deviceId, platform, token } = params;
  if (!Capacitor.isNativePlatform()) {
    return;
  }

  try {
    const { error } = await supabase.from('device_tokens').upsert(
      {
        user_id: userId,
        device_id: deviceId,
        platform,
        token,
      },
      { onConflict: 'device_id' }
    );

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('[Push] upsertDeviceToken error:', error);
    throwError(error);
  }
};

const removeDeviceToken = async (params: RemoveDeviceTokenParams) => {
  const { token, deviceId } = params;

  if (!Capacitor.isNativePlatform()) {
    return;
  }

  try {
    const { error } = await supabase.rpc('remove_device_token_by_device', {
      p_device_id: deviceId,
      p_token: token,
    });

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('[Push] removeDeviceToken error:', error);
    throwError(error);
  }
};

const getSeenNotifications = async ({
  userId,
  limit,
  cursor,
}: GetNotificationsParams) => {
  try {
    let query = supabase
      .from('notifications')
      .select(
        `
        id,
        type,
        sender_id,
        title,
        app_message,
        push_message,
        read_at,
        seen_at,
        created_at,
        sender:users!notifications_sender_id_fkey(
          id,
          name
        )
      `
      )
      .eq('receiver_id', userId)
      .not('seen_at', 'is', null)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (cursor) {
      query = query.lt('created_at', cursor);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return (
      data?.map((notification) => ({
        id: notification.id,
        type: notification.type as NotificationType,
        sender_id: notification.sender_id,
        receiver_id: userId,
        title: notification.title,
        app_message: notification.app_message,
        push_message: notification.push_message,
        read_at: notification.read_at,
        seen_at: notification.seen_at,
        delivered_at: true,
        created_at: notification.created_at,
        is_ready: true,
      })) || []
    );
  } catch (error) {
    console.error('Error fetching seen notifications:', error);
    return [];
  }
};

const markAsRead = async ({ notificationId }: MarkAsReadParams) => {
  try {
    await supabase.rpc('mark_notification_read', {
      notification_id: notificationId,
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
  }
};

const markAllAsRead = async () => {
  try {
    await supabase.rpc('mark_all_notifications_as_read');
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
  }
};

const markAllAsSeen = async () => {
  try {
    await supabase.rpc('mark_all_notifications_as_seen');
  } catch (error) {
    console.error('Error marking all notifications as seen:', error);
  }
};

const getNotificationPreferences = async ({
  userId,
}: GetNotificationPreferencesParams): Promise<NotificationPreferences | null> => {
  try {
    const { data, error } = await supabase
      .from('notifications_preferences')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    return null;
  }
};

const updateNotificationPreferences = async (
  preferences: Partial<NotificationPreferences>
) => {
  const {
    user_id,
    muted = false,
    friend_request = true,
    friend_approval = true,
  } = preferences;

  try {
    const { data: existing } = await supabase
      .from('notifications_preferences')
      .select('*')
      .eq('user_id', user_id)
      .single();

    if (existing) {
      const { error } = await supabase
        .from('notifications_preferences')
        .update({
          ...preferences,
        })
        .eq('user_id', user_id);

      if (error) {
        throw error;
      }
    } else {
      const { error } = await supabase
        .from('notifications_preferences')
        .insert([
          {
            user_id,
            muted: muted,
            friend_request,
            friend_approval,
          },
        ]);

      if (error) {
        throw error;
      }
    }
  } catch (error) {
    throwError(error);
  }
};

const getUnseenNotifications = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select(
        `
        id,
        type,
        sender_id,
        title,
        app_message,
        push_message,
        read_at,
        seen_at,
        created_at,
        sender:users!notifications_sender_id_fkey(
          id,
          name
        )
      `
      )
      .eq('receiver_id', userId)
      .is('seen_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return (
      data?.map((notification) => ({
        id: notification.id,
        type: notification.type as NotificationType,
        sender_id: notification.sender_id,
        receiver_id: userId,
        title: notification.title,
        app_message: notification.app_message,
        push_message: notification.push_message,
        read_at: notification.read_at,
        seen_at: notification.seen_at,
        delivered_at: true,
        created_at: notification.created_at,
        is_ready: true,
      })) || []
    );
  } catch (error) {
    console.error('Error fetching unseen notifications:', error);
    return [];
  }
};

export {
  upsertDeviceToken,
  removeDeviceToken,
  getSeenNotifications,
  getUnseenNotifications,
  markAsRead,
  markAllAsRead,
  markAllAsSeen,
  getNotificationPreferences,
  updateNotificationPreferences,
};

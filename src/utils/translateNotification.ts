import { TFunction } from 'i18next';

interface TranslateNotificationParams {
  type?: string | null;
  senderName?: string | null;
  serverTitle?: string | null;
  serverAppMessage?: string | null;
  t: TFunction;
}

interface TranslateNotificationResult {
  title: string;
  appMessage: string;
}

// Map server types to locale keys
const typeKeyMap: Record<string, { title: string; appMessage: string }> = {
  FRIEND_REQUEST: {
    title: 'notifications.types.friendRequest.title',
    appMessage: 'notifications.types.friendRequest.appMessage',
  },
  FRIEND_APPROVAL: {
    title: 'notifications.types.friendApproval.title',
    appMessage: 'notifications.types.friendApproval.appMessage',
  },
  PARK_INVITE: {
    title: 'notifications.types.parkInvite.title',
    appMessage: 'notifications.types.parkInvite.appMessage',
  },
  PARK_INVITE_ACCEPT: {
    title: 'notifications.types.parkInviteAccept.title',
    appMessage: 'notifications.types.parkInviteAccept.appMessage',
  },
  PARK_INVITE_DECLINE: {
    title: 'notifications.types.parkInviteDecline.title',
    appMessage: 'notifications.types.parkInviteDecline.appMessage',
  },
  PARK_INVITE_CANCELLED: {
    title: 'notifications.types.parkInviteCancelled.title',
    appMessage: 'notifications.types.parkInviteCancelled.appMessage',
  },
};

function translateNotification(
  params: TranslateNotificationParams
): TranslateNotificationResult {
  const { type, senderName, serverTitle, serverAppMessage, t } = params;

  const safeName =
    senderName && senderName.trim().length > 0
      ? senderName
      : t('notifications.common.someone');

  const lookupKey = typeof type === 'string' ? type.toUpperCase() : '';

  if (lookupKey && typeKeyMap[lookupKey]) {
    const keys = typeKeyMap[lookupKey];
    const title = t(keys.title, { name: safeName });
    const appMessage = t(keys.appMessage, { name: safeName });
    return { title, appMessage };
  }

  // Fallbacks: use server-provided strings when available, otherwise generic defaults
  const title = serverTitle || t('notifications.general.defaultTitle');
  const appMessage =
    serverAppMessage || t('notifications.general.defaultMessage');
  return { title, appMessage };
}

export { translateNotification };

import { TFunction } from 'i18next';
import { capitalizeWords } from './text';

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
  DOG_OWNERSHIP_INVITE_RECEIVED: {
    title: 'dogOwnership.notifications.inviteReceivedTitle',
    appMessage: 'dogOwnership.notifications.inviteReceivedMessage',
  },
  DOG_OWNERSHIP_INVITE_ACCEPTED: {
    title: 'dogOwnership.notifications.inviteAcceptedTitle',
    appMessage: 'dogOwnership.notifications.inviteAcceptedMessage',
  },
  DOG_OWNERSHIP_INVITE_DECLINED: {
    title: 'dogOwnership.notifications.inviteDeclinedTitle',
    appMessage: 'dogOwnership.notifications.inviteDeclinedMessage',
  },
  DOG_OWNERSHIP_INVITE_CANCELED: {
    title: 'dogOwnership.notifications.inviteCanceledTitle',
    appMessage: 'dogOwnership.notifications.inviteCanceledMessage',
  },
  DOG_OWNERSHIP_REQUEST_RECEIVED: {
    title: 'dogOwnership.notifications.requestReceivedTitle',
    appMessage: 'dogOwnership.notifications.requestReceivedMessage',
  },
  DOG_OWNERSHIP_REQUEST_APPROVED: {
    title: 'dogOwnership.notifications.requestApprovedTitle',
    appMessage: 'dogOwnership.notifications.requestApprovedMessage',
  },
  DOG_OWNERSHIP_REQUEST_DECLINED: {
    title: 'dogOwnership.notifications.requestDeclinedTitle',
    appMessage: 'dogOwnership.notifications.requestDeclinedMessage',
  },
  DOG_OWNERSHIP_REQUEST_CANCELED: {
    title: 'dogOwnership.notifications.requestCanceledTitle',
    appMessage: 'dogOwnership.notifications.requestCanceledMessage',
  },
  DOG_OWNER_JOINED: {
    title: 'dogOwnership.notifications.ownerJoinedTitle',
    appMessage: 'dogOwnership.notifications.ownerJoinedMessage',
  },
  DOG_OWNER_LEFT: {
    title: 'dogOwnership.notifications.ownerLeftTitle',
    appMessage: 'dogOwnership.notifications.ownerLeftMessage',
  },
  DOG_PRIMARY_CHANGED: {
    title: 'dogOwnership.notifications.primaryChangedTitle',
    appMessage: 'dogOwnership.notifications.primaryChangedMessage',
  },
  DOG_PRIMARY_TRANSFER_OFFERED: {
    title: 'dogOwnership.notifications.transferOfferedTitle',
    appMessage: 'dogOwnership.notifications.transferOfferedMessage',
  },
  DOG_PRIMARY_TRANSFER_ACCEPTED: {
    title: 'dogOwnership.notifications.transferAcceptedTitle',
    appMessage: 'dogOwnership.notifications.transferAcceptedMessage',
  },
  DOG_PRIMARY_TRANSFER_DECLINED: {
    title: 'dogOwnership.notifications.transferDeclinedTitle',
    appMessage: 'dogOwnership.notifications.transferDeclinedMessage',
  },
  DOG_PRIMARY_TRANSFER_CANCELED: {
    title: 'dogOwnership.notifications.transferCanceledTitle',
    appMessage: 'dogOwnership.notifications.transferCanceledMessage',
  },
};

function translateNotification(
  params: TranslateNotificationParams,
): TranslateNotificationResult {
  const { type, senderName, serverTitle, serverAppMessage, t } = params;

  const safeName =
    senderName && senderName.trim().length > 0
      ? capitalizeWords(senderName)
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

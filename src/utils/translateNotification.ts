import { TFunction } from 'i18next';
import { capitalizeWords } from './text';

interface TranslateNotificationParams {
  dogName?: string | null;
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
    title: 'notifications.types.dogOwnership.inviteReceived.title',
    appMessage: 'notifications.types.dogOwnership.inviteReceived.appMessage',
  },
  DOG_OWNERSHIP_INVITE_ACCEPTED: {
    title: 'notifications.types.dogOwnership.inviteAccepted.title',
    appMessage: 'notifications.types.dogOwnership.inviteAccepted.appMessage',
  },
  DOG_OWNERSHIP_INVITE_DECLINED: {
    title: 'notifications.types.dogOwnership.inviteDeclined.title',
    appMessage: 'notifications.types.dogOwnership.inviteDeclined.appMessage',
  },
  DOG_OWNERSHIP_INVITE_CANCELED: {
    title: 'notifications.types.dogOwnership.inviteCanceled.title',
    appMessage: 'notifications.types.dogOwnership.inviteCanceled.appMessage',
  },
  DOG_OWNERSHIP_REQUEST_RECEIVED: {
    title: 'notifications.types.dogOwnership.requestReceived.title',
    appMessage: 'notifications.types.dogOwnership.requestReceived.appMessage',
  },
  DOG_OWNERSHIP_REQUEST_APPROVED: {
    title: 'notifications.types.dogOwnership.requestApproved.title',
    appMessage: 'notifications.types.dogOwnership.requestApproved.appMessage',
  },
  DOG_OWNERSHIP_REQUEST_DECLINED: {
    title: 'notifications.types.dogOwnership.requestDeclined.title',
    appMessage: 'notifications.types.dogOwnership.requestDeclined.appMessage',
  },
  DOG_OWNERSHIP_REQUEST_CANCELED: {
    title: 'notifications.types.dogOwnership.requestCanceled.title',
    appMessage: 'notifications.types.dogOwnership.requestCanceled.appMessage',
  },
  DOG_OWNER_JOINED: {
    title: 'notifications.types.dogOwnership.ownerJoined.title',
    appMessage: 'notifications.types.dogOwnership.ownerJoined.appMessage',
  },
  DOG_OWNER_LEFT: {
    title: 'notifications.types.dogOwnership.ownerLeft.title',
    appMessage: 'notifications.types.dogOwnership.ownerLeft.appMessage',
  },
  DOG_PRIMARY_CHANGED: {
    title: 'notifications.types.dogOwnership.primaryChanged.title',
    appMessage: 'notifications.types.dogOwnership.primaryChanged.appMessage',
  },
  DOG_PRIMARY_TRANSFER_OFFERED: {
    title: 'notifications.types.dogOwnership.transferOffered.title',
    appMessage: 'notifications.types.dogOwnership.transferOffered.appMessage',
  },
  DOG_PRIMARY_TRANSFER_ACCEPTED: {
    title: 'notifications.types.dogOwnership.transferAccepted.title',
    appMessage: 'notifications.types.dogOwnership.transferAccepted.appMessage',
  },
  DOG_PRIMARY_TRANSFER_DECLINED: {
    title: 'notifications.types.dogOwnership.transferDeclined.title',
    appMessage: 'notifications.types.dogOwnership.transferDeclined.appMessage',
  },
  DOG_PRIMARY_TRANSFER_CANCELED: {
    title: 'notifications.types.dogOwnership.transferCanceled.title',
    appMessage: 'notifications.types.dogOwnership.transferCanceled.appMessage',
  },
  DOG_DELETION_CONSENT_REQUESTED: {
    title: 'notifications.types.dogOwnership.deletionRequested.title',
    appMessage: 'notifications.types.dogOwnership.deletionRequested.appMessage',
  },
  DOG_DELETION_PROPOSAL_REJECTED: {
    title: 'notifications.types.dogOwnership.deletionRejected.title',
    appMessage: 'notifications.types.dogOwnership.deletionRejected.appMessage',
  },
  DOG_DELETION_PROPOSAL_CANCELED: {
    title: 'notifications.types.dogOwnership.deletionCanceled.title',
    appMessage: 'notifications.types.dogOwnership.deletionCanceled.appMessage',
  },
  DOG_DELETION_PROPOSAL_EXPIRED: {
    title: 'notifications.types.dogOwnership.deletionExpired.title',
    appMessage: 'notifications.types.dogOwnership.deletionExpired.appMessage',
  },
  DOG_DELETION_COMPLETED: {
    title: 'notifications.types.dogOwnership.deletionCompleted.title',
    appMessage: 'notifications.types.dogOwnership.deletionCompleted.appMessage',
  },
};

function translateNotification(
  params: TranslateNotificationParams,
): TranslateNotificationResult {
  const { type, senderName, dogName, serverTitle, serverAppMessage, t } =
    params;

  const safeName =
    senderName && senderName.trim().length > 0
      ? capitalizeWords(senderName)
      : t('notifications.common.someone');

  const lookupKey = typeof type === 'string' ? type.toUpperCase() : '';

  if (lookupKey && typeKeyMap[lookupKey]) {
    const keys = typeKeyMap[lookupKey];
    const resolvedDogName = dogName?.trim();
    // Deleted or inaccessible dogs need a readable localized fallback.
    const dogLabel = lookupKey.startsWith('DOG_')
      ? resolvedDogName || t('notifications.types.dogOwnership.dogFallback')
      : undefined;
    const title = t(keys.title, { name: safeName, dogName: dogLabel });
    const appMessage = t(keys.appMessage, { name: safeName, dogName: dogLabel });
    // Put the dog in the title so every ownership event has an unmistakable subject.
    return {
      title:
        lookupKey.startsWith('DOG_') && resolvedDogName
          ? `${title} · ${resolvedDogName}`
          : title,
      appMessage,
    };
  }

  // Fallbacks: use server-provided strings when available, otherwise generic defaults
  const title = serverTitle || t('notifications.general.defaultTitle');
  const appMessage =
    serverAppMessage || t('notifications.general.defaultMessage');
  return { title, appMessage };
}

export { translateNotification };

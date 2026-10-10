import {
  UserPlus,
  Heart,
  CalendarPlus,
  CalendarCheck,
  CalendarX,
  XCircle,
  PawPrint,
  LucideIcon,
} from 'lucide-react';
import { Notification, NotificationType } from '../types/notification';
import { queryClient } from '../services/react-query';

interface NotificationConfig {
  icon: LucideIcon;
  color: 'pink' | 'blue' | 'green' | 'red';
  getUrl: (notification: Notification) => string | null;
  invalidateQueries: (userId: string, notification: Notification) => void;
}

function invalidateDogOwnershipQueries(dogId?: string) {
  // Action notifications identify the action rather than the dog. Invalidate
  // cached dog capabilities broadly in that case; server reads retain authority.
  queryClient.invalidateQueries({
    queryKey: dogId ? ['dogPage', dogId] : ['dogPage'],
  });
  queryClient.invalidateQueries({ queryKey: ['userDogs'] });
  queryClient.invalidateQueries({ queryKey: ['friendsWithDogs'] });
  queryClient.invalidateQueries({
    queryKey: dogId ? ['dogOwnershipActions', dogId] : ['dogOwnershipActions'],
  });
  queryClient.invalidateQueries({ queryKey: ['dogDeletionProposal'] });
}

const getNotificationConfig = (type: NotificationType): NotificationConfig => {
  switch (type) {
    case NotificationType.FRIEND_REQUEST:
      return {
        icon: UserPlus,
        color: 'pink',
        getUrl: (notification) => `/profile/${notification.sender_id}`,
        invalidateQueries: (userId) => {
          queryClient.invalidateQueries({
            queryKey: ['friendsWithDogs', userId, 'PENDING', 'REQUESTER'],
          });
          queryClient.invalidateQueries({
            queryKey: ['friendshipMap', userId],
          });
        },
      };
    case NotificationType.FRIEND_APPROVAL:
      return {
        icon: Heart,
        color: 'blue',
        getUrl: (notification) => `/profile/${notification.sender_id}`,
        invalidateQueries: (userId) => {
          queryClient.invalidateQueries({
            queryKey: ['friendsWithDogs', userId],
          });
          queryClient.invalidateQueries({
            queryKey: ['friendshipMap', userId],
          });
        },
      };
    case NotificationType.PARK_INVITE:
      return {
        icon: CalendarPlus,
        color: 'pink',
        getUrl: (notification) => `/events/${notification.target_id}`,
        invalidateQueries: (userId, notification) => {
          queryClient.invalidateQueries({
            queryKey: ['events', 'invited', userId],
          });
          queryClient.invalidateQueries({
            queryKey: ['event', notification.target_id],
          });
        },
      };
    case NotificationType.PARK_INVITE_CANCELLED:
      return {
        icon: XCircle,
        color: 'red',
        getUrl: (notification) => `/events/${notification.target_id}`,
        invalidateQueries: (userId, notification) => {
          queryClient.invalidateQueries({
            queryKey: ['events', 'invited', userId],
          });
          queryClient.invalidateQueries({
            queryKey: ['event', notification.target_id],
          });
        },
      };
    case NotificationType.PARK_INVITE_ACCEPT:
      return {
        icon: CalendarCheck,
        color: 'green',
        getUrl: (notification) => `/events/${notification.target_id}`,
        invalidateQueries: (userId, notification) => {
          queryClient.invalidateQueries({
            queryKey: ['events', 'organized', userId],
          });
          queryClient.invalidateQueries({
            queryKey: ['event', notification.target_id],
          });
        },
      };
    case NotificationType.PARK_INVITE_DECLINE:
      return {
        icon: CalendarX,
        color: 'red',
        getUrl: (notification) => `/events/${notification.target_id}`,
        invalidateQueries: (userId, notification) => {
          queryClient.invalidateQueries({
            queryKey: ['events', 'organized', userId],
          });
          queryClient.invalidateQueries({
            queryKey: ['event', notification.target_id],
          });
        },
      };
    case NotificationType.DOG_OWNERSHIP_INVITE_RECEIVED:
    case NotificationType.DOG_OWNERSHIP_INVITE_ACCEPTED:
    case NotificationType.DOG_OWNERSHIP_INVITE_DECLINED:
    case NotificationType.DOG_OWNERSHIP_INVITE_CANCELED:
      return {
        icon: PawPrint,
        color: 'green',
        getUrl: (notification) =>
          `/ownership-actions/invite/${notification.target_id}`,
        invalidateQueries: (_userId, notification) => {
          queryClient.invalidateQueries({
            queryKey: ['dogOwnershipAction', 'invite', notification.target_id],
          });
          invalidateDogOwnershipQueries();
        },
      };
    case NotificationType.DOG_OWNERSHIP_REQUEST_RECEIVED:
    case NotificationType.DOG_OWNERSHIP_REQUEST_APPROVED:
    case NotificationType.DOG_OWNERSHIP_REQUEST_DECLINED:
    case NotificationType.DOG_OWNERSHIP_REQUEST_CANCELED:
      return {
        icon: PawPrint,
        color: 'blue',
        getUrl: (notification) =>
          `/ownership-actions/request/${notification.target_id}`,
        invalidateQueries: (_userId, notification) => {
          queryClient.invalidateQueries({
            queryKey: ['dogOwnershipAction', 'request', notification.target_id],
          });
          invalidateDogOwnershipQueries();
        },
      };
    case NotificationType.DOG_OWNER_JOINED:
    case NotificationType.DOG_OWNER_LEFT:
    case NotificationType.DOG_PRIMARY_CHANGED:
      return {
        icon: PawPrint,
        color: 'green',
        // Membership updates belong with the current owner roster.
        getUrl: (notification) => `/dogs/${notification.target_id}/ownership`,
        invalidateQueries: (_userId, notification) => {
          invalidateDogOwnershipQueries(notification.target_id);
        },
      };
    case NotificationType.DOG_PRIMARY_TRANSFER_OFFERED:
    case NotificationType.DOG_PRIMARY_TRANSFER_ACCEPTED:
    case NotificationType.DOG_PRIMARY_TRANSFER_DECLINED:
    case NotificationType.DOG_PRIMARY_TRANSFER_CANCELED:
      return {
        icon: PawPrint,
        color: 'pink',
        getUrl: (notification) =>
          `/ownership-actions/transfer/${notification.target_id}`,
        invalidateQueries: (_userId, notification) => {
          queryClient.invalidateQueries({
            queryKey: [
              'dogOwnershipAction',
              'transfer',
              notification.target_id,
            ],
          });
          invalidateDogOwnershipQueries();
        },
      };
    case NotificationType.DOG_DELETION_CONSENT_REQUESTED:
    case NotificationType.DOG_DELETION_PROPOSAL_REJECTED:
    case NotificationType.DOG_DELETION_PROPOSAL_CANCELED:
    case NotificationType.DOG_DELETION_PROPOSAL_EXPIRED:
      return {
        icon: PawPrint,
        color: 'red',
        getUrl: (notification) =>
          `/ownership-actions/deletion/${notification.target_id}`,
        invalidateQueries: (_userId, notification) => {
          queryClient.invalidateQueries({
            queryKey: ['dogDeletionProposal'],
          });
          queryClient.invalidateQueries({
            queryKey: ['dogOwnershipAction', notification.target_id],
          });
          invalidateDogOwnershipQueries();
        },
      };
    case NotificationType.DOG_DELETION_COMPLETED:
      return {
        icon: PawPrint,
        color: 'red',
        getUrl: () => null,
        invalidateQueries: (_userId, notification) => {
          invalidateDogOwnershipQueries(notification.target_id);
        },
      };
    default:
      return {
        icon: Heart,
        color: 'pink',
        getUrl: () => null,
        invalidateQueries: () => {},
      };
  }
};

export { getNotificationConfig };

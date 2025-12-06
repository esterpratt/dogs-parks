import {
  UserPlus,
  Heart,
  CalendarPlus,
  CalendarCheck,
  CalendarX,
  XCircle,
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

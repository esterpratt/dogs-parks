import { useContext } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Capacitor } from '@capacitor/core';
import { Badge } from '@capawesome/capacitor-badge';
import { FirebaseMessaging } from '@capacitor-firebase/messaging';
import { markNotificationsSeen } from '../../services/notifications';
import { queryClient } from '../../services/react-query';
import { UserContext } from '../../context/UserContext';

interface MarkNotificationsSeenParams {
  notificationIds: string[];
}

const useMarkNotificationsAsSeen = () => {
  const { userId } = useContext(UserContext);

  const { mutateAsync, isPending } = useMutation({
    mutationFn: (params: MarkNotificationsSeenParams) =>
      markNotificationsSeen(params),
    onMutate: async () => {
      // Optimistically set badge count to 0
      queryClient.setQueryData(['notifications', 'unseenCount', userId], 0);
    },
    onSuccess: async () => {
      // Invalidate count query to sync with backend
      queryClient.invalidateQueries({
        queryKey: ['notifications', 'unseenCount', userId],
      });
      queryClient.invalidateQueries({
        queryKey: ['unseenNotifications', userId],
      });
      queryClient.invalidateQueries({
        queryKey: ['seenNotifications', userId],
      });

      // Update native badge
      if (Capacitor.isNativePlatform()) {
        try {
          await FirebaseMessaging.removeAllDeliveredNotifications();
          await Badge.set({ count: 0 });
        } catch (error) {
          console.error('Failed to clear badge:', error);
        }
      }
    },
    onError: () => {
      // Rollback optimistic update on error
      queryClient.invalidateQueries({
        queryKey: ['notifications', 'unseenCount', userId],
      });
    },
  });

  return {
    markNotificationsAsSeen: mutateAsync,
    isMarkingSeen: isPending,
  };
};

export { useMarkNotificationsAsSeen };

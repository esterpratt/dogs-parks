import { useContext } from 'react';
import { useMutation } from '@tanstack/react-query';
import type { InfiniteData } from '@tanstack/react-query';
import { Capacitor } from '@capacitor/core';
import { Badge } from '@capawesome/capacitor-badge';
import { markAllAsSeen } from '../../services/notifications';
import { Notification } from '../../types/notification';
import { queryClient } from '../../services/react-query';
import { UserContext } from '../../context/UserContext';

const useMarkAllNotificationsAsSeen = () => {
  const { user } = useContext(UserContext);

  const { mutateAsync, isPending } = useMutation({
    mutationFn: markAllAsSeen,
    onMutate: async () => {
      await queryClient.cancelQueries({
        queryKey: ['unseenNotifications', user?.id],
      });
      await queryClient.cancelQueries({
        queryKey: ['seenNotifications', user?.id],
      });

      const prevUnseen =
        queryClient.getQueryData<Notification[]>([
          'unseenNotifications',
          user?.id,
        ]) ?? [];
      const prevSeen = queryClient.getQueryData<InfiniteData<Notification[]>>([
        'seenNotifications',
        user?.id,
      ]);

      const unseenNow =
        queryClient.getQueryData<Notification[]>([
          'unseenNotifications',
          user?.id,
        ]) ?? [];

      if (unseenNow.length > 0) {
        const nowIso = new Date().toISOString();
        const movedToSeen = unseenNow.map((notification) => ({
          ...notification,
          seen_at: nowIso,
        }));

        // Clear unseen cache
        queryClient.setQueryData(['unseenNotifications', user?.id], []);

        // Prepend to seen cache
        if (prevSeen) {
          const updated: InfiniteData<Notification[]> = {
            ...prevSeen,
            pages: [
              [...movedToSeen, ...prevSeen.pages[0]],
              ...prevSeen.pages.slice(1),
            ],
          };
          queryClient.setQueryData(['seenNotifications', user?.id], updated);
        } else {
          const initial: InfiniteData<Notification[]> = {
            pages: [movedToSeen],
            pageParams: [undefined],
          };
          queryClient.setQueryData(['seenNotifications', user?.id], initial);
        }
      }

      return { prevUnseen, prevSeen };
    },
    onError: (_error, _variables, context) => {
      if (!context) {
        return;
      }

      queryClient.setQueryData(
        ['unseenNotifications', user?.id],
        context.prevUnseen
      );

      if (context.prevSeen) {
        queryClient.setQueryData(
          ['seenNotifications', user?.id],
          context.prevSeen
        );
      }
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({
        queryKey: ['unseenNotifications', user?.id],
      });
      queryClient.invalidateQueries({
        queryKey: ['seenNotifications', user?.id],
      });

      if (Capacitor.isNativePlatform()) {
        try {
          await Badge.clear();
        } catch (error) {
          console.error('Failed to clear badge count:', error);
        }
      }
    },
  });

  return {
    markAllNotificationsAsSeen: mutateAsync,
    isMarkingSeen: isPending,
  };
};

export { useMarkAllNotificationsAsSeen };

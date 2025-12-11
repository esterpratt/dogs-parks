import { useMutation, type InfiniteData } from '@tanstack/react-query';
import { Notification } from '../../types/notification';
import { UserContext } from '../../context/UserContext';
import { useContext } from 'react';
import { markAllAsRead } from '../../services/notifications';
import { queryClient } from '../../services/react-query';

const useMarkAllNotificationsAsRead = () => {
  const { user } = useContext(UserContext);

  const { mutate } = useMutation({
    mutationFn: markAllAsRead,
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

      const nowIso = new Date().toISOString();

      queryClient.setQueryData<Notification[]>(
        ['unseenNotifications', user?.id],
        prevUnseen.map((n) => (n.read_at ? n : { ...n, read_at: nowIso }))
      );

      if (prevSeen) {
        const updated: InfiniteData<Notification[]> = {
          ...prevSeen,
          pages: prevSeen.pages.map((page) =>
            page.map((n) => (n.read_at ? n : { ...n, read_at: nowIso }))
          ),
        };
        queryClient.setQueryData(['seenNotifications', user?.id], updated);
      }

      return { prevUnseen, prevSeen };
    },
    onError: (_e, _v, ctx) => {
      if (!ctx) {
        return;
      }
      queryClient.setQueryData(
        ['unseenNotifications', user?.id],
        ctx.prevUnseen
      );
      if (ctx.prevSeen) {
        queryClient.setQueryData(['seenNotifications', user?.id], ctx.prevSeen);
      }
    },
  });

  return { markAllNotificationsAsRead: mutate };
};

export { useMarkAllNotificationsAsRead };

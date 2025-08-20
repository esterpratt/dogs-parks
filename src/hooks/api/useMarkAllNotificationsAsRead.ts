import { useMutation } from '@tanstack/react-query';
import { markAllAsRead } from '../../services/notifications';
import { queryClient } from '../../services/react-query';
import { UserContext } from '../../context/UserContext';
import { useContext } from 'react';

const useMarkAllNotificationsAsRead = () => {
  const { user } = useContext(UserContext);

  const { mutate } = useMutation({
    mutationFn: markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['unseenNotifications', user?.id],
      });
      queryClient.invalidateQueries({
        queryKey: ['seenNotifications', user?.id],
      });
    },
  });

  return { markAllNotificationsAsRead: mutate };
};

export { useMarkAllNotificationsAsRead };

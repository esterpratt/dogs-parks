import { useQuery } from '@tanstack/react-query';
import { useContext } from 'react';
import { UserContext } from '../../context/UserContext';
import { getUnseenNotifications } from '../../services/notifications';

export const useNotificationCount = () => {
  const { userId } = useContext(UserContext);

  const query = useQuery({
    queryKey: ['unseenNotifications', userId],
    queryFn: () => getUnseenNotifications(userId!),
    enabled: !!userId,
  });

  return query.data?.length || 0;
};

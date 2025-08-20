import { useQuery } from '@tanstack/react-query';
import { useContext } from 'react';
import { UserContext } from '../../context/UserContext';
import { getUnseenNotifications } from '../../services/notifications';
import { ONE_MINUTE } from '../../utils/consts';

export const useNotificationCount = () => {
  const { userId } = useContext(UserContext);

  const query = useQuery({
    queryKey: ['unseenNotifications', userId],
    queryFn: () => getUnseenNotifications(userId!),
    enabled: !!userId,
    refetchInterval: ONE_MINUTE / 2,
    refetchIntervalInBackground: false,
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  return query.data?.length || 0;
};

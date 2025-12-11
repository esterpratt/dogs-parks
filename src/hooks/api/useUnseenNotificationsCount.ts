import { useQuery } from '@tanstack/react-query';
import { useContext } from 'react';
import { UserContext } from '../../context/UserContext';
import { getUnseenNotificationsCount } from '../../services/notifications';

export const useUnseenNotificationsCount = () => {
  const { userId } = useContext(UserContext);

  const query = useQuery({
    queryKey: ['notifications', 'unseenCount', userId],
    queryFn: () => getUnseenNotificationsCount(),
    enabled: !!userId,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    staleTime: 30000,
  });

  return query.data ?? 0;
};

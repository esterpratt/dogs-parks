import { useQuery } from '@tanstack/react-query';
import { useContext } from 'react';
import { UserContext } from '../context/UserContext';
import { getUnseenNotificationCount } from '../services/notifications';
import { ONE_MINUTE } from '../utils/consts';

export const useNotificationCount = () => {
  const { userId } = useContext(UserContext);

  return useQuery({
    queryKey: ['notificationCount', userId],
    queryFn: getUnseenNotificationCount,
    enabled: !!userId,
    refetchInterval: ONE_MINUTE / 2,
    refetchIntervalInBackground: false,
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
};
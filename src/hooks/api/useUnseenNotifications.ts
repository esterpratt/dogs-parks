import { useContext } from 'react';
import { useQuery } from '@tanstack/react-query';
import { UserContext } from '../../context/UserContext';
import { getUnseenNotifications } from '../../services/notifications';

const useUnseenNotifications = () => {
  const { userId } = useContext(UserContext);

  const {
    data: unseenNotifications = [],
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ['unseenNotifications', userId],
    queryFn: () => getUnseenNotifications(userId!),
    enabled: !!userId,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });

  return {
    unseenNotifications,
    isLoading,
    isFetching,
  };
};

export { useUnseenNotifications };

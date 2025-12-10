import { useContext } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { UserContext } from '../../context/UserContext';
import { getSeenNotifications } from '../../services/notifications';
import type { Notification } from '../../types/notification';

const useSeenNotifications = () => {
  const { userId } = useContext(UserContext);

  const {
    data: historicalData,
    status: historicalStatus,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['seenNotifications', userId],
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }: { pageParam: string | undefined }) =>
      getSeenNotifications({
        userId: userId!,
        limit: 20,
        cursor: pageParam,
      }),
    getNextPageParam: (lastPage: Notification[]) => {
      if (lastPage.length < 20) {
        return undefined;
      }
      return lastPage[lastPage.length - 1].created_at;
    },
    enabled: !!userId,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });

  return {
    historicalData,
    historicalStatus,
    fetchNextPage,
    hasNextPage: !!hasNextPage,
    isFetchingNextPage,
  };
};

export { useSeenNotifications };

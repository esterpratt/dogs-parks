import { useEffect } from 'react';
import { queryClient } from '../../services/react-query';
import { fetchUsersWithDogsByIds } from '../../services/users';
import { buildFriendshipMap, getFriendIdsByStatus } from '../../utils/friendship';
import { FRIENDSHIP_STATUS, USER_ROLE } from '../../types/friendship';
import { FIVE_MINUTES } from '../../utils/consts';
import { getFriendshipMapKey } from './keys';

interface UsePrefetchFriendsWithDogsProps {
  userId: string;
  status: FRIENDSHIP_STATUS;
  enabled: boolean;
  userRole?: USER_ROLE;
}

export const usePrefetchFriendsWithDogs = ({ userId, status, enabled, userRole }: UsePrefetchFriendsWithDogsProps) => {
  useEffect(() => {
    if (!userId || !enabled) return;

    const prefetch = async () => {
      const friendshipMap = await queryClient.fetchQuery({
        queryKey: getFriendshipMapKey(userId),
        queryFn: () => buildFriendshipMap(userId!),
        staleTime: FIVE_MINUTES,
      });

      const friendIds = getFriendIdsByStatus({friendshipMap, status, userId, userRole});
      if (!friendIds.length) return;

      await queryClient.prefetchQuery({
        queryKey: ['friendsWithDogs', userId, status, userRole],
        queryFn: () => fetchUsersWithDogsByIds(friendIds),
        staleTime: FIVE_MINUTES,
      });
    };

    prefetch();
  }, [userId, status, userRole, enabled]);
};

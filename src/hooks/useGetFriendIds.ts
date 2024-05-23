import { useQuery } from '@tanstack/react-query';
import { fetchUserFriendships } from '../services/friendships';
import { FRIENDSHIP_STATUS, USER_ROLE } from '../types/friendship';

const FIVE_MINUTES = 1000 * 60 * 5;

interface UseGetFriendIdsProps {
  userId: string | null;
  userRole?: USER_ROLE;
  friendshipStatus?: FRIENDSHIP_STATUS;
  enabled?: boolean;
  additionalKey?: string;
}

const useGetFriendIds = ({
  userId,
  additionalKey = 'approved',
  enabled = true,
  userRole = USER_ROLE.ANY,
  friendshipStatus = FRIENDSHIP_STATUS.APPROVED,
}: UseGetFriendIdsProps) => {
  const { data: friendIds = [], isLoading: isLoadingFriendIds } = useQuery({
    queryKey: ['friends', userId, additionalKey, 'ids'],
    queryFn: async () => {
      const friendships = await fetchUserFriendships({
        userId: userId!,
        userRole,
        status: friendshipStatus,
      });
      if (!friendships?.length) {
        return [];
      }
      return friendships.map((friendship) => {
        if (friendship.requesteeId !== userId) {
          return friendship.requesteeId;
        }
        return friendship.requesterId;
      });
    },
    staleTime: FIVE_MINUTES,
    gcTime: FIVE_MINUTES,
    enabled: !!userId && enabled,
  });

  return { friendIds, isLoadingFriendIds };
};

export { useGetFriendIds };

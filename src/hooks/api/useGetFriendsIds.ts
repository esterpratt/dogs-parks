import { useQuery } from '@tanstack/react-query';
import { fetchUserFriendships } from '../../services/friendships';
import { FRIENDSHIP_STATUS, USER_ROLE } from '../../types/friendship';
import { FRIENDS_KEY } from './keys';

const FIVE_MINUTES = 1000 * 60 * 5;

interface UseGetFriendIdsProps {
  userId: string | null;
  userRole?: USER_ROLE;
  friendshipStatus?: FRIENDSHIP_STATUS;
  enabled?: boolean;
  additionalKey?: FRIENDS_KEY;
}

const useGetFriendsIds = ({
  userId,
  additionalKey = FRIENDS_KEY.FRIENDS,
  enabled = true,
  userRole = USER_ROLE.ANY,
  friendshipStatus = FRIENDSHIP_STATUS.APPROVED,
}: UseGetFriendIdsProps) => {
  const { data: friendsIds = [], isLoading } = useQuery({
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
        if (friendship.requestee_id !== userId) {
          return friendship.requestee_id;
        }
        return friendship.requester_id;
      });
    },
    staleTime: FIVE_MINUTES,
    gcTime: FIVE_MINUTES,
    enabled: !!userId && enabled,
  });

  return { friendsIds, isLoading };
};

export { useGetFriendsIds };

import { useQuery } from '@tanstack/react-query';
import { fetchParkCheckins } from '../services/checkins';
import { fetchUserFriendships } from '../services/friendships';
import { useContext } from 'react';
import { UserContext } from '../context/UserContext';

const FIVE_MINUTES = 1000 * 60 * 5;

const useParkVisitors = (parkId: string) => {
  const { userId } = useContext(UserContext);
  const { data: visitorIds = [], isPending: isPendingVisitors } = useQuery({
    queryKey: ['visitors', parkId],
    queryFn: async () => {
      const checkins = await fetchParkCheckins(parkId);
      return checkins ? checkins.map((checkin) => checkin.userId) : [];
    },
    staleTime: FIVE_MINUTES,
    gcTime: FIVE_MINUTES,
  });

  const { data: friendIds = [], isPending: isPendingFriends } = useQuery({
    queryKey: ['friendIds', userId],
    queryFn: async () => {
      const friendships = await fetchUserFriendships({ userId: userId! });
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
    enabled: !!userId && !!visitorIds.length,
  });

  const friendInParkIds = friendIds.filter((id) => visitorIds?.includes(id));

  return {
    visitorIds,
    friendIds,
    friendInParkIds,
    isPendingFriends,
    isPendingVisitors,
  };
};

export { useParkVisitors };

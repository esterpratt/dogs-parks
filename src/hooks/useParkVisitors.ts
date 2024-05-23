import { useQuery } from '@tanstack/react-query';
import { fetchParkCheckins } from '../services/checkins';
import { useContext } from 'react';
import { UserContext } from '../context/UserContext';
import { useGetFriendIds } from './useGetFriendIds';

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

  const { friendIds = [], isPendingFriendIds } = useGetFriendIds({
    userId,
    enabled: !!visitorIds.length,
  });

  const friendInParkIds = friendIds.filter((id) => visitorIds?.includes(id));

  return {
    visitorIds,
    friendIds,
    friendInParkIds,
    isPendingFriendIds,
    isPendingVisitors,
  };
};

export { useParkVisitors };

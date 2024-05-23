import { useMutation, useQuery } from '@tanstack/react-query';
import {
  createFriendship,
  deleteFriendship,
  fetchFriendship,
  updateFriendship,
} from '../services/friendships';
import { FRIENDSHIP_STATUS } from '../types/friendship';
import { queryClient } from '../services/react-query';

interface UseUpdateFriendshipProps {
  friendId: string;
  userId: string;
}

const useUpdateFriendship = ({
  friendId,
  userId,
}: UseUpdateFriendshipProps) => {
  const { data: friendship } = useQuery({
    queryKey: ['friendship', friendId, userId],
    queryFn: () => fetchFriendship([friendId, userId]),
  });

  const { mutate: removeFriendship } = useMutation({
    mutationFn: (friendshipId: string) => deleteFriendship(friendshipId),
    onSuccess: async () => {
      queryClient.invalidateQueries({
        queryKey: ['friends', userId, 'approved'],
      });
      queryClient.invalidateQueries({
        queryKey: ['friends', userId, 'myPendingFriends'],
      });
      queryClient.invalidateQueries({
        queryKey: ['friendship', friendId, userId],
      });
    },
  });

  const { mutate: addFriendship } = useMutation({
    mutationFn: () =>
      createFriendship({
        requesteeId: friendId,
        requesterId: userId,
      }),
    onSuccess: async () => {
      queryClient.invalidateQueries({
        queryKey: ['friends', userId, 'myPendingFriends'],
      });
      queryClient.invalidateQueries({
        queryKey: ['friendsDogs', friendId],
      });
      queryClient.invalidateQueries({
        queryKey: ['friendship', friendId, userId],
      });
    },
  });

  const { mutate: mutateFriendship } = useMutation({
    mutationFn: ({
      friendshipId,
      status,
    }: {
      friendshipId: string;
      status: FRIENDSHIP_STATUS;
    }) => updateFriendship({ friendshipId, status }),
    // todo: if i want to use optimistic update i need to pass friends and pendingFriends
    onSuccess: async () => {
      queryClient.invalidateQueries({
        queryKey: ['friends', userId, 'friends'],
      });
      queryClient.invalidateQueries({
        queryKey: ['friends', userId, 'pendingFriends'],
      });
      queryClient.invalidateQueries({
        queryKey: ['friendship', friendId, userId],
      });
    },
  });

  const onUpdateFriendship = (status: FRIENDSHIP_STATUS) => {
    if (friendship) {
      if (
        status === FRIENDSHIP_STATUS.ABORTED ||
        status === FRIENDSHIP_STATUS.REMOVED
      ) {
        removeFriendship(friendship.id);
      } else {
        mutateFriendship({ status, friendshipId: friendship.id });
      }
    } else if (status === FRIENDSHIP_STATUS.PENDING) {
      addFriendship();
    }
  };

  return { onUpdateFriendship };
};

export { useUpdateFriendship };

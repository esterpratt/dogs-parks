import { useMutation, useQuery } from '@tanstack/react-query';
import {
  createFriendship,
  deleteFriendship,
  fetchFriendship,
  updateFriendship,
} from '../../services/friendships';
import { FRIENDSHIP_STATUS } from '../../types/friendship';
import { queryClient } from '../../services/react-query';
import { FRIENDS_KEY } from './keys';

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
    queryFn: async () => {
      const friendship = await fetchFriendship([friendId, userId]);
      return friendship ? friendship : null;
    },
  });

  const { mutate: removeFriendship, isPending: isPendingRemoveFriendship } =
    useMutation({
      mutationFn: (friendshipId: string) => deleteFriendship(friendshipId),
      onSuccess: async () => {
        return Promise.all([
          queryClient.invalidateQueries({
            queryKey: ['friends', userId, FRIENDS_KEY.FRIENDS],
          }),
          queryClient.invalidateQueries({
            queryKey: ['friends', userId, FRIENDS_KEY.MY_PENDING_FRIENDS],
          }),
          queryClient.invalidateQueries({
            queryKey: ['friendship', friendId, userId],
          }),
        ]);
      },
    });

  const { mutate: addFriendship, isPending: isPendingAddFriendship } =
    useMutation({
      mutationFn: () =>
        createFriendship({
          requesteeId: friendId,
          requesterId: userId,
        }),
      onSuccess: async () => {
        return Promise.all([
          queryClient.invalidateQueries({
            queryKey: ['friends', userId, FRIENDS_KEY.MY_PENDING_FRIENDS],
          }),
          queryClient.invalidateQueries({
            queryKey: ['friendship', friendId, userId],
          }),
        ]);
      },
    });

  const { mutate: mutateFriendship, isPending: isPendingMutateFriendship } =
    useMutation({
      mutationFn: ({
        friendshipId,
        status,
      }: {
        friendshipId: string;
        status: FRIENDSHIP_STATUS;
      }) => updateFriendship({ friendshipId, status }),
      onSuccess: async () => {
        return Promise.all([
          queryClient.invalidateQueries({
            queryKey: ['friends', userId, FRIENDS_KEY.FRIENDS],
          }),
          queryClient.invalidateQueries({
            queryKey: ['friends', userId, FRIENDS_KEY.PENDING_FRIENDS],
          }),
          queryClient.invalidateQueries({
            queryKey: ['friendship', friendId, userId],
          }),
        ]);
      },
    });

  const isPending =
    isPendingRemoveFriendship ||
    isPendingAddFriendship ||
    isPendingMutateFriendship;

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

  return { onUpdateFriendship, isPending };
};

export { useUpdateFriendship };

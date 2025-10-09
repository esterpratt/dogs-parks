import { useMutation } from '@tanstack/react-query';
import {
  createFriendship,
  deleteFriendship,
  fetchFriendship,
  updateFriendship,
} from '../../services/friendships';
import {
  Friendship,
  FRIENDSHIP_STATUS,
  USER_ROLE,
} from '../../types/friendship';
import { queryClient } from '../../services/react-query';
import { useNotification } from '../../context/NotificationContext';
import { useTranslation } from 'react-i18next';

interface UseUpdateFriendshipProps {
  friendId: string;
  userId: string;
}

interface RemoveFriendshipArgs {
  friendshipId: string;
  message?: string;
}

export const useUpdateFriendship = ({
  friendId,
  userId,
}: UseUpdateFriendshipProps) => {
  const { notify } = useNotification();
  const { t } = useTranslation();

  const { mutate: removeFriendship, isPending: isPendingRemoveFriendship } =
    useMutation({
      mutationFn: ({ friendshipId }: RemoveFriendshipArgs) =>
        deleteFriendship(friendshipId),
      onMutate: async () => {
        const previous = queryClient.getQueryData(['friendshipMap', userId]);
        queryClient.setQueryData<Map<string, Friendship>>(
          ['friendshipMap', userId],
          (oldMap = new Map()) => {
            const newMap = new Map(oldMap);
            newMap.delete(friendId);
            return newMap;
          }
        );
        return { previous };
      },
      onSuccess: (_data, vars) => {
        queryClient.invalidateQueries({ queryKey: ['friendshipMap', userId] });
        queryClient.invalidateQueries({
          queryKey: ['friendsWithDogs', userId],
        });
        notify(vars.message || t('toasts.friendRequest.removed'));
      },
      onError: (_err, _vars, context) => {
        queryClient.setQueryData(['friendshipMap', userId], context?.previous);
        notify(t('toasts.generic.error'), true);
      },
    });

  const { mutate: addFriendship, isPending: isPendingAddFriendship } =
    useMutation({
      mutationFn: () =>
        createFriendship({ requesterId: userId, requesteeId: friendId }),
      onMutate: async () => {
        const previous = queryClient.getQueryData(['friendshipMap', userId]);
        queryClient.setQueryData<Map<string, Omit<Friendship, 'id'>>>(
          ['friendshipMap', userId],
          (oldMap = new Map()) => {
            const newMap = new Map(oldMap);
            newMap.set(friendId, {
              requester_id: userId,
              requestee_id: friendId,
              status: FRIENDSHIP_STATUS.PENDING,
            });
            return newMap;
          }
        );
        return { previous };
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['friendshipMap', userId] });
        queryClient.invalidateQueries({
          queryKey: [
            'friendsWithDogs',
            userId,
            FRIENDSHIP_STATUS.PENDING,
            USER_ROLE.REQUESTER,
          ],
        });
        notify(t('toasts.friendRequest.sent'));
      },
      onError: (_err, _vars, context) => {
        queryClient.setQueryData(['friendshipMap', userId], context?.previous);
        notify(t('toasts.friendRequest.fail'), true);
      },
    });

  const { mutate: mutateFriendship, isPending: isPendingMutateFriendship } =
    useMutation({
      mutationFn: ({
        friendshipId,
        status,
        updatedAt,
      }: {
        friendshipId: string;
        status: FRIENDSHIP_STATUS;
        updatedAt: string;
      }) => updateFriendship({ friendshipId, status, updatedAt }),
      onMutate: async ({ friendshipId, status }) => {
        const previous = queryClient.getQueryData(['friendshipMap', userId]);
        queryClient.setQueryData<Map<string, Friendship>>(
          ['friendshipMap', userId],
          (oldMap = new Map()) => {
            const newMap = new Map(oldMap);
            newMap.set(friendId, {
              id: friendshipId,
              requester_id: userId,
              requestee_id: friendId,
              status,
            });
            return newMap;
          }
        );
        return { previous };
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['friendshipMap', userId] });
        queryClient.invalidateQueries({
          queryKey: ['friendsWithDogs', userId],
        });
        notify(t('toasts.friendship.nowFriends'));
      },
      onError: (_err, _vars, context) => {
        queryClient.setQueryData(['friendshipMap', userId], context?.previous);
        notify(t('toasts.friendship.changed'), true);
      },
    });

  const onUpdateFriendship = async (status: FRIENDSHIP_STATUS) => {
    const friendship = await fetchFriendship([friendId, userId]);
    if (friendship) {
      if (status === FRIENDSHIP_STATUS.ABORTED) {
        removeFriendship({ friendshipId: friendship.id });
      } else if (status === FRIENDSHIP_STATUS.REMOVED) {
        removeFriendship({
          friendshipId: friendship.id,
          message: t('toasts.friendship.noLongerFriends'),
        });
      } else {
        mutateFriendship({
          status,
          friendshipId: friendship.id,
          updatedAt: friendship.updated_at,
        });
      }
    } else if (status === FRIENDSHIP_STATUS.PENDING) {
      addFriendship();
    } else {
      notify(t('toasts.friendship.changed'), true);
      queryClient.invalidateQueries({ queryKey: ['friendshipMap', userId] });
      queryClient.invalidateQueries({ queryKey: ['friendsWithDogs', userId] });
    }
  };

  return {
    onUpdateFriendship,
    isPending:
      isPendingRemoveFriendship ||
      isPendingAddFriendship ||
      isPendingMutateFriendship,
    isPendingRemoveFriendship,
    isPendingAddFriendship,
    isPendingMutateFriendship,
  };
};

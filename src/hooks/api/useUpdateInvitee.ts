import { useMutation } from '@tanstack/react-query';
import { updateInvitee } from '../../services/events';
import { ParkEventInviteeStatus } from '../../types/parkEvent';
import { queryClient } from '../../services/react-query';
import { useTranslation } from 'react-i18next';
import { useNotification } from '../../context/NotificationContext';

interface UseUpdateInviteeParams {
  userId: string;
  onSettledDecline?:
    | ((
        data: void | undefined,
        error: Error | null,
        variables: string,
        context: unknown
      ) => unknown)
    | undefined;
}

const useUpdateInvitee = (params: UseUpdateInviteeParams) => {
  const { userId, onSettledDecline } = params;
  const { t } = useTranslation();
  const { notify } = useNotification();

  const { mutate: acceptInvite, isPending: isPendingAccept } = useMutation({
    mutationFn: (eventId: string) =>
      updateInvitee({
        userId,
        eventId,
        status: ParkEventInviteeStatus.ACCEPTED,
      }),
    onError: () => {
      notify(t('event.invitee.accept.error'), true);
    },
    onSuccess: () => {
      notify(t('event.invitee.accept.success'));
      queryClient.invalidateQueries({
        queryKey: ['event-invitee', userId],
      });
      queryClient.invalidateQueries({
        queryKey: ['events', 'invited', userId],
      });
    },
  });

  const { mutate: declineInvite, isPending: isPendingDecline } = useMutation({
    mutationFn: (eventId: string) =>
      updateInvitee({
        userId,
        eventId,
        status: ParkEventInviteeStatus.DECLINED,
      }),
    onError: () => {
      notify(t('event.invitee.decline.error'), true);
    },
    onSuccess: () => {
      notify(t('event.invitee.decline.success'));
      queryClient.invalidateQueries({
        queryKey: ['event-invitee', userId],
      });
      queryClient.invalidateQueries({
        queryKey: ['events', 'invited', userId],
      });
    },
    onSettled: onSettledDecline,
  });

  const handleUpdateInvitee = ({
    eventId,
    status,
  }: {
    eventId: string;
    status: ParkEventInviteeStatus;
  }) => {
    if (status === ParkEventInviteeStatus.ACCEPTED) {
      acceptInvite(eventId);
    } else if (status === ParkEventInviteeStatus.DECLINED) {
      declineInvite(eventId);
    }
  };

  return { handleUpdateInvitee, isPendingAccept, isPendingDecline };
};

export { useUpdateInvitee };

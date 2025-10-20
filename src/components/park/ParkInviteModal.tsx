import { useTranslation } from 'react-i18next';
import { FormModal } from '../modals/FormModal';
import { useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { createParkEvent } from '../../services/events';
import { useNotification } from '../../context/NotificationContext';
import { ParkEventVisibility } from '../../types/parkEvent';
import { useFetchFriends } from '../../hooks/api/useFetchFriends';

const OFFSET_OPTIONS = [0, 15, 30, 60];

interface ParkInviteModalProps {
  parkId?: string;
  userId: string;
  isOpen: boolean;
  onClose: () => void;
}

const ParkInviteModal = (props: ParkInviteModalProps) => {
  const { parkId, userId, isOpen, onClose } = props;
  const [invitedFriendsIds /*setInvitedFriendsIds*/] = useState([]);
  const [visibility /*setVisibility*/] = useState<ParkEventVisibility>(
    ParkEventVisibility.FRIENDS_SELECTED
  );
  const [message /*setMessage*/] = useState('');
  const [minutesOffset /*setMinutesOffset*/] = useState(OFFSET_OPTIONS[0]);

  const { t } = useTranslation();
  const { notify } = useNotification();

  const { friends } = useFetchFriends({ userId });
  const allFriendIds = useMemo(
    () => friends?.map((friend) => friend.id),
    [friends]
  );

  const { mutate: createInvite, isPending } = useMutation({
    mutationFn: () =>
      createParkEvent({
        parkId: parkId!,
        visibility,
        inviteeIds:
          visibility === ParkEventVisibility.FRIENDS_ALL
            ? allFriendIds
            : invitedFriendsIds,
        message,
        presetOffsetMinutes: minutesOffset,
      }),
    onSuccess: () => {
      // TODO: invalidate lists of user events
      notify(t('invite.messageSuccess'));
    },
    onError: () => {
      notify(t('invite.messageError'));
    },
  });

  const handleCreateEvent = () => {
    if (
      parkId &&
      (visibility === ParkEventVisibility.FRIENDS_ALL ||
        !!invitedFriendsIds.length)
    ) {
      createInvite();
    }
  };

  return (
    <FormModal
      open={isOpen}
      onClose={onClose}
      onSave={handleCreateEvent}
      saveText={t('invite.modal.buttonText')}
      disabled={!invitedFriendsIds.length || !!parkId || isPending}
      title={t('.invite.modal.title')}
    >
      <div>
        Invite friends to park:{' '}
        {friends?.map((friend) => (
          <div key={friend.id}>{friend.name}</div>
        ))}
      </div>
    </FormModal>
  );
};

export { ParkInviteModal };

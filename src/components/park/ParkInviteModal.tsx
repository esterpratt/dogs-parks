import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import classnames from 'classnames';
import { FormModal } from '../modals/FormModal';
import { createParkEvent } from '../../services/events';
import { useNotification } from '../../context/NotificationContext';
import { ParkEventVisibility } from '../../types/parkEvent';
import { User } from '../../types/user';
import { useFetchFriends } from '../../hooks/api/useFetchFriends';
import { ToggleInput } from '../inputs/ToggleInput';
import { AutoCompleteMultiSelect } from '../inputs/AutoCompleteMultiSelect';
import styles from './ParkInviteModal.module.scss';

const OFFSET_OPTIONS = [0, 15, 30, 60];

interface ParkInviteModalProps {
  parkId?: string;
  userId: string;
  isOpen: boolean;
  onClose: () => void;
}

const ParkInviteModal = (props: ParkInviteModalProps) => {
  const { parkId, userId, isOpen, onClose } = props;
  const [invitedFriends, setInvitedFriends] = useState<User[]>([]);
  const [visibility, setVisibility] = useState<ParkEventVisibility>(
    ParkEventVisibility.FRIENDS_SELECTED
  );
  const [message /*setMessage*/] = useState('');
  const [minutesOffset /*setMinutesOffset*/] = useState(OFFSET_OPTIONS[0]);

  const { t } = useTranslation();
  const { notify } = useNotification();

  const { friends } = useFetchFriends({ userId });

  const { mutate: createInvite, isPending } = useMutation({
    mutationFn: () =>
      createParkEvent({
        parkId: parkId!,
        visibility,
        inviteeIds:
          visibility === ParkEventVisibility.FRIENDS_ALL
            ? friends?.map((friend) => friend.id)
            : invitedFriends?.map((friend) => friend.id),
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
        !!invitedFriends.length)
    ) {
      createInvite();
    }
  };

  const checkIsFriendSelected = (friend: User) => {
    return (
      invitedFriends.findIndex(
        (invitedFriend) => invitedFriend.id === friend.id
      ) !== -1
    );
  };

  const handleAddFriend = (friend: User) => {
    setInvitedFriends([...invitedFriends, friend]);
  };

  const handleRemoveFriend = (removedFriend: User) => {
    const newFriends = [...invitedFriends].filter(
      (friend) => friend.id !== removedFriend.id
    );
    setInvitedFriends(newFriends);
  };

  const handleSelectFriend = (friend: User) => {
    const isFriendSelected = checkIsFriendSelected(friend);
    if (!isFriendSelected) {
      handleAddFriend(friend);
    } else {
      handleRemoveFriend(friend);
    }
  };

  const filterFriends = (friend: User, input: string) => {
    return (friend.name || '').includes(input);
  };

  return (
    <FormModal
      open={isOpen}
      onClose={onClose}
      onSave={handleCreateEvent}
      saveText={t('invite.modal.buttonText')}
      disabled={!invitedFriends.length || !!parkId || isPending}
      title={t('.invite.modal.title')}
    >
      <div className={styles.container}>
        <ToggleInput
          label={t('invite.modal.visibility.title')}
          value={visibility}
          valueOn={ParkEventVisibility.FRIENDS_ALL}
          valueOff={ParkEventVisibility.FRIENDS_SELECTED}
          onChange={(newValue) => setVisibility(newValue)}
        />
        {visibility === ParkEventVisibility.FRIENDS_SELECTED &&
          !!friends?.length && (
            <AutoCompleteMultiSelect
              selectedInputs={invitedFriends}
              items={friends}
              placeholder={t('invite.modal.friends.placeholder')}
              label={t('invite.modal.friends.label')}
              itemKeyfn={(friend) => friend.id}
              selectedItemKeyfn={(friend) => `$selected-${friend.id}`}
              onSelectItem={handleSelectFriend}
              onRemoveItem={handleRemoveFriend}
              equalityFunc={checkIsFriendSelected}
              filterFunc={filterFriends}
              selectedInputsFormatter={(friend) =>
                friend.name || 'Unnamed friend'
              }
            >
              {(friend, isChosen) => (
                <div
                  className={classnames(
                    styles.friend,
                    isChosen && styles.chosen
                  )}
                >
                  {isChosen && <span>V</span>}
                  <span>{friend.name}</span>
                </div>
              )}
            </AutoCompleteMultiSelect>
          )}
      </div>
    </FormModal>
  );
};

export { ParkInviteModal };

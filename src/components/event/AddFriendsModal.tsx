import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { User } from '../../types/user';
import { useNotification } from '../../context/NotificationContext';
import { queryClient } from '../../services/react-query';
import { addEventInvitees } from '../../services/events';
import { FormModal } from '../modals/FormModal';
import { SelectUsers } from '../SelectUsers';
import styles from './AddFriendsModal.module.scss';

interface AddFriendsModalProps {
  notInvitedFriends: User[];
  eventId: string;
  userId: string;
  open: boolean;
  onClose: () => void;
}

const AddFriendsModal = (props: AddFriendsModalProps) => {
  const { notInvitedFriends, eventId, userId, open, onClose } = props;

  const { t } = useTranslation();
  const { notify } = useNotification();

  const [addedFriends, setAddedFriends] = useState<User[]>([]);

  const { mutate: saveAddedFriends, isPending: isPendingAddFriends } =
    useMutation({
      mutationFn: () =>
        addEventInvitees({
          eventId: eventId,
          inviteeIds: addedFriends.map((friend) => friend.id),
        }),
      onError: () => {
        notify(t('event.save.error'), true);
      },
      onSuccess: () => {
        notify(t('event.save.success'));
        queryClient.invalidateQueries({
          queryKey: ['events', 'organized', userId],
        });
        queryClient.invalidateQueries({
          queryKey: ['event', eventId],
        });
      },
      onSettled: onClose,
    });

  const handleSaveEvent = () => {
    saveAddedFriends();
  };

  return (
    <FormModal
      open={open}
      onClose={onClose}
      onSave={handleSaveEvent}
      saveText={t('event.save.buttonTxt')}
      disabled={!addedFriends.length || isPendingAddFriends}
      className={styles.modalContainer}
      formContainerClassName={styles.formContainer}
      formClassName={styles.form}
    >
      <div className={styles.friendsSelectionContainer}>
        <SelectUsers
          label={t('event.addFriends')}
          users={notInvitedFriends}
          selectedUsers={addedFriends}
          setSelectedUsers={setAddedFriends}
        />
      </div>
    </FormModal>
  );
};

export { AddFriendsModal };

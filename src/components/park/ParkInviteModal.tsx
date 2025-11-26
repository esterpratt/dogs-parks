import { ChangeEvent, useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Trans, useTranslation } from 'react-i18next';
import { FormModal } from '../modals/FormModal';
import { createParkEvent } from '../../services/events';
import { useNotification } from '../../context/NotificationContext';
import { ParkEventVisibility } from '../../types/parkEvent';
import { User } from '../../types/user';
import { useFetchFriends } from '../../hooks/api/useFetchFriends';
import { ToggleInput } from '../inputs/ToggleInput';
import { TextArea } from '../inputs/TextArea';
import styles from './ParkInviteModal.module.scss';
import { RadioInputs } from '../inputs/RadioInputs';
import { queryClient } from '../../services/react-query';
import { SelectUsers } from '../SelectUsers';
import { MS_IN_MINUTE, useEventConflicts } from '../../hooks/useEventConflicts';
import { Link } from 'react-router';

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
  const [message, setMessage] = useState('');
  const { t } = useTranslation();
  const { notify } = useNotification();

  const OFFSET_OPTIONS = [
    { id: '0', value: '0', label: t('parkInvite.modal.offset.now') },
    { id: '15', value: '15', label: t('parkInvite.modal.offset.min15') },
    { id: '30', value: '30', label: t('parkInvite.modal.offset.min30') },
    { id: '60', value: '60', label: t('parkInvite.modal.offset.hour1') },
  ];

  const [minutesOffset, setMinutesOffset] = useState(OFFSET_OPTIONS[0].value);

  const { friends } = useFetchFriends({ userId });

  const { getConflictedEvents } = useEventConflicts(userId, isOpen);

  const conflictedEvents = useMemo(() => {
    return getConflictedEvents({
      startMs: Date.now() + Number(minutesOffset) * MS_IN_MINUTE,
    });
  }, [minutesOffset, getConflictedEvents]);

  console.log(conflictedEvents);

  const { mutate: createEvent, isPending } = useMutation({
    mutationFn: () =>
      createParkEvent({
        parkId: parkId!,
        visibility,
        inviteeIds:
          visibility === ParkEventVisibility.FRIENDS_ALL
            ? friends?.map((friend) => friend.id)
            : invitedFriends?.map((friend) => friend.id),
        message,
        presetOffsetMinutes: Number(minutesOffset),
      }),
    onSuccess: () => {
      notify(t('parkInvite.messageSuccess'));
      queryClient.invalidateQueries({
        queryKey: ['events', 'organized', userId],
      });
    },
    onError: () => {
      notify(t('parkInvite.messageError'));
    },
    onSettled: () => {
      onClose();
    },
  });

  const handleChangeMessage = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(event.target.value);
  };

  const handleOffsetSelect = (event: ChangeEvent<HTMLInputElement>) => {
    setMinutesOffset(event.target.value);
  };

  const handleCreateEvent = () => {
    if (
      parkId &&
      (visibility === ParkEventVisibility.FRIENDS_ALL ||
        !!invitedFriends.length)
    ) {
      createEvent();
    }
  };

  return (
    <FormModal
      open={isOpen}
      onClose={onClose}
      onSave={handleCreateEvent}
      saveText={t('parkInvite.modal.buttonText')}
      disabled={
        (!invitedFriends.length &&
          visibility === ParkEventVisibility.FRIENDS_SELECTED) ||
        !parkId ||
        isPending
      }
      title={t('parkInvite.modal.title')}
      className={styles.modal}
    >
      <form className={styles.form}>
        <div className={styles.timeSection}>
          <RadioInputs
            onOptionChange={handleOffsetSelect}
            options={OFFSET_OPTIONS}
            name="offsetOptions"
            label={t('parkInvite.modal.offset.label')}
            value={minutesOffset}
          />

          {!!conflictedEvents.length && (
            <span className={styles.conflict}>
              <Trans
                i18nKey="parkInvite.modal.conflict"
                components={{
                  eventLink: (
                    <Link
                      to={`/profile/${userId}/events`}
                      className={styles.conflictLink}
                    />
                  ),
                }}
              />
            </span>
          )}
        </div>
        <div className={styles.friendsSection}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTitle}>
              {t('parkInvite.modal.friends.title')}
            </span>
            <ToggleInput
              label={t('parkInvite.modal.visibility.title')}
              value={visibility}
              valueOn={ParkEventVisibility.FRIENDS_ALL}
              valueOff={ParkEventVisibility.FRIENDS_SELECTED}
              onChange={(newValue) => setVisibility(newValue)}
            />
          </div>
          {visibility === ParkEventVisibility.FRIENDS_SELECTED &&
            !!friends?.length && (
              <SelectUsers
                placeholder={t('parkInvite.modal.friends.placeholder')}
                label={t('parkInvite.modal.friends.label')}
                users={friends}
                selectedUsers={invitedFriends}
                setSelectedUsers={setInvitedFriends}
              />
            )}
        </div>
        <TextArea
          value={message}
          name="inviteMessage"
          label={t('parkInvite.modal.message.label')}
          onChange={handleChangeMessage}
          maxLength={200}
          className={styles.message}
        />
      </form>
    </FormModal>
  );
};

export { ParkInviteModal };

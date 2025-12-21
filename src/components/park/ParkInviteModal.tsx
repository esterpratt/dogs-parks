import { ChangeEvent, useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Trans, useTranslation } from 'react-i18next';
import classnames from 'classnames';
import { Link } from 'react-router-dom';
import { ParkEventVisibility } from '../../types/parkEvent';
import { User } from '../../types/user';
import { getConflictedEvents } from '../../utils/events';
import { ONE_MINUTE } from '../../utils/consts';
import { createParkEvent } from '../../services/events';
import { queryClient } from '../../services/react-query';
import { useNotification } from '../../context/NotificationContext';
import { useFetchFriends } from '../../hooks/api/useFetchFriends';
import { useEventSlots } from '../../hooks/useEventSlots';
import useKeyboardFix from '../../hooks/useKeyboardFix';
import { FormModal } from '../modals/FormModal';
import { ToggleInput } from '../inputs/ToggleInput';
import { TextArea } from '../inputs/TextArea';
import { RadioInputs } from '../inputs/RadioInputs';
import { SelectUsers } from '../SelectUsers';
import styles from './ParkInviteModal.module.scss';

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
  const keyboardHeight = useKeyboardFix();

  const OFFSET_OPTIONS = [
    { id: '0', value: '0', label: t('parkInvite.modal.offset.now') },
    { id: '15', value: '15', label: t('parkInvite.modal.offset.min15') },
    { id: '30', value: '30', label: t('parkInvite.modal.offset.min30') },
    { id: '60', value: '60', label: t('parkInvite.modal.offset.hour1') },
  ];

  const [minutesOffset, setMinutesOffset] = useState(OFFSET_OPTIONS[0].value);

  const { friends } = useFetchFriends({ userId });

  const normalizedForConflictEvents = useEventSlots(userId, isOpen);

  const conflictedEvents = useMemo(() => {
    if (!isOpen) {
      return;
    }

    return getConflictedEvents({
      events: normalizedForConflictEvents,
      startMs: Date.now() + Number(minutesOffset) * ONE_MINUTE,
    });
  }, [minutesOffset, normalizedForConflictEvents, isOpen]);

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
      <form
        className={classnames(styles.form, {
          [styles.extraPadding]: !!keyboardHeight,
        })}
      >
        <div className={styles.timeSection}>
          <RadioInputs
            inputClassName={styles.input}
            onOptionChange={handleOffsetSelect}
            options={OFFSET_OPTIONS}
            name="offsetOptions"
            label={t('parkInvite.modal.offset.label')}
            value={minutesOffset}
          />

          {!!conflictedEvents?.length && (
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
              variant="small"
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

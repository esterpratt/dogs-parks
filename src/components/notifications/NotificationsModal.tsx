import { useContext, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useOrientationContext } from '../../context/OrientationContext';
import { UserContext } from '../../context/UserContext';
import { FormModal } from '../modals/FormModal';
import {
  getNotificationPreferences,
  updateNotificationPreferences,
} from '../../services/notifications';
import { queryClient } from '../../services/react-query';
import { NotificationSection } from './NotificationSection';
import styles from './NotificationsModal.module.scss';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NotificationPreferences {
  friendRequests: boolean;
  friendApprovals: boolean;
  parkInvite: boolean;
  parkInviteAccept: boolean;
  parkInviteDecline: boolean;
  parkInviteCancelled: boolean;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { t } = useTranslation();
  const [muteAll, setMuteAll] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    friendRequests: true,
    friendApprovals: true,
    parkInvite: true,
    parkInviteAccept: true,
    parkInviteDecline: true,
    parkInviteCancelled: true,
  });

  const { userId } = useContext(UserContext);
  const orientation = useOrientationContext((state) => state.orientation);

  const { data: serverPreferences } = useQuery({
    queryKey: ['notification-preferences', userId],
    queryFn: () => getNotificationPreferences({ userId: userId! }),
    enabled: !!userId,
  });

  useEffect(() => {
    if (serverPreferences) {
      setMuteAll(serverPreferences.muted);
      setPreferences({
        friendRequests: serverPreferences.friend_request,
        friendApprovals: serverPreferences.friend_approval,
        parkInvite: serverPreferences.park_invite,
        parkInviteAccept: serverPreferences.park_invite_accept,
        parkInviteDecline: serverPreferences.park_invite_decline,
        parkInviteCancelled: serverPreferences.park_invite_cancelled,
      });
    }
  }, [serverPreferences]);

  const updatePreference = (
    key: keyof NotificationPreferences,
    value: boolean
  ) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const { mutate: mutateNotificationsPreferences, isPending } = useMutation({
    mutationFn: () =>
      updateNotificationPreferences({
        user_id: userId!,
        muted: muteAll,
        friend_request: preferences.friendRequests,
        friend_approval: preferences.friendApprovals,
        park_invite: preferences.parkInvite,
        park_invite_accept: preferences.parkInviteAccept,
        park_invite_decline: preferences.parkInviteDecline,
        park_invite_cancelled: preferences.parkInviteCancelled,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['notification-preferences', userId],
      });
      onClose();
    },
  });

  const onSubmit = async () => {
    mutateNotificationsPreferences();
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <FormModal
      open={isOpen}
      onClose={handleClose}
      height={orientation === 'landscape' ? 98 : null}
      onSave={onSubmit}
      className={styles.modal}
      title={t('notifications.modal.title')}
      disabled={isPending}
    >
      <form className={styles.form}>
        <div className={styles.sectionGroup}>
          <div className={styles.sectionHeader}>
            <span>{t('notifications.modal.section.general')}</span>
          </div>
          <div className={styles.sectionContainer}>
            <NotificationSection
              title={t('notifications.modal.mute.title')}
              description={t('notifications.modal.mute.description')}
              value={muteAll}
              onChange={(value) => setMuteAll(value)}
              isLast={true}
              isMute={true}
            />
          </div>
        </div>
        {!muteAll && (
          <div className={styles.sectionGroup}>
            <div className={styles.sectionHeader}>
              <span>{t('notifications.modal.section.types')}</span>
            </div>
            <div className={styles.sectionContainer}>
              <NotificationSection
                title={t('notifications.modal.types.friendRequests.title')}
                description={t(
                  'notifications.modal.types.friendRequests.description'
                )}
                value={preferences.friendRequests}
                onChange={(value) => updatePreference('friendRequests', value)}
              />
              <NotificationSection
                title={t('notifications.modal.types.friendApprovals.title')}
                description={t(
                  'notifications.modal.types.friendApprovals.description'
                )}
                value={preferences.friendApprovals}
                onChange={(value) => updatePreference('friendApprovals', value)}
              />
              <NotificationSection
                title={t('notifications.modal.types.parkInvite.title')}
                description={t(
                  'notifications.modal.types.parkInvite.description'
                )}
                value={preferences.parkInvite}
                onChange={(value) => updatePreference('parkInvite', value)}
              />
              <NotificationSection
                title={t('notifications.modal.types.parkInviteAccept.title')}
                description={t(
                  'notifications.modal.types.parkInviteAccept.description'
                )}
                value={preferences.parkInviteAccept}
                onChange={(value) =>
                  updatePreference('parkInviteAccept', value)
                }
              />
              <NotificationSection
                title={t('notifications.modal.types.parkInviteDecline.title')}
                description={t(
                  'notifications.modal.types.parkInviteDecline.description'
                )}
                value={preferences.parkInviteDecline}
                onChange={(value) =>
                  updatePreference('parkInviteDecline', value)
                }
              />
              <NotificationSection
                title={t('notifications.modal.types.parkInviteCancelled.title')}
                description={t(
                  'notifications.modal.types.parkInviteCancelled.description'
                )}
                value={preferences.parkInviteCancelled}
                onChange={(value) =>
                  updatePreference('parkInviteCancelled', value)
                }
                isLast={true}
              />
            </div>
          </div>
        )}
      </form>
    </FormModal>
  );
};

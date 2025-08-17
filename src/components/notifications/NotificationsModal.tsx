import { useContext, useState, useEffect } from 'react';
import { Bell, BellOff } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ToggleInput } from '../inputs/ToggleInput';
import { useOrientationContext } from '../../context/OrientationContext';
import { UserContext } from '../../context/UserContext';
import { FormModal } from '../modals/FormModal';
import {
  getNotificationPreferences,
  updateNotificationPreferences,
} from '../../services/notifications';
import { queryClient } from '../../services/react-query';
import styles from './NotificationsModal.module.scss';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NotificationPreferences {
  friendRequests: boolean;
  friendApprovals: boolean;
}

interface NotificationSectionProps {
  title: string;
  description: string;
  value: boolean;
  onChange: (value: boolean) => void;
  isLast?: boolean;
}

const NotificationSection: React.FC<NotificationSectionProps> = ({
  title,
  description,
  value,
  onChange,
  isLast = false,
}) => {
  return (
    <div
      className={`${styles.settingItem} ${
        isLast ? styles.settingItemLast : ''
      }`}
    >
      <div className={styles.settingInfo}>
        <div className={styles.settingDetails}>
          <span className={styles.settingLabel}>{title}</span>
          <span className={styles.settingDescription}>{description}</span>
        </div>
      </div>
      <ToggleInput
        label=""
        value={value}
        valueOn={true}
        valueOff={false}
        onChange={onChange}
        iconOn={<Bell size={16} />}
        iconOff={<BellOff size={16} />}
      />
    </div>
  );
};

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [muteAll, setMuteAll] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    friendRequests: true,
    friendApprovals: true,
  });

  const { user } = useContext(UserContext);
  const orientation = useOrientationContext((state) => state.orientation);

  const { data: serverPreferences } = useQuery({
    queryKey: ['notification-preferences', user?.id],
    queryFn: () => getNotificationPreferences({ userId: user!.id }),
    enabled: !!user,
  });

  useEffect(() => {
    if (serverPreferences) {
      setMuteAll(serverPreferences.muted);
      setPreferences({
        friendRequests: serverPreferences.friend_request,
        friendApprovals: serverPreferences.friend_approval,
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
        user_id: user!.id,
        muted: muteAll,
        friend_request: preferences.friendRequests,
        friend_approval: preferences.friendApprovals,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['notification-preferences', user?.id],
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
      title="Update your notifications"
      disabled={isPending}
    >
      <form className={styles.form}>
        <div className={styles.sectionGroup}>
          <div className={styles.sectionHeader}>
            <span>General</span>
          </div>
          <div className={styles.sectionContainer}>
            <div className={`${styles.settingItem} ${styles.settingItemLast}`}>
              <div className={styles.settingInfo}>
                <div className={styles.settingDetails}>
                  <span className={styles.settingLabel}>
                    Mute notifications
                  </span>
                  <span className={styles.settingDescription}>
                    Turn off all notifications
                  </span>
                </div>
              </div>
              <ToggleInput
                label=""
                value={muteAll}
                valueOn={true}
                valueOff={false}
                onChange={(value) => setMuteAll(value)}
              />
            </div>
          </div>
        </div>
        {!muteAll && (
          <div className={styles.sectionGroup}>
            <div className={styles.sectionHeader}>
              <span>Notification Types</span>
            </div>
            <div className={styles.sectionContainer}>
              <NotificationSection
                title="Friend requests"
                description="Get notified when someone wants to be friends"
                value={preferences.friendRequests}
                onChange={(value) => updatePreference('friendRequests', value)}
              />
              <NotificationSection
                title="Friend approvals"
                description="Get notified when your friend requests are accepted"
                value={preferences.friendApprovals}
                onChange={(value) => updatePreference('friendApprovals', value)}
                isLast={true}
              />
            </div>
          </div>
        )}
      </form>
    </FormModal>
  );
};

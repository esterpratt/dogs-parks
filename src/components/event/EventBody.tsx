import { useTranslation } from 'react-i18next';
import { InviteesList } from './InviteesList';
import { User } from '../../types/user';
import { ReactNode } from 'react';
import styles from './EventBody.module.scss';

interface EventBodyProps {
  message?: string;
  goingFriends: User[];
  invitedFriends: User[];
  friendsSelection?: ReactNode;
  title?: string | null;
  organizedBy?: string;
}

const EventBody = (props: EventBodyProps) => {
  const {
    message,
    goingFriends,
    invitedFriends,
    friendsSelection,
    title,
    organizedBy,
  } = props;

  const { t } = useTranslation();

  return (
    <div className={styles.container}>
      {!!title && <span className={styles.title}>{title}</span>}
      {!!organizedBy && <span>{organizedBy}</span>}
      {!goingFriends.length && !invitedFriends.length ? (
        <span>{t('event.noInvitees')}</span>
      ) : (
        <div>
          {!!goingFriends.length && (
            <InviteesList
              users={goingFriends}
              title={t('event.invitees.going')}
            />
          )}
          {!!invitedFriends.length && (
            <InviteesList
              users={invitedFriends}
              title={t('event.invitees.invited')}
            />
          )}
        </div>
      )}
      {!!friendsSelection && (
        <div className={styles.friendsSelectionContainer}>
          {friendsSelection}
        </div>
      )}
      {!!message && (
        <div>
          <span>More details:</span>
          <span>{message}</span>
        </div>
      )}
    </div>
  );
};

export { EventBody };

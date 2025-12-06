import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Clock, User as UserIcon, MessageCircle } from 'lucide-react';
import { User } from '../../types/user';
import { useDateUtils } from '../../hooks/useDateUtils';
import { Section } from '../section/Section';
import { Button } from '../Button';
import { InviteesList } from './InviteesList';
import styles from './EventBody.module.scss';

interface DetailsAttributes {
  key: string;
  icon: ReactNode;
  label: string;
  content: ReactNode;
}

interface EventBodyProps {
  message?: string;
  messageTitle?: string;
  startAt: string;
  isEventEnded: boolean;
  goingFriends: User[];
  invitedFriends: User[];
  notGoingFriends?: User[];
  isLoadingFriends: boolean;
  friendsSelection?: ReactNode;
  organizedBy?: string | ReactNode;
  onClickFriendsAddition?: (() => void) | null;
}

const EventBody = (props: EventBodyProps) => {
  const {
    message,
    messageTitle,
    goingFriends,
    invitedFriends,
    notGoingFriends,
    organizedBy,
    startAt,
    isEventEnded,
    onClickFriendsAddition,
    isLoadingFriends,
  } = props;

  const { t } = useTranslation();
  const { formatFutureCalendar } = useDateUtils();
  const startTime = formatFutureCalendar(startAt);

  const timeDisplay = isEventEnded ? t('event.ended') : startTime;

  const generalDetails = [
    organizedBy
      ? {
          key: 'organizedBy',
          icon: <UserIcon size={24} />,
          label: t('event.organizedBy'),
          content: organizedBy,
        }
      : null,
    {
      key: 'time',
      icon: <Clock size={24} />,
      label: t('event.time'),
      content: timeDisplay,
    },
  ].filter(Boolean) as DetailsAttributes[];

  return (
    <div className={styles.container}>
      <Section
        title={t('event.general')}
        contentCmp={
          <div className={styles.generalContent}>
            {generalDetails.map(({ key, icon, label, content }) => (
              <div key={key} className={styles.infoRow}>
                <div className={styles.iconWrapper}>{icon}</div>
                <div className={styles.textContainer}>
                  <div className={styles.infoLabel}>{label}</div>
                  <div
                    className={`${styles.infoContent} ${
                      key === 'organizedBy' ? styles.organizerName : ''
                    }`}
                  >
                    {content}
                  </div>
                </div>
              </div>
            ))}
          </div>
        }
      />
      <Section
        actions={
          onClickFriendsAddition && (
            <Button
              variant="simple"
              color={styles.white}
              onClick={onClickFriendsAddition}
            >
              <Plus size={24} />
            </Button>
          )
        }
        title={t('event.friends')}
        contentCmp={
          !isLoadingFriends && (
            <div className={styles.friendsContent}>
              {!goingFriends.length &&
              !invitedFriends.length &&
              !notGoingFriends?.length ? (
                <span className={styles.noInvitees}>
                  {t('event.noInvitees')}
                </span>
              ) : (
                <div className={styles.inviteesContainer}>
                  {!!goingFriends.length && (
                    <InviteesList
                      users={goingFriends}
                      title={t('event.invitees.going')}
                      variant="going"
                    />
                  )}
                  {!!invitedFriends.length && (
                    <InviteesList
                      users={invitedFriends}
                      title={t('event.invitees.invited')}
                      variant="invited"
                    />
                  )}
                  {!!notGoingFriends?.length && (
                    <InviteesList
                      users={notGoingFriends}
                      title={t('event.invitees.declined')}
                      variant="declined"
                    />
                  )}
                </div>
              )}
            </div>
          )
        }
      />
      {!!message && (
        <Section
          title={t('event.extra')}
          contentCmp={
            <div className={styles.messageCard}>
              <div className={styles.messageTitleContainer}>
                <MessageCircle size={12} className={styles.messageTitleIcon} />
                <span className={styles.messageTitle}>{messageTitle}</span>
              </div>
              <p dir="auto" className={styles.messageContent}>
                {message}
              </p>
            </div>
          }
        />
      )}
    </div>
  );
};

export { EventBody };

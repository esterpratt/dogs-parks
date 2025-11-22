import { useTranslation } from 'react-i18next';
import { InviteesList } from './InviteesList';
import { User } from '../../types/user';
import { ReactNode } from 'react';
import styles from './EventBody.module.scss';
import { useDateUtils } from '../../hooks/useDateUtils';
import { Section } from '../section/Section';
import { Plus } from 'lucide-react';
import { Button } from '../Button';

interface EventBodyProps {
  message?: string;
  startAt: string;
  goingFriends: User[];
  invitedFriends: User[];
  friendsSelection?: ReactNode;
  organizedBy?: string;
  onClickFriendsAddition?: () => void;
}

const EventBody = (props: EventBodyProps) => {
  const {
    message,
    goingFriends,
    invitedFriends,
    organizedBy,
    startAt,
    onClickFriendsAddition,
  } = props;

  const { t } = useTranslation();
  const { formatFutureCalendar } = useDateUtils();
  const startTime = formatFutureCalendar(startAt);

  return (
    <div className={styles.container}>
      <Section
        title={t('event.general')}
        contentCmp={
          <div>
            {!!organizedBy && <span>{organizedBy}</span>}
            <div>
              <span>{t('event.time')}</span>
              <span>{startTime}</span>
            </div>
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
          <div>
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
          </div>
        }
      />
      {!!message && (
        <Section
          title={t('event.extra')}
          contentCmp={
            <div>
              <span>{message}</span>
            </div>
          }
        />
      )}
    </div>
  );
};

export { EventBody };

import { useTranslation } from 'react-i18next';
import { useOutletContext } from 'react-router';
import { CalendarHeart } from 'lucide-react';
import { User } from '../types/user';
import {
  ParkEventBase,
  ParkEventInvite,
  ParkEventStatus,
} from '../types/parkEvent';
import { useParkNamesMap } from '../hooks/useParkNameMap';
import { Loader } from '../components/Loader';
import { EventPreview } from '../components/event/EventPreview';
import { EventInviteePreview } from '../components/event/EventInviteePreview';
import styles from './UserEvents.module.scss';
import { useUserInvitedEvents } from '../hooks/api/useUserInvitedEvents';
import { useUserOrganizedEvents } from '../hooks/api/useUserOrganizedEvents';

const UserEvents = () => {
  const { t } = useTranslation();
  const { user } = useOutletContext() as { user: User };

  const { invitedEvents, isLoadingInvitedEvents } = useUserInvitedEvents(
    user.id
  );
  const { organizedEvents, isLoadingOrganizedEvents } = useUserOrganizedEvents(
    user.id
  );

  const { parkNamesMap, isLoading: isLoadingParks } = useParkNamesMap();

  if (isLoadingOrganizedEvents || isLoadingInvitedEvents || isLoadingParks) {
    return <Loader inside className={styles.loader} />;
  }

  return (
    <div className={styles.container}>
      <div className={styles.title}>
        <CalendarHeart className={styles.titleIcon} size={20} />
        <span>{t('userEvents.upcomingEvents')}</span>
      </div>
      {!!organizedEvents?.length && (
        <div className={styles.eventsContainer}>
          <div className={styles.subtitle}>
            {t('userEvents.organizedEvents')}
          </div>
          {organizedEvents.map((event: ParkEventBase) => (
            <EventPreview
              isCancelled={event.status === ParkEventStatus.CANCELED}
              cancelledMessage={t('event.cancelled')}
              key={event.id}
              event={event}
              parkName={parkNamesMap?.[event.park_id] || ''}
            />
          ))}
        </div>
      )}
      {!!invitedEvents?.length && (
        <div className={styles.eventsContainer}>
          <div className={styles.subtitle}>{t('userEvents.invitedEvents')}</div>
          {invitedEvents.map((event: ParkEventInvite) => (
            <EventInviteePreview
              key={event.id}
              event={event}
              parkName={parkNamesMap?.[event.park_id] || ''}
              userId={user.id}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default UserEvents;

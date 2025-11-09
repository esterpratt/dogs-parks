import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import styles from './UserEvents.module.scss';
import { useOutletContext } from 'react-router';
import { User } from '../types/user';
import {
  fetchUserInvitedEvents,
  fetchUserOrganizedEvents,
} from '../services/events';
import { useDelayedLoading } from '../hooks/useDelayedLoading';
import { Loader } from '../components/Loader';
import { EventPreview } from '../components/event/EventPreview';
import {
  ParkEventBase,
  ParkEventInvite,
  ParkEventInviteeStatus,
  ParkEventStatus,
} from '../types/parkEvent';
import { useParkNamesMap } from '../hooks/useParkNameMap';

const UserEvents = () => {
  const { t } = useTranslation();
  const { user } = useOutletContext() as { user: User };

  const { data: organizedEvents, isLoading: isLoadingOrganizedEvents } =
    useQuery({
      queryKey: ['events', 'organized', user.id],
      queryFn: fetchUserOrganizedEvents,
    });

  const { data: invitedEvents, isLoading: isLoadingInvitedEvents } = useQuery({
    queryKey: ['events', 'invited', user.id],
    queryFn: fetchUserInvitedEvents,
  });

  const { parkNamesMap, isLoading: isLoadingParks } = useParkNamesMap();

  const isLoading =
    isLoadingOrganizedEvents || isLoadingInvitedEvents || isLoadingParks;

  const { showLoader } = useDelayedLoading({
    isLoading,
    minDuration: 750,
  });

  if (showLoader) {
    return <Loader inside className={styles.loader} />;
  }

  return (
    <>
      <div className={styles.container}>
        <span className={styles.title}>{t('userEvents.upcomingEvents')}</span>
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
            <div className={styles.subtitle}>
              {t('userEvents.invitedEvents')}
            </div>
            {invitedEvents.map((event: ParkEventInvite) => (
              <EventPreview
                isCancelled={
                  event.my_invite_status === ParkEventInviteeStatus.DECLINED
                }
                cancelledMessage={t('event.declined')}
                key={event.id}
                event={event}
                parkName={parkNamesMap?.[event.park_id] || ''}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default UserEvents;

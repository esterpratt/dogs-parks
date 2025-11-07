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
import { EventPreview } from '../components/EventPreview';
import { ParkEventBase, ParkEventInvite } from '../types/parkEvent';
import { useAppLocale } from '../hooks/useAppLocale';
import { parksKey } from '../hooks/api/keys';
import { fetchParksJSON } from '../services/parks';
import { useMemo } from 'react';
import { buildParkNameMap } from '../utils/parkNamesMap';

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

  const currentLanguage = useAppLocale();

  const { data: parks } = useQuery({
    queryKey: parksKey(currentLanguage),
    queryFn: () => fetchParksJSON({ language: currentLanguage }),
    placeholderData: (previous) => previous,
    retry: 0,
  });

  const parkNamesMap = useMemo(() => {
    if (!parks) {
      return null;
    }
    return buildParkNameMap(parks);
  }, [parks]);

  const isLoading = isLoadingOrganizedEvents || isLoadingInvitedEvents;

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
                key={event.event_id}
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
                key={event.event_id}
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

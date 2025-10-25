// import { useTranslation } from 'react-i18next';
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

const UserEvents = () => {
  // const { t } = useTranslation();
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
        User future events - organized and invited
      </div>
    </>
  );
};

export default UserEvents;

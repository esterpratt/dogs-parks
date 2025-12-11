import { useContext } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useUserInvitedEvents } from '../../hooks/api/useUserInvitedEvents';
import { useUserOrganizedEvents } from '../../hooks/api/useUserOrganizedEvents';
import { UserContext } from '../../context/UserContext';
import { fetchUserReviews } from '../../services/reviews';
import { TabsList } from '../tabs/TabsList';
import styles from './ProfileTabs.module.scss';

const ProfileTabs = () => {
  const { userId } = useContext(UserContext);
  const { t } = useTranslation();

  const { data: reviews } = useQuery({
    queryKey: ['reviews', userId],
    queryFn: () => fetchUserReviews(userId!),
  });

  const { invitedEvents } = useUserInvitedEvents(userId);
  const { organizedEvents } = useUserOrganizedEvents(userId);

  return (
    <TabsList
      className={styles.tabs}
      tabs={[
        { text: t('profile.tabs.dogs'), url: 'dogs', end: false },
        {
          text: t('profile.tabs.friends'),
          url: 'friends',
        },
        {
          text: t('profile.tabs.events'),
          url: 'events',
          disabled: !organizedEvents?.length && !invitedEvents?.length,
        },
        {
          text: t('profile.tabs.favorites'),
          url: 'favorites',
        },
        {
          text: t('profile.tabs.reviews'),
          url: 'reviews',
          disabled: !reviews?.length,
        },
      ]}
    />
  );
};

export { ProfileTabs };

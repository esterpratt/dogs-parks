import { useContext } from 'react';
import { Tabs } from '../tabs/Tabs';
import styles from './ProfileTabs.module.scss';
import { useQuery } from '@tanstack/react-query';
import { UserContext } from '../../context/UserContext';
import { fetchUserReviews } from '../../services/reviews';

const ProfileTabs = () => {
  const { userId } = useContext(UserContext);
  const { data: reviews = [] } = useQuery({
    queryKey: ['reviews', userId],
    queryFn: () => fetchUserReviews(userId!),
  });

  return (
    <Tabs
      className={styles.tabs}
      tabs={[
        { text: 'Dogs', url: 'dogs', end: false },
        {
          text: 'Friends',
          url: 'friends',
        },
        {
          text: 'Favorites',
          url: 'favorites',
        },
        {
          text: 'Reviews',
          url: 'reviews',
          disabled: !reviews.length,
        },
        {
          text: 'Settings',
          url: 'info',
        },
      ]}
    />
  );
};

export { ProfileTabs };

import { useContext } from 'react';
import { useQuery } from '@tanstack/react-query';
import styles from './ProfileTabs.module.scss';
import { UserContext } from '../../context/UserContext';
import { fetchUserReviews } from '../../services/reviews';
import { TabsList } from '../tabs/TabsList';

const ProfileTabs = () => {
  const { userId } = useContext(UserContext);
  const { data: reviews } = useQuery({
    queryKey: ['reviews', userId],
    queryFn: () => fetchUserReviews(userId!),
  });

  return (
    <TabsList
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
          disabled: !reviews?.length,
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

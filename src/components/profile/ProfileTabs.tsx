import { useContext } from 'react';
import { Tabs } from '../Tabs/Tabs';
import { UserReviewsContext } from '../../context/UserReviewsContext';
import styles from './ProfileTabs.module.scss';

const ProfileTabs = () => {
  const { reviews } = useContext(UserReviewsContext);

  return (
    <Tabs
      className={styles.tabs}
      tabs={[
        { text: 'Dogs', url: '', end: false },
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

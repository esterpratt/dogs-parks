import { useContext } from 'react';
import { Tabs } from '../Tabs/Tabs';
import { UserFriendsContext } from '../../context/UserFriendsContext';
import { UserReviewsContext } from '../../context/UserReviewsContext';
import styles from './ProfileTabs.module.scss';

const ProfileTabs = () => {
  const { friends, pendingFriends } = useContext(UserFriendsContext);
  const { reviews } = useContext(UserReviewsContext);

  return (
    <Tabs
      className={styles.tabs}
      tabs={[
        { text: 'Dogs', url: '', end: false },
        {
          text: 'Friends',
          url: 'friends',
          disabled: !friends.length && !pendingFriends.length,
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

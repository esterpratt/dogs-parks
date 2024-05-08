import { useContext } from 'react';
import { Tabs } from '../Tabs/Tabs';
import { UserFriendsContext } from '../../context/UserFriendsContext';
import { UserReviewsContext } from '../../context/UserReviewsContext';

const ProfileTabs = () => {
  const { friends, pendingFriends } = useContext(UserFriendsContext);
  const { reviews } = useContext(UserReviewsContext);
  return (
    <Tabs
      tabs={[
        { text: 'Info', url: '' },
        {
          text: 'Friends',
          url: 'friends',
          disabled: !friends.length && !pendingFriends.length,
        },
        {
          text: 'My Reviews',
          url: 'reviews',
          disabled: !reviews.length,
        },
      ]}
    />
  );
};

export { ProfileTabs };

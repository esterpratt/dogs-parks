import { useContext } from 'react';
import { Tabs } from '../Tabs/Tabs';
import { UserFriendsContext } from '../../context/UserFriendsContext';

const ProfileTabs = () => {
  const { friends, pendingFriends } = useContext(UserFriendsContext);
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
        },
      ]}
    />
  );
};

export { ProfileTabs };

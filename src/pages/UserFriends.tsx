import { useContext } from 'react';
import { UserFriendsContext } from '../context/UserFriendsContext';
import { UserPreview } from '../components/users/UserPreview';

const UserFriends = () => {
  const { friends, pendingFriends } = useContext(UserFriendsContext);

  return (
    <div>
      {!!pendingFriends.length && (
        <div>
          <div>Wants to be my friends:</div>
          {pendingFriends.map((friend) => {
            return <UserPreview key={friend.id} user={friend} />;
          })}
        </div>
      )}
      {!!friends.length && (
        <div>
          <div>My Friends</div>
          {friends.map((friend) => {
            return <UserPreview key={friend.id} user={friend} />;
          })}
        </div>
      )}
    </div>
  );
};

export { UserFriends };

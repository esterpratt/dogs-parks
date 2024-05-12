import { useContext } from 'react';
import { UserFriendsContext } from '../context/UserFriendsContext';
import { UserPreview } from '../components/users/UserPreview';

const UserFriends = () => {
  const { friends, pendingFriends, myPendingFriends } =
    useContext(UserFriendsContext);

  return (
    <div>
      {!!pendingFriends.length && (
        <div>
          <div>Want to be my friends</div>
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
      {!!myPendingFriends.length && (
        <div>
          <div>Waiting for their Responses</div>
          {myPendingFriends.map((friend) => {
            return <UserPreview key={friend.id} user={friend} />;
          })}
        </div>
      )}
    </div>
  );
};

export { UserFriends };

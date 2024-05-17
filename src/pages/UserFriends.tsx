import { useContext } from 'react';
import { UserFriendsContext } from '../context/UserFriendsContext';
import { UserPreview } from '../components/users/UserPreview';
import styles from './UserFriends.module.scss';

const UserFriends = () => {
  const { friends, pendingFriends, myPendingFriends } =
    useContext(UserFriendsContext);

  return (
    <div className={styles.container}>
      {!!friends.length && (
        <div className={styles.friendsContainer}>
          <div className={styles.title}>My Friends</div>
          {friends.map((friend) => {
            return <UserPreview key={friend.id} user={friend} />;
          })}
        </div>
      )}
      {!!pendingFriends.length && (
        <div className={styles.friendsContainer}>
          <div className={styles.title}>Want to be my friends</div>
          {pendingFriends.map((friend) => {
            return <UserPreview key={friend.id} user={friend} />;
          })}
        </div>
      )}
      {!!myPendingFriends.length && (
        <div className={styles.friendsContainer}>
          <div className={styles.title}>Waiting for their Responses</div>
          {myPendingFriends.map((friend) => {
            return <UserPreview key={friend.id} user={friend} />;
          })}
        </div>
      )}
    </div>
  );
};

export default UserFriends;

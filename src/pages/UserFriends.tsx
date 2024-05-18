import { useContext } from 'react';
import { Link } from 'react-router-dom';
import classnames from 'classnames';
import { UserFriendsContext } from '../context/UserFriendsContext';
import { UserPreview } from '../components/users/UserPreview';
import styles from './UserFriends.module.scss';

const UserFriends = () => {
  const { friends, pendingFriends, myPendingFriends } =
    useContext(UserFriendsContext);

  if (!friends.length && !pendingFriends.length && !myPendingFriends.length) {
    return (
      <div className={classnames(styles.container, styles.noFriends)}>
        <span>You don't have friends yet</span>
        <Link to="/users" className={styles.link}>
          Search for friends
        </Link>
      </div>
    );
  }
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

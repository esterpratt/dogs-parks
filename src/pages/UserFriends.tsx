import { Link, useOutletContext } from 'react-router-dom';
import classnames from 'classnames';
import { UserPreview } from '../components/users/UserPreview';
import styles from './UserFriends.module.scss';
import { User } from '../types/user';
import { useGetFriendsWithDogs } from '../hooks/useGetFriendsWithDogs';
import { Loading } from '../components/Loading';
import { useGetUserFriends } from '../hooks/useGetUserFriends';

const UserFriends = () => {
  const { user } = useOutletContext() as { user: User };

  const {
    isLoadingIds,
    isLoadingUsers,
    friendIds,
    pendingFriendIds,
    myPendingFriendIds,
    friends,
    pendingFriends,
    myPendingFriends,
  } = useGetUserFriends(user.id);

  const { friendsWithDogs = [], isLoading: isLoadingFriendsDogs } =
    useGetFriendsWithDogs({
      additionalQueryKey: friendIds,
      friendIds,
      friendsToMap: friends,
      enabled: !!friends.length,
    });

  const {
    friendsWithDogs: pendingFriendsWithDogs = [],
    isLoading: isLoadingPendingFriendsDogs,
  } = useGetFriendsWithDogs({
    additionalQueryKey: pendingFriendIds,
    friendIds: pendingFriendIds,
    friendsToMap: pendingFriends,
    enabled: !!pendingFriends.length,
  });

  const {
    friendsWithDogs: myPendingFriendsWithDogs = [],
    isLoading: isLoadingMyPendingFriendsDogs,
  } = useGetFriendsWithDogs({
    additionalQueryKey: myPendingFriendIds,
    friendIds: myPendingFriendIds,
    friendsToMap: myPendingFriends,
    enabled: !!myPendingFriends.length,
  });

  const isLoadingFriendsWithDogs =
    isLoadingFriendsDogs ||
    isLoadingPendingFriendsDogs ||
    isLoadingMyPendingFriendsDogs;

  if (isLoadingIds || isLoadingUsers || isLoadingFriendsWithDogs) {
    return <Loading />;
  }

  if (
    !friendsWithDogs.length &&
    !pendingFriendsWithDogs.length &&
    !myPendingFriendsWithDogs.length
  ) {
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
      {!!friendsWithDogs.length && (
        <div className={styles.friendsContainer}>
          <div className={styles.title}>My Friends</div>
          {friendsWithDogs.map((friend) => {
            return <UserPreview key={friend.id} user={friend} />;
          })}
        </div>
      )}
      {!!pendingFriendsWithDogs.length && (
        <div className={styles.friendsContainer}>
          <div className={styles.title}>Want to be my friends</div>
          {pendingFriendsWithDogs.map((friend) => {
            return <UserPreview key={friend.id} user={friend} />;
          })}
        </div>
      )}
      {!!myPendingFriendsWithDogs.length && (
        <div className={styles.friendsContainer}>
          <div className={styles.title}>Waiting for their Responses</div>
          {myPendingFriendsWithDogs.map((friend) => {
            return <UserPreview key={friend.id} user={friend} />;
          })}
        </div>
      )}
    </div>
  );
};

export default UserFriends;

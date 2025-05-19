import { Link, useOutletContext } from 'react-router-dom';
import { UserPreview } from '../components/users/UserPreview';
import { User } from '../types/user';
import { Loader } from '../components/Loader';
import { FRIENDSHIP_STATUS, USER_ROLE } from '../types/friendship';
import styles from './UserFriends.module.scss';
import { queryClient } from '../services/react-query';
import { useEffect } from 'react';
import { useFetchFriendsWithDogs } from '../hooks/api/useFetchFriendsWithDogs';

const UserFriends = () => {
  const { user } = useOutletContext() as { user: User };

  const { friendsWithDogs: friends, isLoading: isLoadingFriends } =
    useFetchFriendsWithDogs({
      userId: user.id,
      status: FRIENDSHIP_STATUS.APPROVED,
    });

  const {
    friendsWithDogs: pendingFriends,
    isLoading: isLoadingPendingFriends,
  } = useFetchFriendsWithDogs({
    userId: user.id,
    status: FRIENDSHIP_STATUS.PENDING,
    userRole: USER_ROLE.REQUESTEE,
  });

  const {
    friendsWithDogs: myPendingFriends,
    isLoading: isLoadingMyPendingFriends,
  } = useFetchFriendsWithDogs({
    userId: user.id,
    status: FRIENDSHIP_STATUS.PENDING,
    userRole: USER_ROLE.REQUESTER,
  });

  const isLoading =
    isLoadingFriends || isLoadingPendingFriends || isLoadingMyPendingFriends;

  useEffect(() => {
    if (isLoading) return;

    [
      ...(friends ?? []),
      ...(pendingFriends ?? []),
      ...(myPendingFriends ?? []),
    ].forEach((friend) => {
      const { dogs, ...userWithoutDogs } = friend;
      queryClient.setQueryData(['user', friend.id], userWithoutDogs);
      queryClient.setQueryData(['dogs', friend.id], dogs ?? []);
    });
  }, [friends, pendingFriends, myPendingFriends, isLoading]);

  if (isLoading) {
    return <Loader className={styles.loader} inside />;
  }

  if (
    !isLoading &&
    !friends?.length &&
    !pendingFriends?.length &&
    !myPendingFriends?.length
  ) {
    return (
      <div className={styles.noFriends}>
        <div>No friends yet.</div>
        <div>
          Sniff out some friends{' '}
          <Link to="/users" className={styles.link}>
            here!
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {!!friends?.length && (
        <div className={styles.friendsContainer}>
          <div className={styles.title}>My friends</div>
          {friends.map((friend) => {
            return <UserPreview key={friend.id} user={friend} />;
          })}
        </div>
      )}
      {!!pendingFriends?.length && (
        <div className={styles.friendsContainer}>
          <div className={styles.title}>Friend requests</div>
          {pendingFriends.map((friend) => {
            return (
              <UserPreview key={friend.id} user={friend} showFriendshipButton />
            );
          })}
        </div>
      )}
      {!!myPendingFriends?.length && (
        <div className={styles.friendsContainer}>
          <div className={styles.title}>Pending requests</div>
          {myPendingFriends.map((friend) => {
            return <UserPreview key={friend.id} user={friend} />;
          })}
        </div>
      )}
    </div>
  );
};

export default UserFriends;

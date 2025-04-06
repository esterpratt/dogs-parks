import { Link, useOutletContext } from 'react-router';
import { UserPreview } from '../components/users/UserPreview';
import styles from './UserFriends.module.scss';
import { User } from '../types/user';
import { Loader } from '../components/Loader';
import { useQuery } from '@tanstack/react-query';
import { fetchFriendsWithDogs } from '../services/users';
import { FRIENDSHIP_STATUS, USER_ROLE } from '../types/friendship';
import { FRIENDS_KEY } from '../hooks/api/keys';
import { useDelayedLoading } from '../hooks/useDelayedLoading';

const UserFriends = () => {
  const { user } = useOutletContext() as { user: User };

  const { data: friends, isFetching: isLoadingFriends } = useQuery({
    queryKey: ['friends', user.id, FRIENDS_KEY.FRIENDS, 'dogs'],
    queryFn: () =>
      fetchFriendsWithDogs({
        userId: user.id,
      }),
  });

  const { data: pendingFriends, isFetching: isLoadingPendingFriends } =
    useQuery({
      queryKey: ['friends', user.id, FRIENDS_KEY.PENDING_FRIENDS, 'dogs'],
      queryFn: () =>
        fetchFriendsWithDogs({
          userId: user.id,
          userRole: USER_ROLE.REQUESTEE,
          status: FRIENDSHIP_STATUS.PENDING,
        }),
    });

  const { data: myPendingFriends, isFetching: isLoadingMyPendingFriends } =
    useQuery({
      queryKey: ['friends', user.id, FRIENDS_KEY.MY_PENDING_FRIENDS, 'dogs'],
      queryFn: () =>
        fetchFriendsWithDogs({
          userId: user.id,
          userRole: USER_ROLE.REQUESTER,
          status: FRIENDSHIP_STATUS.PENDING,
        }),
    });

  const isLoading =
    isLoadingFriends || isLoadingPendingFriends || isLoadingMyPendingFriends;

  const { showLoader } = useDelayedLoading({
    isLoading,
    minDuration: 750,
  });

  if (showLoader) {
    return <Loader />;
  }

  if (
    !isLoading &&
    !friends?.length &&
    !pendingFriends?.length &&
    !myPendingFriends?.length
  ) {
    return (
      <div className={styles.noFriends}>
        <span className={styles.noFriendsTitle}>No friends yet.</span>
        <Link to="/users" className={styles.link}>
          Sniff out some friends!
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {!!friends?.length && (
        <div className={styles.friendsContainer}>
          <div className={styles.title}>My Friends</div>
          {friends.map((friend) => {
            return <UserPreview key={friend.id} user={friend} />;
          })}
        </div>
      )}
      {!!pendingFriends?.length && (
        <div className={styles.friendsContainer}>
          <div className={styles.title}>Want to be my friends</div>
          {pendingFriends.map((friend) => {
            return <UserPreview key={friend.id} user={friend} />;
          })}
        </div>
      )}
      {!!myPendingFriends?.length && (
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

import { Link, useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { UserPreview } from '../components/users/UserPreview';
import { User } from '../types/user';
import { Loader } from '../components/Loader';
import { fetchFriendsWithDogs } from '../services/users';
import { FRIENDSHIP_STATUS, USER_ROLE } from '../types/friendship';
import { FRIENDS_KEY } from '../hooks/api/keys';
import { useDelayedLoading } from '../hooks/useDelayedLoading';
import styles from './UserFriends.module.scss';

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

import { Link, useOutletContext } from 'react-router-dom';
import { UserPreview } from '../components/users/UserPreview';
import { User } from '../types/user';
import { Loader } from '../components/Loader';
import { FRIENDSHIP_STATUS, USER_ROLE } from '../types/friendship';
import styles from './UserFriends.module.scss';
import { queryClient } from '../services/react-query';
import { useEffect } from 'react';
import { useFetchFriendsWithDogs } from '../hooks/api/useFetchFriendsWithDogs';
import { useTranslation } from 'react-i18next';

const UserFriends = () => {
  const { user } = useOutletContext() as { user: User };
  const { t } = useTranslation();

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
        <div>{t('userFriends.noFriends')}</div>
        <div>
          {t('users.sniffFriends')}{' '}
          <Link to="/users" className={styles.link}>
            {t('favorites.sniffParksLink')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {!!friends?.length && (
        <div className={styles.friendsContainer}>
          <div className={styles.title}>{t('userFriends.myFriends')}</div>
          {friends.map((friend) => {
            return <UserPreview key={friend.id} user={friend} />;
          })}
        </div>
      )}
      {!!pendingFriends?.length && (
        <div className={styles.friendsContainer}>
          <div className={styles.title}>{t('userFriends.friendRequests')}</div>
          {pendingFriends.map((friend) => {
            return (
              <UserPreview key={friend.id} user={friend} showFriendshipButton />
            );
          })}
        </div>
      )}
      {!!myPendingFriends?.length && (
        <div className={styles.friendsContainer}>
          <div className={styles.title}>{t('userFriends.pendingRequests')}</div>
          {myPendingFriends.map((friend) => {
            return <UserPreview key={friend.id} user={friend} />;
          })}
        </div>
      )}
    </div>
  );
};

export default UserFriends;

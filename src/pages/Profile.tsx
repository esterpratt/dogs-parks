import { Suspense, useContext } from 'react';
import { Await, Link, Navigate, Outlet, useLoaderData } from 'react-router-dom';
import { DogIcon, MoveLeft, MoveRight } from 'lucide-react';
import classnames from 'classnames';
import { UserContext } from '../context/UserContext';
import { ProfileTabs } from '../components/profile/ProfileTabs';
import { Loader } from '../components/Loader';
import { Friendship, FRIENDSHIP_STATUS, USER_ROLE } from '../types/friendship';
import { getDogNames } from '../utils/getDogNames';
import { FriendRequestButton } from '../components/profile/FriendRequestButton';
import { Header } from '../components/Header';
import { HeaderImage } from '../components/HeaderImage';
import styles from './Profile.module.scss';
import { useQuery } from '@tanstack/react-query';
import { fetchUserFavorites } from '../services/favorites';
import { FRIENDS_KEY } from '../hooks/api/keys';
import { fetchFriendsWithDogs } from '../services/users';
import { usePrefetchRoutesOnIdle } from '../hooks/usePrefetchRoutesOnIdle';

const Profile: React.FC = () => {
  const { user, dogs, dogImages, pendingFriendships, approvedFriendships } =
    useLoaderData();
  const { user: signedInUser, isLoadingUser } = useContext(UserContext);
  const isSignedInUser = signedInUser?.id === user.id;

  // prefetch friends and favorites requests
  usePrefetchRoutesOnIdle(['dog']);

  useQuery({
    queryKey: ['favorites', user.id],
    queryFn: async () => fetchUserFavorites(user.id),
  });

  useQuery({
    queryKey: ['friends', user.id, FRIENDS_KEY.FRIENDS, 'dogs'],
    queryFn: () =>
      fetchFriendsWithDogs({
        userId: user.id,
      }),
  });

  useQuery({
    queryKey: ['friends', user.id, FRIENDS_KEY.PENDING_FRIENDS, 'dogs'],
    queryFn: () =>
      fetchFriendsWithDogs({
        userId: user.id,
        userRole: USER_ROLE.REQUESTEE,
        status: FRIENDSHIP_STATUS.PENDING,
      }),
  });

  useQuery({
    queryKey: ['friends', user.id, FRIENDS_KEY.MY_PENDING_FRIENDS, 'dogs'],
    queryFn: () =>
      fetchFriendsWithDogs({
        userId: user.id,
        userRole: USER_ROLE.REQUESTER,
        status: FRIENDSHIP_STATUS.PENDING,
      }),
  });

  if (!user) {
    return null;
  }

  if (!isSignedInUser && user.private) {
    const pendingFriendsIds = pendingFriendships.map(
      (friendship: Friendship) => {
        if (user.id === friendship.requestee_id) {
          return friendship.requester_id;
        }
        return friendship.requestee_id;
      }
    );

    const approvedFriendsIds = approvedFriendships.map(
      (friendship: Friendship) => {
        if (user.id === friendship.requestee_id) {
          return friendship.requester_id;
        }
        return friendship.requestee_id;
      }
    );

    if (
      !pendingFriendsIds.concat(approvedFriendsIds).includes(signedInUser?.id)
    ) {
      return <Navigate to="/" />;
    }
  }

  return (
    <div className={styles.profileContainer}>
      <Header
        size={isSignedInUser ? 'small' : 'medium'}
        containerClassName={classnames(
          styles.header,
          isSignedInUser || !signedInUser ? styles.small : styles.medium
        )}
        imgsClassName={classnames(
          styles.imgsContainer,
          isSignedInUser || !signedInUser ? styles.small : styles.medium
        )}
        prevLinksCmp={
          !isSignedInUser && !isLoadingUser ? (
            <>
              {!!signedInUser && (
                <Link to={`/profile/${signedInUser.id}/friends`}>
                  <MoveLeft size={16} />
                  <span>My friends</span>
                </Link>
              )}
              <Link to="/users">
                {!signedInUser && <MoveLeft size={16} />}
                <span>Users</span>
                {!!signedInUser && <MoveRight size={16} />}
              </Link>
            </>
          ) : null
        }
        imgCmp={
          <Suspense fallback={null}>
            <Await resolve={dogImages}>
              {(dogImages) => {
                const dogImagesToDisplay =
                  !dogImages || dogImages.length === 0
                    ? ['']
                    : dogImages.length > 4
                    ? dogImages.slice(0, 4)
                    : [...dogImages];
                return dogImagesToDisplay.map(
                  (dogImage: string, index: number) => {
                    return (
                      <HeaderImage
                        key={index}
                        imgSrc={dogImage}
                        className={styles.img}
                        style={{ zIndex: dogImagesToDisplay.length - index }}
                        NoImgIcon={DogIcon}
                        size={112}
                      />
                    );
                  }
                );
              }}
            </Await>
          </Suspense>
        }
        bottomCmp={
          isSignedInUser ? (
            <div className={styles.welcome}>
              Paws up, <span className={styles.userName}>{user.name}!</span>
            </div>
          ) : !!signedInUser && !isSignedInUser ? (
            <div className={styles.title}>
              <div className={styles.text}>
                <span>Meet </span>
                <span className={styles.userName}>{user.name}</span>
                <span>'s pack: {getDogNames(dogs)}</span>
              </div>
              <FriendRequestButton
                className={styles.friendRequestContainer}
                friendId={user.id}
                userName={user.name}
              />
            </div>
          ) : null
        }
      />
      {isSignedInUser && <ProfileTabs />}
      <Suspense fallback={<Loader inside className={styles.loader} />}>
        <Await resolve={dogImages}>
          {(dogImages) => (
            <div
              className={classnames(styles.container, {
                [styles.withMargin]: isSignedInUser,
              })}
            >
              <Outlet
                context={{
                  user,
                  dogs,
                  dogImages,
                  isSignedInUser,
                }}
              />
            </div>
          )}
        </Await>
      </Suspense>
    </div>
  );
};

export default Profile;

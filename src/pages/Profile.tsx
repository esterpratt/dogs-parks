import { Suspense, useContext } from 'react';
import { Await, Link, Navigate, Outlet, useLoaderData } from 'react-router-dom';
import { DogIcon, MoveLeft, MoveRight } from 'lucide-react';
import classnames from 'classnames';
import { useQuery } from '@tanstack/react-query';
import { UserContext } from '../context/UserContext';
import { ProfileTabs } from '../components/profile/ProfileTabs';
import { Loader } from '../components/Loader';
import { FRIENDSHIP_STATUS, USER_ROLE } from '../types/friendship';
import { getDogNames } from '../utils/getDogNames';
import { FriendRequestButton } from '../components/profile/FriendRequestButton';
import { Header } from '../components/Header';
import { HeaderImage } from '../components/HeaderImage';
import { fetchUserFavorites } from '../services/favorites';
import { usePrefetchRoutesOnIdle } from '../hooks/usePrefetchRoutesOnIdle';
import { useIsAllowedToViewProfile } from '../hooks/useIsAllowedToViewProfile';
import styles from './Profile.module.scss';
import { usePrefetchFriendsWithDogs } from '../hooks/api/usePrefetchFriendsWithDogs';

const Profile: React.FC = () => {
  const { user, dogs, dogImages } = useLoaderData();
  const { user: signedInUser, isLoadingUser } = useContext(UserContext);
  const isSignedInUser = signedInUser?.id === user.id;

  const { isAllowedToViewProfile } = useIsAllowedToViewProfile({
    user,
    signedInUserId: signedInUser?.id,
    isSignedInUser,
  });

  // prefetch friends and favorites requests
  usePrefetchRoutesOnIdle([
    'dog',
    'userFriends',
    'userFavorites',
    'userReviews',
    'userInfo',
  ]);

  useQuery({
    queryKey: ['favorites', user.id],
    queryFn: async () => fetchUserFavorites(user.id),
  });

  usePrefetchFriendsWithDogs({
    userId: user.id,
    status: FRIENDSHIP_STATUS.APPROVED,
    enabled: isSignedInUser,
  });
  usePrefetchFriendsWithDogs({
    userId: user.id,
    status: FRIENDSHIP_STATUS.PENDING,
    userRole: USER_ROLE.REQUESTEE,
    enabled: isSignedInUser,
  });
  usePrefetchFriendsWithDogs({
    userId: user.id,
    status: FRIENDSHIP_STATUS.PENDING,
    userRole: USER_ROLE.REQUESTER,
    enabled: isSignedInUser,
  });

  if (!user) {
    return null;
  }

  if (!isAllowedToViewProfile) {
    return <Navigate to="/" />;
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
                {!!dogs?.length && <span>Meet </span>}
                <span className={styles.userName}>{user.name}</span>
                {!!dogs?.length && <span>'s pack: {getDogNames(dogs)}</span>}
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
      <Suspense
        fallback={
          <Loader
            inside
            className={classnames(styles.loader, {
              [styles.user]: isSignedInUser,
            })}
          />
        }
      >
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

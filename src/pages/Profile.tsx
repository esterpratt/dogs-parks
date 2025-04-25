import { Suspense, useContext } from 'react';
import { Await, Link, Navigate, Outlet, useLoaderData } from 'react-router';
import { DogIcon, MoveLeft, MoveRight } from 'lucide-react';
import classnames from 'classnames';
import { UserContext } from '../context/UserContext';
import { ProfileTabs } from '../components/profile/ProfileTabs';
import { Loader } from '../components/Loader';
import { Friendship } from '../types/friendship';
import { getDogNames } from '../utils/getDogNames';
import { FriendRequestButton } from '../components/profile/FriendRequestButton';
import { Header } from '../components/Header';
import { HeaderImage } from '../components/HeaderImage';
import styles from './Profile.module.scss';

const Profile: React.FC = () => {
  const { user, dogs, dogImages, pendingFriendships, approvedFriendships } =
    useLoaderData();
  const { user: signedInUser, isLoading } = useContext(UserContext);
  const isSignedInUser = signedInUser?.id === user.id;

  if (!user) {
    return null;
  }

  if (isLoading) {
    return <Loader />;
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
    <>
      <Header
        containerClassName={
          isSignedInUser || !signedInUser ? styles.small : undefined
        }
        prevLinksCmp={
          !isSignedInUser ? (
            <>
              <Link to="/users">
                <MoveLeft size={16} />
                <span>Users</span>
              </Link>
              {!!signedInUser && (
                <Link to={`/profile/${signedInUser.id}/friends`}>
                  <span>My friends</span>
                  <MoveRight size={16} />
                </Link>
              )}
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
                        size={100}
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
            <div className={styles.welcome}>Paws up, {user.name}!</div>
          ) : !!signedInUser && !isSignedInUser ? (
            <div className={styles.title}>
              <div className={styles.text}>
                <span>Meet </span>
                <span className={styles.userName}>{user.name}</span>
                <span>'s Pack: {getDogNames(dogs)}</span>
              </div>
              <FriendRequestButton friendId={user.id} userName={user.name} />
            </div>
          ) : null
        }
      />
      {isSignedInUser && <ProfileTabs />}
      <Suspense fallback={<Loader />}>
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
    </>
  );
};

export { Profile };

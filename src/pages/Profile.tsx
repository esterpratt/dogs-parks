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
      <div
        className={classnames(styles.header, {
          [styles.small]: isSignedInUser || !signedInUser,
        })}
      >
        {!isSignedInUser && (
          <div className={styles.prevLinks}>
            <Link to="/users" className={styles.prevLink}>
              <MoveLeft size={16} />
              <span>Users</span>
            </Link>
            {!!signedInUser && (
              <Link
                to={`/profile/${signedInUser.id}/friends`}
                className={styles.prevLink}
              >
                <span>My friends</span>
                <MoveRight size={16} />
              </Link>
            )}
          </div>
        )}
        <div className={styles.imgsContainer}>
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
                      <div
                        key={index}
                        className={styles.img}
                        style={{ zIndex: dogImagesToDisplay.length - index }}
                      >
                        {dogImage ? (
                          <img src={dogImage} />
                        ) : (
                          <div className={styles.noImg}>
                            <DogIcon
                              size={64}
                              color={styles.green}
                              strokeWidth={1}
                            />
                          </div>
                        )}
                      </div>
                    );
                  }
                );
              }}
            </Await>
          </Suspense>
        </div>
        {isSignedInUser && (
          <div className={styles.welcome}>Paws up, {user.name}!</div>
        )}
        {!!signedInUser && !isSignedInUser && (
          <div className={styles.title}>
            <div className={styles.text}>
              <span>Meet </span>
              <span className={styles.userName}>{user.name}</span>
              <span>'s Pack: {getDogNames(dogs)}</span>
            </div>
            <FriendRequestButton friendId={user.id} userName={user.name} />
          </div>
        )}
      </div>
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

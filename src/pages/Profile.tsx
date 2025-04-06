import { Suspense, useContext } from 'react';
import { Await, Navigate, Outlet, useLoaderData } from 'react-router';
import classnames from 'classnames';
import { UserContext } from '../context/UserContext';
import { ProfileTabs } from '../components/profile/ProfileTabs';
import { Loader } from '../components/Loader';
import styles from './Profile.module.scss';
import { Friendship } from '../types/friendship';

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
      {isSignedInUser && <ProfileTabs />}
      <Suspense fallback={<Loader />}>
        <Await resolve={dogImages}>
          {(dogImages) => (
            <div
              className={classnames(
                styles.container,
                isSignedInUser && styles.withMargin
              )}
            >
              <Suspense fallback={<Loader />}>
                <Outlet
                  context={{
                    user,
                    dogs,
                    dogImages,
                    isSignedInUser,
                  }}
                />
              </Suspense>
            </div>
          )}
        </Await>
      </Suspense>
    </>
  );
};

export { Profile };

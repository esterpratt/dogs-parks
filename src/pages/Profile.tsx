import { Suspense, useContext } from 'react';
import { Navigate, Outlet, useParams } from 'react-router';
import classnames from 'classnames';
import { UserContext } from '../context/UserContext';
import { ProfileTabs } from '../components/profile/ProfileTabs';
import { Loader } from '../components/Loader';
import styles from './Profile.module.scss';
import { useDelayedLoading } from '../hooks/useDelayedLoading';
import { Friendship, FRIENDSHIP_STATUS } from '../types/friendship';
import { useQueries } from '@tanstack/react-query';
import { fetchUser } from '../services/users';
import { fetchDogPrimaryImage, fetchUserDogs } from '../services/dogs';
import { fetchUserFriendships } from '../services/friendships';

const Profile: React.FC = () => {
  const { id: userId } = useParams();
  const { user: signedInUser, isLoading } = useContext(UserContext);
  const isSignedInUser = signedInUser?.id === userId;

  const [
    { data: user, isLoading: isLoadingUser },
    { data: dogs, isLoading: isLoadingDogs },
    { data: pendingFriendships, isLoading: isLoadingPendingFriendships },
    { data: approvedFriendships, isLoading: isLoadingApprovedFriendships },
  ] = useQueries({
    queries: [
      { queryKey: ['user', userId], queryFn: () => fetchUser(userId!) },
      { queryKey: ['dogs', userId], queryFn: () => fetchUserDogs(userId!) },
      {
        queryKey: ['friendships', userId, 'pending'],
        queryFn: () =>
          fetchUserFriendships({
            userId: userId!,
            status: FRIENDSHIP_STATUS.PENDING,
          }),
      },
      {
        queryKey: ['friendships', userId, 'approved'],
        queryFn: () =>
          fetchUserFriendships({
            userId: userId!,
          }),
      },
    ],
  });

  const dogImageQueries = useQueries({
    queries: (dogs ?? []).map((dog) => ({
      queryKey: ['dogImage', dog.id],
      queryFn: async () => {
        const image = await fetchDogPrimaryImage(dog.id);
        return image || null;
      },
      enabled: !!dogs?.length,
    })),
  });

  const isLoadingImages = dogImageQueries.some((query) => query.isLoading);
  const dogImages = dogImageQueries.map((query) => query.data);

  const showLoader = useDelayedLoading({
    isLoading:
      isLoading ||
      isLoadingUser ||
      isLoadingDogs ||
      isLoadingPendingFriendships ||
      isLoadingApprovedFriendships ||
      isLoadingImages,
    minDuration: 750,
  });

  if (showLoader) {
    return <Loader />;
  }

  if (!user) {
    return null;
  }

  if (!isSignedInUser && user.private) {
    const pendingFriendsIds = pendingFriendships?.map(
      (friendship: Friendship) => {
        if (user.id === friendship.requestee_id) {
          return friendship.requester_id;
        }
        return friendship.requestee_id;
      }
    );

    const approvedFriendsIds = approvedFriendships?.map(
      (friendship: Friendship) => {
        if (user.id === friendship.requestee_id) {
          return friendship.requester_id;
        }
        return friendship.requestee_id;
      }
    );

    if (
      !pendingFriendsIds
        ?.concat(approvedFriendsIds || [])
        .includes(signedInUser?.id || '')
    ) {
      return <Navigate to="/" />;
    }
  }

  return (
    <>
      {isSignedInUser && <ProfileTabs />}
      {dogImages && (
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
    </>
  );
};

export { Profile };

import { useContext } from 'react';
import { Link, Navigate, Outlet, useLoaderData } from 'react-router-dom';
import { MoveLeft, MoveRight, Settings } from 'lucide-react';
import { Trans, useTranslation } from 'react-i18next';
import classnames from 'classnames';
import { useQueries, useQuery } from '@tanstack/react-query';
import { UserContext } from '../context/UserContext';
import { FRIENDSHIP_STATUS, USER_ROLE } from '../types/friendship';
import { Dog } from '../types/dog';
import { getDogNames } from '../utils/getDogNames';
import { ONE_MINUTE } from '../utils/consts';
import { fetchDogPrimaryImage } from '../services/dogs';
import { fetchUserFavorites } from '../services/favorites';
import { usePrefetchRoutesOnIdle } from '../hooks/usePrefetchRoutesOnIdle';
import { useIsAllowedToViewProfile } from '../hooks/useIsAllowedToViewProfile';
import { usePrefetchFriendsWithDogs } from '../hooks/api/usePrefetchFriendsWithDogs';
import { ProfileTabs } from '../components/profile/ProfileTabs';
import { FriendRequestButton } from '../components/profile/FriendRequestButton';
import { Header } from '../components/Header';
import { HeaderImage } from '../components/HeaderImage';
import DogIcon from '../assets/dog.svg?react';
import styles from './Profile.module.scss';

import {
  fetchUserInvitedEvents,
  fetchUserOrganizedEvents,
} from '../services/events';

const Profile: React.FC = () => {
  const { user, dogs } = useLoaderData();
  const { user: signedInUser, isLoadingUser } = useContext(UserContext);
  const isSignedInUser = signedInUser?.id === user.id;
  const { t } = useTranslation();

  const dogImages = useQueries({
    queries: dogs.map((dog: Dog) => {
      return {
        queryKey: ['dogImage', dog.id],
        queryFn: async () => fetchDogPrimaryImage(dog.id),
      };
    }),
  });

  const dogImagesToDisplay =
    !dogImages || dogImages.length === 0
      ? new Array(dogs?.length || 0)
      : dogImages.length > 4
        ? dogImages.slice(0, 4)
        : [...dogImages.map((image) => image.data)];

  const { isAllowedToViewProfile } = useIsAllowedToViewProfile({
    user,
    signedInUserId: signedInUser?.id,
    isSignedInUser,
  });

  // prefetch user requests
  usePrefetchRoutesOnIdle([
    'dog',
    'userFriends',
    'userFavorites',
    'userReviews',
    'userEvents',
    'userSettings',
  ]);

  useQuery({
    queryKey: ['favorites', user.id],
    queryFn: async () => fetchUserFavorites(user.id),
  });

  useQuery({
    queryKey: ['events', 'invited', user.id, 'list'],
    queryFn: fetchUserInvitedEvents,
    staleTime: ONE_MINUTE,
  });

  useQuery({
    queryKey: ['events', 'organized', user.id, 'list'],
    queryFn: fetchUserOrganizedEvents,
    staleTime: ONE_MINUTE,
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
        size={isSignedInUser ? 'small' : 'xlarge'}
        prevLinksCmp={
          !isSignedInUser && !isLoadingUser ? (
            <>
              {!!signedInUser && (
                <Link to={`/profile/${signedInUser.id}/friends`}>
                  <MoveLeft size={16} />
                  <span>{t('profile.myFriends')}</span>
                </Link>
              )}
              <Link to="/users">
                {!signedInUser && <MoveLeft size={16} />}
                <span>{t('profile.users')}</span>
                {!!signedInUser && <MoveRight size={16} />}
              </Link>
            </>
          ) : null
        }
        imgCmp={dogImagesToDisplay.map((dogImage: string, index: number) => {
          return (
            <HeaderImage
              key={index}
              imgSrc={dogImage}
              className={styles.img}
              style={{ zIndex: dogImagesToDisplay.length - index }}
              NoImgIcon={DogIcon}
              size={isSignedInUser ? 112 : 124}
            />
          );
        })}
        bottomCmp={
          isSignedInUser ? (
            <div className={styles.welcome}>
              <Trans
                i18nKey="profile.pawsUpRich"
                values={{ name: user.name }}
                components={{ name: <span className={styles.userName} /> }}
              />
              <Link
                className={styles.settingsButton}
                to={`/profile/${signedInUser!.id}/settings`}
              >
                <Settings color={styles.pink} size={24} />
              </Link>
            </div>
          ) : !!signedInUser && !isSignedInUser ? (
            <div className={styles.title}>
              <div className={styles.text}>
                {!!dogs?.length && <span>{t('profile.meetPrefix')} </span>}
                <span className={styles.userName}>{user.name}</span>
                {!!dogs?.length && (
                  <span>
                    {t('profile.packSuffix', { dogs: getDogNames(dogs) })}
                  </span>
                )}
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
      <div
        className={classnames(styles.container, {
          [styles.withMargin]: isSignedInUser,
        })}
      >
        <Outlet
          context={{
            user,
            dogs,
            isSignedInUser,
            dogImages: dogImagesToDisplay,
          }}
        />
      </div>
    </div>
  );
};

export default Profile;

import { useContext } from 'react';
import { Navigate, Outlet, useNavigate } from 'react-router-dom';
import { MoveLeft, MoveRight, Settings } from 'lucide-react';
import { Trans, useTranslation } from 'react-i18next';
import { useQueries, useQuery } from '@tanstack/react-query';

import { UserContext } from '../context/UserContext';
import { FRIENDSHIP_STATUS, USER_ROLE } from '../types/friendship';
import type { Dog } from '../types/dog';
import type { User } from '../types/user';
import { getDogNames } from '../utils/getDogNames';
import { ONE_MINUTE } from '../utils/consts';
import { fetchDogPrimaryImage } from '../services/dogs';
import { fetchUserFavorites } from '../services/favorites';
import {
  fetchUserInvitedEvents,
  fetchUserOrganizedEvents,
} from '../services/events';
import { usePrefetchRoutesOnIdle } from '../hooks/usePrefetchRoutesOnIdle';
import { useIsAllowedToViewProfile } from '../hooks/useIsAllowedToViewProfile';
import { usePrefetchFriendsWithDogs } from '../hooks/api/usePrefetchFriendsWithDogs';
import { ProfileTabs } from '../components/profile/ProfileTabs';
import { FriendRequestButton } from '../components/profile/FriendRequestButton';
import { Header } from '../components/Header';
import { HeaderImage } from '../components/HeaderImage';
import { PrevLinks } from '../components/PrevLinks';
import { Button } from '../components/Button';
import DogIcon from '../assets/dog.svg?react';
import styles from './ParkDetails.module.scss';

interface ProfileResolvedProps {
  user: User;
  dogs: Dog[];
}

const ProfileResolved: React.FC<ProfileResolvedProps> = (props) => {
  const { user, dogs } = props;

  const { user: signedInUser, isLoadingUser } = useContext(UserContext);
  const isSignedInUser = signedInUser?.id === user.id;
  const { t } = useTranslation();
  const navigate = useNavigate();

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
      ? new Array(dogs?.length || 1).fill(null)
      : dogImages.length > 4
        ? dogImages.slice(0, 4)
        : [...dogImages.map((image) => image.data)];

  const { isAllowedToViewProfile } = useIsAllowedToViewProfile({
    user,
    signedInUserId: signedInUser?.id,
    isSignedInUser,
  });

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

  const onClickSettings = () => {
    navigate(`/profile/${signedInUser!.id}/settings`);
  };

  if (!user) {
    return null;
  }

  if (!isAllowedToViewProfile) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className={styles.profileContainer}>
      <Header
        size={isSignedInUser ? 'small' : 'large'}
        prevLinksCmp={
          !isSignedInUser && !isLoadingUser ? (
            <PrevLinks
              links={
                signedInUser
                  ? [
                      {
                        to: `/profile/${signedInUser.id}/friends`,
                        icon: <MoveLeft size={16} />,
                        text: t('profile.myFriends'),
                      },
                      {
                        to: '/users',
                        icon: <MoveRight size={16} />,
                        text: t('profile.users'),
                      },
                    ]
                  : {
                      to: '/users',
                      icon: <MoveLeft size={16} />,
                      text: t('profile.users'),
                    }
              }
            />
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
              size={dogs.length > 1 ? 112 : undefined}
            />
          );
        })}
        bottomCmp={
          isSignedInUser ? (
            <div className={styles.welcome}>
              <span className={styles.welcomeText}>
                <Trans
                  i18nKey="profile.pawsUpRich"
                  values={{ name: user.name }}
                  components={{ name: <span className={styles.userName} /> }}
                />
              </span>
              <Button
                variant="secondary"
                className={styles.settingsButton}
                onClick={onClickSettings}
              >
                <Settings color={styles.pink} size={18} />
              </Button>
            </div>
          ) : !!signedInUser && !isSignedInUser ? (
            <div className={styles.title}>
              <div className={styles.text}>
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
                userName={user.name || ''}
              />
            </div>
          ) : null
        }
      />
      {isSignedInUser && <ProfileTabs />}
      <div className={styles.container}>
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

export { ProfileResolved };

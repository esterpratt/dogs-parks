import { Suspense, useContext } from 'react';
import { Await, Outlet, useLoaderData } from 'react-router';
import classnames from 'classnames';
import { User } from '../types/user';
import { Dog } from '../types/dog';
import { UserContext } from '../context/UserContext';
import { ProfileTabs } from '../components/profile/ProfileTabs';
import { Loader } from '../components/Loader';
import styles from './Profile.module.scss';
import { useDelayedLoading } from '../hooks/useDelayedLoading';

const Profile: React.FC = () => {
  const { user, dogs, dogImages } = useLoaderData() as {
    user: User;
    dogs: Dog[];
    dogImages: Promise<string | null>[];
  };
  const { user: signedInUser, isLoading } = useContext(UserContext);
  const isSignedInUser = signedInUser?.id === user.id;

  const showLoader = useDelayedLoading({ isLoading });

  if (showLoader) {
    return <Loader />;
  }

  if (!user) {
    return null;
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

import { Suspense, useContext } from 'react';
import { Await, Outlet, useLoaderData } from 'react-router';
import classnames from 'classnames';
import { User } from '../types/user';
import { Dog } from '../types/dog';
import { UserContext } from '../context/UserContext';
import { ProfileTabs } from '../components/profile/ProfileTabs';
import { Loader } from '../components/Loading';
import styles from './Profile.module.scss';

const Profile: React.FC = () => {
  const { user, dogs, dogImages } = useLoaderData() as {
    user: User;
    dogs: Dog[];
    dogImages: Promise<string | null>[];
  };
  const { user: signedInUser, isLoading } = useContext(UserContext);
  const isSignedInUser = signedInUser?.id === user.id;

  if (isLoading) {
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
          {(dogImages: (string | null)[]) => (
            <div
              className={classnames(
                styles.container,
                isSignedInUser && styles.withMargin
              )}
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

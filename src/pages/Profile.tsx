import { Await, Outlet, useLoaderData } from 'react-router';
import { User } from '../types/user';
import { Dog } from '../types/dog';
import { Suspense, useContext } from 'react';
import { UserContext } from '../context/UserContext';
import { ProfileTabs } from '../components/profile/ProfileTabs';
import { Loading } from '../components/Loading';

const Profile: React.FC = () => {
  const { user, dogs, dogImages } = useLoaderData() as {
    user: User;
    dogs: Dog[];
    dogImages: Promise<string | null>[];
  };
  const { user: signedInUser } = useContext(UserContext);
  const isSignedInUser = signedInUser?.id === user.id;

  return (
    <>
      {isSignedInUser && <ProfileTabs />}
      <Suspense fallback={<Loading />}>
        <Await resolve={dogImages}>
          {(dogImages: (string | null)[]) => (
            <Outlet
              context={{
                user,
                dogs,
                dogImages,
                isSignedInUser,
              }}
            />
          )}
        </Await>
      </Suspense>
    </>
  );
};

export { Profile };

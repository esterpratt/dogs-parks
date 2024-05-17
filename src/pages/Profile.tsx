import { Outlet, useLoaderData } from 'react-router';
import { User } from '../types/user';
import { Dog } from '../types/dog';
import { useContext } from 'react';
import { UserContext } from '../context/UserContext';
import { ProfileTabs } from '../components/profile/ProfileTabs';

const Profile: React.FC = () => {
  const { user, dogs } = useLoaderData() as {
    user: User;
    dogs: Dog[];
  };
  const { user: signedInUser } = useContext(UserContext);
  const isSignedInUser = signedInUser?.id === user.id;

  return (
    <>
      {isSignedInUser && <ProfileTabs />}
      <Outlet
        context={{
          user,
          dogs,
          isSignedInUser,
        }}
      />
    </>
  );
};

export { Profile };

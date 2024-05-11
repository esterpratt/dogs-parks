import { Outlet } from 'react-router';
import { User } from '../types/user';
import { useContext } from 'react';
import { UserContext } from '../context/UserContext';
import { Dog } from '../types/dog';
import { ProfileTabs } from '../components/profile/ProfileTabs';

interface UserProfileProps {
  user: User;
  dogs: Dog[];
}

const UserProfile: React.FC<UserProfileProps> = ({ user, dogs }) => {
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

export { UserProfile };

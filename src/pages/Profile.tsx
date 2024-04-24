import { useLoaderData } from 'react-router';
import { User } from '../types/user';
import { useContext } from 'react';
import { UserContext } from '../context/UserContext';
import { PrivateProfile } from '../components/profile/PrivateProfile';
import { PublicProfile } from '../components/profile/PublicProfile';

const Profile: React.FC = () => {
  const user = useLoaderData() as User;
  const { user: signedInUser } = useContext(UserContext);

  if (signedInUser?.id === user.id) {
    return <PrivateProfile user={user} />;
  }

  return <PublicProfile user={user} signedInUser={signedInUser} />;
};

export { Profile };

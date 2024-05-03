import { useLoaderData } from 'react-router';
import { User } from '../types/user';
import { useContext } from 'react';
import { UserContext } from '../context/UserContext';
import { PrivateProfile } from '../components/profile/PrivateProfile';
import { PublicProfile } from '../components/profile/PublicProfile';
import { Dog } from '../types/dog';

const Profile: React.FC = () => {
  const { user, dogs } = useLoaderData() as { user: User; dogs: Dog[] };
  const { user: signedInUser } = useContext(UserContext);

  if (signedInUser?.id === user.id) {
    return <PrivateProfile user={user} dogs={dogs} />;
  }

  return <PublicProfile user={user} signedInUser={signedInUser} dogs={dogs} />;
};

export { Profile };

import { useLoaderData } from 'react-router';
import { User } from '../types/user';
import { useContext } from 'react';
import { UserContext } from '../context/UserContext';
import { PrivateProfile } from '../components/profile/PrivateProfile';
import { PublicProfile } from '../components/profile/PublicProfile';
import { Dog } from '../types/dog';

const Profile: React.FC = () => {
  const { user, dogs, imagesByDog } = useLoaderData() as {
    user: User;
    dogs: Dog[];
    imagesByDog: { [dogId: string]: { primary: string; other: string[] } };
  };
  const { user: signedInUser } = useContext(UserContext);

  if (signedInUser?.id === user.id) {
    return <PrivateProfile user={user} dogs={dogs} imagesByDog={imagesByDog} />;
  }

  return (
    <PublicProfile
      user={user}
      signedInUser={signedInUser}
      dogs={dogs}
      imagesByDog={imagesByDog}
    />
  );
};

export { Profile };

import { useLoaderData, useLocation } from 'react-router';
import { User } from '../types/user';
import { Dog } from '../types/dog';
import { UserProfile } from '../components/profile/UserProfile';

const Profile: React.FC = () => {
  const { user, dogs, imagesByDog } = useLoaderData() as {
    user: User;
    dogs: Dog[];
    imagesByDog: { [dogId: string]: { primary: string; other: string[] } };
  };
  const location = useLocation();

  return (
    <div>
      <UserProfile
        user={user}
        dogs={dogs}
        imagesByDog={imagesByDog}
        key={location.key}
      />
    </div>
  );
};

export { Profile };

import { Dog } from '../../types/dog';
import { User } from '../../types/user';
import { FriendRequestButton } from './FriendRequestButton';

interface PublicProfileProps {
  user: User;
  dogs: Dog[];
  imagesByDog: { [dogId: string]: { primary: string; other: string[] } };
  signedInUser: User | null;
}

const PublicProfile: React.FC<PublicProfileProps> = ({
  user,
  signedInUser,
  // dogs = [],
}) => {
  return (
    <div>
      <span>Meet {user.name}</span>
      {signedInUser && (
        <FriendRequestButton
          signedInUserId={signedInUser.id}
          userId={user.id}
        />
      )}
    </div>
  );
};

export { PublicProfile };

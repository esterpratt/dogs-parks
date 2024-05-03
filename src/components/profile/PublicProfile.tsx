import { Dog } from '../../types/dog';
import { User } from '../../types/user';
import { Dogs } from './Dogs';
import { FriendRequestButton } from './FriendRequestButton';

interface PublicProfileProps {
  user: User;
  dogs?: Dog[];
  signedInUser: User | null;
}

const PublicProfile: React.FC<PublicProfileProps> = ({
  user,
  signedInUser,
  dogs = [],
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
      <Dogs dogs={dogs} />
    </div>
  );
};

export { PublicProfile };

import { User } from '../../types/user';
import { FriendsList } from './FriendsList';

interface PrivateProfileProps {
  user: User;
}

const PrivateProfile: React.FC<PrivateProfileProps> = ({ user }) => {
  return (
    <div>
      <span>Welcome {user.name}</span>
      <FriendsList userId={user.id} />
    </div>
  );
};

export { PrivateProfile };

import { User } from '../../types/user';

interface PrivateProfileProps {
  user: User;
}

const PrivateProfile: React.FC<PrivateProfileProps> = ({ user }) => {
  return (
    <div>
      <span>Welcome {user.name}</span>
    </div>
  );
};

export { PrivateProfile };

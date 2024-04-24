import { User } from '../../types/user';

interface PublicProfileProps {
  user: User;
}

const PublicProfile: React.FC<PublicProfileProps> = ({ user }) => {
  return (
    <div>
      <span>Meet {user.name}</span>
    </div>
  );
};

export { PublicProfile };

import { useOutletContext } from 'react-router';
import { User } from '../types/user';

const UserProfile: React.FC = () => {
  const user = useOutletContext<User>();

  return (
    <div>
      <span>Welcome {user.name}</span>
    </div>
  );
};

export { UserProfile };

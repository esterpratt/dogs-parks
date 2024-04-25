import { Link } from 'react-router-dom';
import { User } from '../../types/user';

interface UserPreviewProps {
  user: User;
}

const UserPreview: React.FC<UserPreviewProps> = ({ user }) => {
  return <Link to={`/profile/${user.id}`}>user: {user.name}</Link>;
};

export { UserPreview };

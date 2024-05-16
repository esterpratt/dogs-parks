import { Link } from 'react-router-dom';
import { User } from '../../types/user';
import { Dog } from '../../types/dog';
import styles from './UserPreview.module.scss';

interface UserPreviewProps {
  user: User & Dog[];
}

const UserPreview: React.FC<UserPreviewProps> = ({ user }) => {
  console.log(user);
  return (
    <Link to={`/profile/${user.id}`} className={styles.container}>
      user: {user.name}
    </Link>
  );
};

export { UserPreview };

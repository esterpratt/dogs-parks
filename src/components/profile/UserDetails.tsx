import classnames from 'classnames';
import { User } from '../../types/user';
import styles from './UserDetails.module.scss';

interface UserDetailsProps {
  user: User;
  className?: string;
}

const UserDetails: React.FC<UserDetailsProps> = ({ user, className }) => {
  return (
    <table className={classnames(styles.details, className)}>
      <tbody>
        <tr>
          <td>
            <div>Name:</div>
          </td>
          <td>
            <div>{user.name}</div>
          </td>
        </tr>
      </tbody>
    </table>
  );
};

export { UserDetails };

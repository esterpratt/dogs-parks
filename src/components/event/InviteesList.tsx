import { User } from '../../types/user';
import styles from './InviteesList.module.scss';

interface InviteesListProps {
  users: User[];
  title: string;
}

const InviteesList: React.FC<InviteesListProps> = (
  props: InviteesListProps
) => {
  const { users, title } = props;

  return (
    <div className={styles.container}>
      <span>{title}</span>
      <ul className={styles.list}>
        {users.map((user) => (
          <div key={user.id} className={styles.name}>
            {user.name}
          </div>
        ))}
      </ul>
    </div>
  );
};

export { InviteesList };

import { CheckCircle, Send } from 'lucide-react';
import { User } from '../../types/user';
import styles from './InviteesList.module.scss';

interface InviteesListProps {
  users: User[];
  title: string;
  variant: 'going' | 'invited';
}

const InviteesList: React.FC<InviteesListProps> = (
  props: InviteesListProps
) => {
  const { users, title, variant } = props;

  return (
    <div className={styles.container}>
      <div
        className={`${styles.titleContainer} ${variant === 'going' ? styles.goingTitle : styles.invitedTitle}`}
      >
        {variant === 'going' ? (
          <CheckCircle size={12} className={styles.titleIcon} />
        ) : (
          <Send size={12} className={styles.titleIcon} />
        )}
        <span className={styles.title}>{title}</span>
      </div>
      <div className={styles.chipContainer}>
        {users.map((user) => (
          <div
            key={user.id}
            className={`${styles.chip} ${variant === 'going' ? styles.goingChip : styles.invitedChip}`}
          >
            <div className={styles.avatarPlaceholder} />
            <span className={styles.userName}>{user.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export { InviteesList };

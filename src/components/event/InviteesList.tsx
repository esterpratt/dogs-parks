import { CheckCircle, Send, XCircle } from 'lucide-react';
import { User } from '../../types/user';
import styles from './InviteesList.module.scss';

interface InviteesListProps {
  users: User[];
  title: string;
  variant: 'going' | 'invited' | 'declined';
}

const InviteesList: React.FC<InviteesListProps> = (
  props: InviteesListProps
) => {
  const { users, title, variant } = props;

  const getTitleClassName = () => {
    if (variant === 'going') {
      return styles.goingTitle;
    }
    if (variant === 'declined') {
      return styles.declinedTitle;
    }
    return styles.invitedTitle;
  };

  const getChipClassName = () => {
    if (variant === 'going') {
      return styles.goingChip;
    }
    if (variant === 'declined') {
      return styles.declinedChip;
    }
    return styles.invitedChip;
  };

  const renderIcon = () => {
    if (variant === 'going') {
      return <CheckCircle size={12} className={styles.titleIcon} />;
    }
    if (variant === 'declined') {
      return <XCircle size={12} className={styles.titleIcon} />;
    }
    return <Send size={12} className={styles.titleIcon} />;
  };

  return (
    <div className={styles.container}>
      <div className={`${styles.titleContainer} ${getTitleClassName()}`}>
        {renderIcon()}
        <span className={styles.title}>{title}</span>
      </div>
      <div className={styles.chipContainer}>
        {users.map((user) => (
          <div key={user.id} className={`${styles.chip} ${getChipClassName()}`}>
            <div className={styles.avatarPlaceholder} />
            <span className={styles.userName}>{user.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export { InviteesList };

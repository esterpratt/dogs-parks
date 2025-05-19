import { useContext } from 'react';
import { Check, X } from 'lucide-react';
import classnames from 'classnames';
import { Button } from '../Button';
import { UserContext } from '../../context/UserContext';
import { useUpdateFriendship } from '../../hooks/api/useUpdateFriendship';
import { FRIENDSHIP_STATUS } from '../../types/friendship';
import styles from './FriendRequestButton.module.scss';
import { useUserFriendshipMap } from '../../hooks/api/useUserFriendshipMap';

interface PublicProfileProps {
  friendId: string;
  userName: string;
  className?: string;
}

const FriendRequestButton: React.FC<PublicProfileProps> = ({
  friendId,
  userName,
  className,
}) => {
  const { userId } = useContext(UserContext);
  const { data: friendshipMap, isLoading } = useUserFriendshipMap(userId);
  const friendship = friendshipMap ? friendshipMap.get(friendId) : null;

  const { onUpdateFriendship } = useUpdateFriendship({
    friendId,
    userId: userId!,
  });

  const status = friendship?.status;
  const isFriendIsRequester = friendship?.requester_id === friendId;

  const onUpdateFriend = async (status: FRIENDSHIP_STATUS) => {
    onUpdateFriendship(status);
  };

  if (isLoading) {
    return <div className={classnames(styles.container, className)} />;
  }

  return (
    <div className={classnames(styles.container, className)}>
      {status === FRIENDSHIP_STATUS.APPROVED && (
        <>
          <span>
            <Check size={12} color={styles.green} />
            You are friends
          </span>
          <div className={styles.buttons}>
            <Button
              variant="secondary"
              onClick={() => onUpdateFriend(FRIENDSHIP_STATUS.REMOVED)}
              className={styles.button}
            >
              <X size={12} />
              <span>Unfriend</span>
            </Button>
          </div>
        </>
      )}
      {status === FRIENDSHIP_STATUS.PENDING && isFriendIsRequester && (
        <>
          <div className={styles.userName}>
            {userName} wants to be your friend!
          </div>
          <div className={styles.buttons}>
            <Button
              className={styles.button}
              variant="primary"
              onClick={() => onUpdateFriend(FRIENDSHIP_STATUS.APPROVED)}
            >
              <Check size={12} />
              <span>Accept</span>
            </Button>
            <Button
              variant="secondary"
              onClick={() => onUpdateFriend(FRIENDSHIP_STATUS.ABORTED)}
              className={styles.button}
            >
              <X size={12} />
              <span>Decline</span>
            </Button>
          </div>
        </>
      )}
      {status === FRIENDSHIP_STATUS.PENDING && !isFriendIsRequester && (
        <>
          <span>Waiting friend's response</span>
          <div className={styles.buttons}>
            <Button
              variant="secondary"
              onClick={() => onUpdateFriend(FRIENDSHIP_STATUS.ABORTED)}
              className={styles.button}
            >
              <X size={12} />
              <span>Remove request</span>
            </Button>
          </div>
        </>
      )}
      {!status && (
        <div className={styles.buttons}>
          <Button
            variant="primary"
            onClick={() => onUpdateFriend(FRIENDSHIP_STATUS.PENDING)}
            className={styles.button}
          >
            <span>Add friend</span>
          </Button>
        </div>
      )}
    </div>
  );
};

export { FriendRequestButton };

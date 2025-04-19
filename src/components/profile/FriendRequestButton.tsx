import { useContext } from 'react';
import { Check, X } from 'lucide-react';
import { Button } from '../Button';
import { useFriendshipStatus } from '../../hooks/api/useFriendshipStatus';
import { UserContext } from '../../context/UserContext';
import { useUpdateFriendship } from '../../hooks/api/useUpdateFriendship';
import { FRIENDSHIP_STATUS } from '../../types/friendship';
import { Loader } from '../Loader';
import styles from './FriendRequestButton.module.scss';

interface PublicProfileProps {
  friendId: string;
  userName: string;
}

const FriendRequestButton: React.FC<PublicProfileProps> = ({
  friendId,
  userName,
}) => {
  const { userId } = useContext(UserContext);
  const { status, isFriendIsRequester, isLoading } = useFriendshipStatus({
    friendId,
    userId: userId!,
  });

  const {
    onUpdateFriendship,
    isPendingAddFriendship,
    isPendingMutateFriendship,
    isPendingRemoveFriendship,
  } = useUpdateFriendship({
    friendId,
    userId: userId!,
  });

  const onUpdateFriend = async (status: FRIENDSHIP_STATUS) => {
    onUpdateFriendship(status);
  };

  if (isLoading) {
    return null;
  }

  return (
    <div className={styles.container}>
      {status === FRIENDSHIP_STATUS.APPROVED && (
        <>
          <span>
            <Check size={12} />
            You are friends
          </span>
          <div className={styles.buttons}>
            <Button
              variant="secondary"
              onClick={() => onUpdateFriend(FRIENDSHIP_STATUS.REMOVED)}
              className={styles.button}
            >
              {isPendingRemoveFriendship ? (
                <Loader inside className={styles.loader} />
              ) : (
                <>
                  <X size={12} />
                  <span>Unfriend</span>
                </>
              )}
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
              {isPendingMutateFriendship ? (
                <Loader inside variant="secondary" className={styles.loader} />
              ) : (
                <>
                  <Check size={12} />
                  <span>Accept</span>
                </>
              )}
            </Button>
            <Button
              variant="secondary"
              onClick={() => onUpdateFriend(FRIENDSHIP_STATUS.ABORTED)}
              className={styles.button}
            >
              {isPendingRemoveFriendship ? (
                <Loader inside className={styles.loader} />
              ) : (
                <>
                  <X size={12} />
                  <span>Decline</span>
                </>
              )}
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
              onClick={() => onUpdateFriend(FRIENDSHIP_STATUS.REMOVED)}
              className={styles.button}
            >
              {isPendingRemoveFriendship ? (
                <Loader inside className={styles.loader} />
              ) : (
                <>
                  <X size={12} />
                  <span>Remove request</span>
                </>
              )}
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
            {isPendingAddFriendship ? (
              <Loader inside variant="secondary" className={styles.loader} />
            ) : (
              <span>Add friend</span>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export { FriendRequestButton };

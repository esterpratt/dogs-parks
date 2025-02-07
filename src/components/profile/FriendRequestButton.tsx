import { useContext, useRef, useState } from 'react';
import classnames from 'classnames';
import { Button } from '../Button';
import { useFriendshipStatus } from '../../hooks/api/useFriendshipStatus';
import { UserContext } from '../../context/UserContext';
import { useUpdateFriendship } from '../../hooks/api/useUpdateFriendship';
import { ThankYouModal } from '../ThankYouModal';
import { Loader } from '../Loader';
import styles from './FriendRequestButton.module.scss';

interface PublicProfileProps {
  friendId: string;
  className?: string;
  buttonVariant?: 'green' | 'basic' | 'orange';
}

const FriendRequestButton: React.FC<PublicProfileProps> = ({
  friendId,
  className,
  buttonVariant = 'green',
}) => {
  const { userId } = useContext(UserContext);
  const { statusToUpdate, buttonText, isLoading } = useFriendshipStatus({
    friendId,
    userId: userId!,
  });
  const [isThankYouModalOpen, setIsThankYouModalOpen] = useState(false);
  const modalTitle = useRef('Friend request sent!');

  const { onUpdateFriendship, isPending } = useUpdateFriendship({
    friendId,
    userId: userId!,
    onSuccess: (text) => {
      modalTitle.current = text;
      setIsThankYouModalOpen(true);
    },
  });

  const onUpdateFriend = async () => {
    onUpdateFriendship(statusToUpdate);
  };

  if (isLoading) {
    return null;
  }

  return (
    <>
      <div className={className}>
        <Button
          className={styles.button}
          variant={buttonVariant}
          onClick={onUpdateFriend}
        >
          {buttonText}
          <div
            className={classnames(styles.loaderContainer, {
              [styles.shown]: isPending,
            })}
          >
            <Loader className={styles.loader} inside />
          </div>
        </Button>
      </div>
      <ThankYouModal
        title={modalTitle.current}
        open={isThankYouModalOpen}
        onClose={() => setIsThankYouModalOpen(false)}
      />
    </>
  );
};

export { FriendRequestButton };

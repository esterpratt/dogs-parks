import { useContext } from 'react';
import { Button } from '../Button';
import { useFriendshipStatus } from '../../hooks/api/useFriendshipStatus';
import { UserContext } from '../../context/UserContext';
import { useUpdateFriendship } from '../../hooks/api/useUpdateFriendship';

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
  const { statusToUpdate, buttonText } = useFriendshipStatus({
    friendId,
    userId: userId!,
  });

  const { onUpdateFriendship } = useUpdateFriendship({
    friendId,
    userId: userId!,
  });

  const onUpdateFriend = async () => {
    onUpdateFriendship(statusToUpdate);
  };

  return (
    <div className={className}>
      <Button variant={buttonVariant} onClick={onUpdateFriend}>
        {buttonText}
      </Button>
    </div>
  );
};

export { FriendRequestButton };

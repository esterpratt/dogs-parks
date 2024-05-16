import { useContext } from 'react';
import { Button } from '../Button';
import { UserFriendsContext } from '../../context/UserFriendsContext';
import { useFriendshipStatus } from '../../hooks/useFriendshipStatus';

interface PublicProfileProps {
  userId: string;
  className?: string;
  buttonVariant?: 'green' | 'basic' | 'orange';
}

const FriendRequestButton: React.FC<PublicProfileProps> = ({
  userId,
  className,
  buttonVariant = 'green',
}) => {
  const { updateFriendShip } = useContext(UserFriendsContext);
  const { statusToUpdate, buttonText } = useFriendshipStatus(userId);

  const onUpdateFriend = async () => {
    updateFriendShip(userId, statusToUpdate);
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

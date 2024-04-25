import { User } from '../../types/user';
import { UserPreview } from '../users/UserPreview';

interface FriendRequestsListProps {
  friends: User[];
  onApproveFriendShip: (id: User['id']) => void;
}

const FriendRequestsList: React.FC<FriendRequestsListProps> = ({
  friends,
  onApproveFriendShip,
}) => {
  return (
    <div>
      <span>Pending Friend Requests</span>
      {friends.map((friend) => {
        return (
          <div key={friend.id}>
            <UserPreview user={friend} />
            <button onClick={() => onApproveFriendShip(friend.id)}>
              Approve
            </button>
          </div>
        );
      })}
    </div>
  );
};

export { FriendRequestsList };

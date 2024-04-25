import { User } from '../../types/user';
import { UserPreview } from '../users/UserPreview';

interface FriendsListProps {
  friends: User[];
}

const FriendsList: React.FC<FriendsListProps> = ({ friends }) => {
  return (
    <div>
      <span>My Friends</span>
      {friends.map((friend) => {
        return <UserPreview key={friend.id} user={friend} />;
      })}
    </div>
  );
};

export { FriendsList };

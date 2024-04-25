import { useEffect, useState } from 'react';
import { User } from '../../types/user';
import { fetchFriends } from '../../services/users';
import { UserPreview } from '../users/UserPreview';

interface FriendsListProps {
  userId: User['id'];
}

const FriendsList: React.FC<FriendsListProps> = ({ userId }) => {
  const [friends, setFriends] = useState<User[]>([]);

  useEffect(() => {
    const getfriends = async () => {
      const friends = await fetchFriends(userId);
      setFriends(friends || []);
    };
    getfriends();
  }, [userId]);

  if (!friends.length) {
    return null;
  }

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

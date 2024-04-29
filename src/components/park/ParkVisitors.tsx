import { useContext, useEffect, useState } from 'react';
import { Park } from '../../types/park';
import { UserContext } from '../../context/UserContext';
import { User } from '../../types/user';
import { fetchCheckedInUsers } from '../../services/users';
import { fetchUserFriendships } from '../../services/friendships';
import { UserPreview } from '../users/UserPreview';

interface ParkFriendsProps {
  parkId: Park['id'];
}

const ParkVisitors: React.FC<ParkFriendsProps> = ({ parkId }) => {
  const { userId } = useContext(UserContext);
  const [users, setUsers] = useState<{ friends: User[]; nonFriends: User[] }>({
    friends: [],
    nonFriends: [],
  });

  useEffect(() => {
    const getCheckedInFriends = async () => {
      const users = await fetchCheckedInUsers(parkId);
      if (users) {
        const usersWithoutSignedInUser = users.filter(
          (user) => user.id !== userId
        );
        let friends: User[] = [];
        let nonFriends: User[] = [...usersWithoutSignedInUser];
        if (userId) {
          const userFriendships = await fetchUserFriendships({ userId });
          if (userFriendships && userFriendships.length) {
            const friendIds = userFriendships.map((friendShip) => {
              return friendShip.requesteeId === userId
                ? friendShip.requesterId
                : friendShip.requesteeId;
            });
            friends = usersWithoutSignedInUser.filter((user) =>
              friendIds.includes(user.id)
            );
            nonFriends = usersWithoutSignedInUser.filter(
              (user) => !friendIds.includes(user.id)
            );
          }
        }

        setUsers({ friends, nonFriends });
      } else {
        setUsers({
          friends: [],
          nonFriends: [],
        });
      }
    };
    getCheckedInFriends();
  }, [parkId, userId]);

  if (!users.friends.length && !users.nonFriends.length) {
    return null;
  }

  return (
    <div>
      {!!users.friends.length && (
        <div>
          <span>Your Friends that in the park right now:</span>
          {users.friends.map((user) => (
            <UserPreview key={user.id} user={user} />
          ))}
        </div>
      )}
      {!!users.nonFriends.length && (
        <div>
          <span>
            {users.friends.length ? 'Other v' : 'V'}isitors in the park
          </span>
          {users.nonFriends.map((user) => (
            <UserPreview key={user.id} user={user} />
          ))}
        </div>
      )}
    </div>
  );
};

export { ParkVisitors };

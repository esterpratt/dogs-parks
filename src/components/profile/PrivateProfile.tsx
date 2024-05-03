import { useContext, useEffect, useState } from 'react';
import { User } from '../../types/user';
import { FriendRequestsList } from './FriendRequestsList';
import { FriendsList } from './FriendsList';
import { fetchFriends } from '../../services/users';
import { FRIENDSHIP_STATUS, USER_ROLE } from '../../types/friendship';
import { fetchFriendship, updateFriendship } from '../../services/friendships';
import { UserContext } from '../../context/UserContext';
import { Dog } from '../../types/dog';
import { Dogs } from './Dogs';

interface PrivateProfileProps {
  user: User;
  dogs?: Dog[];
}

const PrivateProfile: React.FC<PrivateProfileProps> = ({ user, dogs = [] }) => {
  // TODO: remove to context/new component so other components in this page won't rerender
  const [friends, setFriends] = useState<User[]>([]);
  const [pendingFriends, setPendingFriends] = useState<User[]>([]);
  const { userLogout } = useContext(UserContext);

  useEffect(() => {
    const getPendingFriends = async () => {
      try {
        const pendingFriends = await fetchFriends({
          userId: user.id,
          userRole: USER_ROLE.REQUESTEE,
          status: FRIENDSHIP_STATUS.PENDING,
        });
        if (pendingFriends) {
          setPendingFriends(pendingFriends);
        }
      } catch (error) {
        console.log(error);
      }
    };

    const getfriends = async () => {
      try {
        const friends = await fetchFriends({ userId: user.id });
        if (friends) {
          setFriends(friends);
        }
      } catch (error) {
        console.log(error);
      }
    };
    getfriends();
    getPendingFriends();
  }, [user.id]);

  const onApproveFriendShip = async (friendId: User['id']) => {
    const friendShip = await fetchFriendship([friendId, user.id]);
    await updateFriendship({
      friendshipId: friendShip!.id,
      status: FRIENDSHIP_STATUS.APPROVED,
    });
    const newFriend = pendingFriends.find((friend) => friend.id === friendId);
    setPendingFriends((prev) =>
      prev.filter((friend) => friend.id !== friendId)
    );
    setFriends((prev) => [...prev, newFriend!]);
  };

  return (
    <div>
      <span>Welcome {user.name}</span>
      <button onClick={userLogout}>Logout</button>
      <Dogs dogs={dogs} />
      {!!friends.length && <FriendsList friends={friends} />}
      {!!pendingFriends.length && (
        <FriendRequestsList
          friends={pendingFriends}
          onApproveFriendShip={onApproveFriendShip}
        />
      )}
    </div>
  );
};

export { PrivateProfile };

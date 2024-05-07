import { PropsWithChildren, createContext, useEffect, useState } from 'react';
import { User } from '../types/user';
import { useOnAuthStateChanged } from '../hooks/useOnAuthStateChanged';
import { fetchFriends } from '../services/users';
import { FRIENDSHIP_STATUS, USER_ROLE } from '../types/friendship';
import { fetchFriendship, updateFriendship } from '../services/friendships';

interface UserFriendsContextObj {
  friends: User[];
  pendingFriends: User[];
  approveFriendShip: (friendId: string) => void;
}

const initialData: UserFriendsContextObj = {
  friends: [],
  pendingFriends: [],
  approveFriendShip: () => {},
};

const UserFriendsContext = createContext<UserFriendsContextObj>(initialData);

const UserFriendsContextProvider: React.FC<PropsWithChildren> = ({
  children,
}) => {
  const { userId } = useOnAuthStateChanged();
  const [friends, setFriends] = useState<User[]>([]);
  const [pendingFriends, setPendingFriends] = useState<User[]>([]);

  useEffect(() => {
    const getFriends = async () => {
      const fetchFriendsPromise = fetchFriends({ userId: userId! });
      const fetchPendingFriendsPromise = fetchFriends({
        userId: userId!,
        userRole: USER_ROLE.REQUESTEE,
        status: FRIENDSHIP_STATUS.PENDING,
      });

      const [friends, pendingFriends] = await Promise.all([
        fetchFriendsPromise,
        fetchPendingFriendsPromise,
      ]);

      if (friends?.length) {
        setFriends(friends);
      } else {
        setFriends([]);
      }

      if (pendingFriends?.length) {
        setPendingFriends(pendingFriends);
      } else {
        setPendingFriends([]);
      }
    };

    if (userId) {
      getFriends();
    } else {
      setFriends([]);
      setPendingFriends([]);
    }
  }, [userId]);

  const approveFriendShip = async (friendId: string) => {
    const friendShip = await fetchFriendship([friendId, userId!]);
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

  const value: UserFriendsContextObj = {
    friends,
    pendingFriends,
    approveFriendShip,
  };

  return (
    <UserFriendsContext.Provider value={value}>
      {children}
    </UserFriendsContext.Provider>
  );
};

export { UserFriendsContextProvider, UserFriendsContext };

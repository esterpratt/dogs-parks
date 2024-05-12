import { PropsWithChildren, createContext, useEffect, useState } from 'react';
import { User } from '../types/user';
import { useOnAuthStateChanged } from '../hooks/useOnAuthStateChanged';
import { fetchFriends, fetchUser } from '../services/users';
import { FRIENDSHIP_STATUS, USER_ROLE } from '../types/friendship';
import {
  createFriendship,
  deleteFriendship,
  fetchFriendship,
  updateFriendship,
} from '../services/friendships';

interface UserFriendsContextObj {
  friends: User[];
  pendingFriends: User[];
  myPendingFriends: User[];
  updateFriendShip: (friendId: string, status: FRIENDSHIP_STATUS) => void;
}

const initialData: UserFriendsContextObj = {
  friends: [],
  pendingFriends: [],
  myPendingFriends: [],
  updateFriendShip: () => {},
};

const UserFriendsContext = createContext<UserFriendsContextObj>(initialData);

const UserFriendsContextProvider: React.FC<PropsWithChildren> = ({
  children,
}) => {
  const { userId } = useOnAuthStateChanged();
  const [friends, setFriends] = useState<User[]>([]);
  const [pendingFriends, setPendingFriends] = useState<User[]>([]);
  const [myPendingFriends, setMyPendingFriends] = useState<User[]>([]);

  useEffect(() => {
    const getFriends = async () => {
      const fetchFriendsPromise = fetchFriends({ userId: userId! });
      const fetchPendingFriendsPromise = fetchFriends({
        userId: userId!,
        userRole: USER_ROLE.REQUESTEE,
        status: FRIENDSHIP_STATUS.PENDING,
      });
      const fetchMyPendingFriendsPromise = fetchFriends({
        userId: userId!,
        userRole: USER_ROLE.REQUESTER,
        status: FRIENDSHIP_STATUS.PENDING,
      });

      const [friends, pendingFriends, myPendingFriends] = await Promise.all([
        fetchFriendsPromise,
        fetchPendingFriendsPromise,
        fetchMyPendingFriendsPromise,
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

      if (myPendingFriends?.length) {
        setMyPendingFriends(myPendingFriends);
      } else {
        setMyPendingFriends([]);
      }
    };

    if (userId) {
      getFriends();
    } else {
      setFriends([]);
      setPendingFriends([]);
      setMyPendingFriends([]);
    }
  }, [userId]);

  const updateFriendShip = async (
    friendId: string,
    status: FRIENDSHIP_STATUS
  ) => {
    const friendship = await fetchFriendship([friendId, userId!]);

    if (friendship) {
      if (
        status === FRIENDSHIP_STATUS.ABORTED ||
        status === FRIENDSHIP_STATUS.REMOVED
      ) {
        await deleteFriendship(friendship.id);
        setFriends((prev) => prev.filter((friend) => friend.id !== friendId));
        setMyPendingFriends((prev) =>
          prev.filter((friend) => friend.id !== friendId)
        );
      } else {
        await updateFriendship({
          friendshipId: friendship!.id,
          status,
        });
        const newFriend = pendingFriends.find(
          (friend) => friend.id === friendId
        );
        setPendingFriends((prev) =>
          prev.filter((friend) => friend.id !== friendId)
        );
        setFriends((prev) => [...prev, newFriend!]);
      }
    } else if (status === FRIENDSHIP_STATUS.PENDING) {
      await createFriendship({ requesteeId: friendId, requesterId: userId! });
      const newFriend = await fetchUser(friendId);
      if (newFriend) {
        setMyPendingFriends((prev) => [...prev, newFriend]);
      }
    }
  };

  const value: UserFriendsContextObj = {
    friends,
    pendingFriends,
    myPendingFriends,
    updateFriendShip,
  };

  return (
    <UserFriendsContext.Provider value={value}>
      {children}
    </UserFriendsContext.Provider>
  );
};

export { UserFriendsContextProvider, UserFriendsContext };

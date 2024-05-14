import { PropsWithChildren, createContext, useEffect, useReducer } from 'react';
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

enum FRIENDS_ACTION_TYPE {
  FETCH_FRIENDS = 'FETCH_FRIENDS',
  EMPTY_FRIENDS = 'EMPTY_FRIENDS',
  UPDATE_FRIENDSHIP = 'UPDATE_FRIENDSHIP',
  DELETE_FRIENDSHIP = 'DELETE_FRIENDSHIP',
  CREATE_FRIENDSHIP = 'CREATE_FRIENDSHIP',
}

interface FriendsState {
  friends: User[];
  pendingFriends: User[];
  myPendingFriends: User[];
}

interface FriendsAction {
  type: FRIENDS_ACTION_TYPE;
  payload?: Partial<FriendsState> | { friendId: string } | { newFriend: User };
}

interface UserFriendsContextObj extends FriendsState {
  updateFriendShip: (friendId: string, status: FRIENDSHIP_STATUS) => void;
}

const friendsInitialData = {
  friends: [],
  pendingFriends: [],
  myPendingFriends: [],
};

const initialData: UserFriendsContextObj = {
  ...friendsInitialData,
  updateFriendShip: () => {},
};

const UserFriendsContext = createContext<UserFriendsContextObj>(initialData);

const friendsReducer = (state: FriendsState, action: FriendsAction) => {
  switch (action.type) {
    case FRIENDS_ACTION_TYPE.FETCH_FRIENDS: {
      const { friends, pendingFriends, myPendingFriends } =
        action.payload as FriendsState;
      return {
        friends: friends || [],
        pendingFriends: pendingFriends || [],
        myPendingFriends: myPendingFriends || [],
      };
    }
    case FRIENDS_ACTION_TYPE.EMPTY_FRIENDS: {
      return {
        friends: [],
        pendingFriends: [],
        myPendingFriends: [],
      };
    }
    case FRIENDS_ACTION_TYPE.DELETE_FRIENDSHIP: {
      const { friendId } = action.payload as { friendId: string };
      return {
        ...state,
        friends: state.friends!.filter((friend) => friend.id !== friendId),
        myPendingFriends: state.myPendingFriends!.filter(
          (friend) => friend.id !== friendId
        ),
      };
    }
    case FRIENDS_ACTION_TYPE.CREATE_FRIENDSHIP: {
      const { newFriend } = action.payload as { newFriend: User };
      return {
        ...state,
        myPendingFriends: [...state.myPendingFriends, newFriend],
      };
    }
    case FRIENDS_ACTION_TYPE.UPDATE_FRIENDSHIP: {
      const { friendId } = action.payload as { friendId: string };
      const newFriend = state.pendingFriends.find(
        (friend) => friend.id === friendId
      );
      return {
        ...state,
        pendingFriends: state.pendingFriends.filter(
          (friend) => friend.id !== friendId
        ),
        friends: [...state.friends, newFriend!],
      };
    }
    default: {
      return state;
    }
  }
};

const UserFriendsContextProvider: React.FC<PropsWithChildren> = ({
  children,
}) => {
  const { userId } = useOnAuthStateChanged();
  const [friendsState, friendsDispatch] = useReducer(friendsReducer, {
    friends: [],
    pendingFriends: [],
    myPendingFriends: [],
  });

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
      friendsDispatch({
        type: FRIENDS_ACTION_TYPE.FETCH_FRIENDS,
        payload: { friends, pendingFriends, myPendingFriends },
      });
    };
    if (userId) {
      getFriends();
    } else {
      friendsDispatch({ type: FRIENDS_ACTION_TYPE.EMPTY_FRIENDS });
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
        friendsDispatch({
          type: FRIENDS_ACTION_TYPE.DELETE_FRIENDSHIP,
          payload: { friendId },
        });
      } else {
        await updateFriendship({
          friendshipId: friendship!.id,
          status,
        });
        friendsDispatch({
          type: FRIENDS_ACTION_TYPE.UPDATE_FRIENDSHIP,
          payload: { friendId },
        });
      }
    } else if (status === FRIENDSHIP_STATUS.PENDING) {
      await createFriendship({ requesteeId: friendId, requesterId: userId! });
      const newFriend = await fetchUser(friendId);
      if (newFriend) {
        friendsDispatch({
          type: FRIENDS_ACTION_TYPE.CREATE_FRIENDSHIP,
          payload: { newFriend },
        });
      }
    }
  };

  const value: UserFriendsContextObj = {
    friends: friendsState.friends,
    pendingFriends: friendsState.pendingFriends,
    myPendingFriends: friendsState.myPendingFriends,
    updateFriendShip,
  };

  return (
    <UserFriendsContext.Provider value={value}>
      {children}
    </UserFriendsContext.Provider>
  );
};

export { UserFriendsContextProvider, UserFriendsContext };

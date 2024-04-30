import { ReactNode, createContext, useEffect, useState } from 'react';
import { User } from '../../types/user';
import { fetchCheckedInUsers } from '../../services/users';
import { fetchUserFriendships } from '../../services/friendships';

interface ParksVisitorContextProps {
  visitors: {
    friends: User[];
    others: User[];
  };
}

interface ParksVisitorContextProviderProps {
  children: ReactNode;
  parkId: string;
  userId?: string;
}

const initialValue: ParksVisitorContextProps = {
  visitors: {
    friends: [],
    others: [],
  },
};

const ParkVisitorsContext = createContext(initialValue);

const ParkVisitorsContextProvider: React.FC<
  ParksVisitorContextProviderProps
> = ({ children, parkId, userId }) => {
  const [visitors, setVisitors] = useState<
    ParksVisitorContextProps['visitors']
  >({
    friends: [],
    others: [],
  });

  useEffect(() => {
    const getCheckedInFriends = async () => {
      const users = await fetchCheckedInUsers(parkId);
      if (users) {
        const usersWithoutSignedInUser = users.filter(
          (user) => user.id !== userId
        );
        let friends: User[] = [];
        let others: User[] = [...usersWithoutSignedInUser];
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
            others = usersWithoutSignedInUser.filter(
              (user) => !friendIds.includes(user.id)
            );
          }
        }

        setVisitors({ friends, others });
      } else {
        setVisitors({
          friends: [],
          others: [],
        });
      }
    };
    getCheckedInFriends();
  }, [parkId, userId]);

  const value = {
    visitors,
  };

  return (
    <ParkVisitorsContext.Provider value={value}>
      {children}
    </ParkVisitorsContext.Provider>
  );
};

export { ParkVisitorsContext, ParkVisitorsContextProvider };

import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { fetchParkCheckins } from '../services/checkins';
import { UserFriendsContext, UserWithDogs } from './UserFriendsContext';
import { UserContext } from './UserContext';

interface ParksVisitorContextProps {
  friends: UserWithDogs[];
  othersCount: number;
}

interface ParksVisitorContextProviderProps {
  children: ReactNode;
  parkId: string;
}

const initialValue: ParksVisitorContextProps = {
  friends: [],
  othersCount: 0,
};

const ParkVisitorsContext = createContext(initialValue);

const ParkVisitorsContextProvider: React.FC<
  ParksVisitorContextProviderProps
> = ({ children, parkId }) => {
  const { userId } = useContext(UserContext);
  const { friends } = useContext(UserFriendsContext);
  const [visitors, setVisitors] = useState<string[]>([]);

  const friendsOnPark = useMemo(
    () => friends.filter((friend) => visitors.includes(friend.id)),
    [friends, visitors]
  );

  useEffect(() => {
    const getCheckedIns = async () => {
      const checkins = await fetchParkCheckins(parkId);
      if (checkins && checkins.length) {
        const userIds = checkins.map((checkin) => checkin.userId);
        setVisitors(userIds);
      } else {
        setVisitors([]);
      }
    };
    getCheckedIns();
  }, [parkId]);

  const value = {
    friends: friendsOnPark,
    othersCount:
      userId && visitors.includes(userId)
        ? visitors.length - friendsOnPark.length - 1
        : visitors.length - friendsOnPark.length,
  };

  return (
    <ParkVisitorsContext.Provider value={value}>
      {children}
    </ParkVisitorsContext.Provider>
  );
};

export { ParkVisitorsContext, ParkVisitorsContextProvider };

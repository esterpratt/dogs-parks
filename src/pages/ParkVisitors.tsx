import { useContext } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { UserPreview } from '../components/users/UserPreview';
import styles from './ParkVisitors.module.scss';
import { useQuery } from '@tanstack/react-query';
import { UserContext } from '../context/UserContext';
import { fetchUsers } from '../services/users';
import { Park } from '../types/park';
import { Loading } from '../components/Loading';
import { fetchUsersDogs } from '../services/dogs';
import { useParkVisitors } from '../hooks/useParkVisitors';

const ParkVisitors: React.FC = () => {
  const { userId } = useContext(UserContext);
  const { park } = useOutletContext() as { park: Park };

  const {
    visitorIds,
    friendIds,
    friendInParkIds,
    isPendingFriends: isPendingFriendIds,
    isPendingVisitors,
  } = useParkVisitors(park.id);

  const { data: friends = [], isPending: isPendingFriends } = useQuery({
    queryKey: ['friends', userId],
    queryFn: () => fetchUsers(friendIds),
    enabled: !!friendInParkIds.length,
  });

  const { data: friendsWithDogs = [], isPending: isPendingDogs } = useQuery({
    queryKey: ['friendsDogs', friendIds],
    queryFn: async () => {
      const dogs = await fetchUsersDogs(friendInParkIds);
      return dogs
        ? friends.map((friend) => {
            return {
              ...friend,
              dogs: dogs.filter((dog) => dog.owner === friend.id),
            };
          })
        : [];
    },
    enabled: !!friends.length,
  });

  const friendsCount = friends.length;
  const othersCount = visitorIds.length - friendsCount;

  if (
    isPendingDogs ||
    isPendingVisitors ||
    isPendingFriendIds ||
    isPendingFriends
  ) {
    return <Loading />;
  }

  if (!friendsCount && !othersCount) {
    return null;
  }

  return (
    <div className={styles.container}>
      {!!friendsCount && (
        <div className={styles.friendsContainer}>
          <span className={styles.friendsTitle}>
            Your Friends that in the park right now:
          </span>
          {friendsWithDogs.map((user) => (
            <UserPreview key={user.id} user={user} />
          ))}
        </div>
      )}
      {!!othersCount && (
        <div className={styles.othersContainer}>
          <span className={styles.othersTitle}>
            There {othersCount > 1 ? 'are' : 'is'} {othersCount}{' '}
            {!!friendsCount && 'more'} visitor
            {othersCount > 1 && 's'} in the park right now.
          </span>
          {!friendsCount && (
            <>
              <span>You can only see friends' details.</span>
              <Link to="/users">Search for new friends here</Link>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ParkVisitors;

import { useContext } from 'react';
import { Link, useParams } from 'react-router-dom';
import { UserPreview } from '../components/users/UserPreview';
import styles from './ParkVisitors.module.scss';
import { useQuery } from '@tanstack/react-query';
import { UserContext } from '../context/UserContext';
import { fetchUsers } from '../services/users';
import { Loading } from '../components/Loading';
import { useParkVisitors } from '../hooks/useParkVisitors';
import { useGetFriendsWithDogs } from '../hooks/useGetFriendsWithDogs';

const ParkVisitors: React.FC = () => {
  const { userId } = useContext(UserContext);
  const { id: parkId } = useParams();

  const {
    visitorIds,
    friendIds,
    friendInParkIds,
    isLoadingFriendIds,
    isLoadingVisitors,
  } = useParkVisitors(parkId!);

  const { data: friends = [], isLoading: isLoadingFriends } = useQuery({
    queryKey: ['friends', userId, 'approved', 'users'],
    queryFn: () => fetchUsers(friendIds),
    enabled: !!friendInParkIds.length,
  });

  const friendsInPark = friends.filter((friend) =>
    friendInParkIds.includes(friend.id)
  );

  const { friendsWithDogs = [], isLoading: isLoadingDogs } =
    useGetFriendsWithDogs({
      additionalQueryKey: friendInParkIds,
      friendIds: friendInParkIds,
      friendsToMap: friendsInPark,
      enabled: !!friendsInPark.length,
    });

  const friendsCount = friendsInPark.length;
  const othersCount = visitorIds.length - friendsCount;

  if (
    isLoadingDogs ||
    isLoadingFriendIds ||
    isLoadingVisitors ||
    isLoadingFriends
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

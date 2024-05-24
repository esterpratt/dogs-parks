import { useContext } from 'react';
import { Link, useParams } from 'react-router-dom';
import { UserPreview } from '../components/users/UserPreview';
import styles from './ParkVisitors.module.scss';
import { useQuery } from '@tanstack/react-query';
import { UserContext } from '../context/UserContext';
import { fetchUsersWithDogsByIds } from '../services/users';
import { Loading } from '../components/Loading';
import { useParkVisitors } from '../hooks/api/useParkVisitors';

const ParkVisitors: React.FC = () => {
  const { userId } = useContext(UserContext);
  const { id: parkId } = useParams();

  const {
    visitorsIds,
    friendsInParkIds,
    isLoadingFriendsIds,
    isLoadingVisitors,
  } = useParkVisitors(parkId!, userId);

  const { data: friendsInParkWithDogs = [], isLoading: isLoadingDogs } =
    useQuery({
      queryKey: ['parkVisitorsWithDogs', parkId],
      queryFn: () => fetchUsersWithDogsByIds(friendsInParkIds),
      enabled: !!friendsInParkIds.length,
    });

  const friendsCount = friendsInParkIds.length;
  const othersCount = visitorsIds.length - friendsCount;

  if (isLoadingDogs || isLoadingFriendsIds || isLoadingVisitors) {
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
          {friendsInParkWithDogs.map((user) => (
            <UserPreview
              key={user.id}
              user={user}
              showFriendshipButton={false}
            />
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

import { useContext } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { UserPreview } from '../components/users/UserPreview';
import { UserContext } from '../context/UserContext';
import { fetchUsersWithDogsByIds } from '../services/users';
import { useGetParkVisitors } from '../hooks/api/useGetParkVisitors';
import { Button } from '../components/Button';
import styles from './ParkVisitors.module.scss';
import { Park } from '../types/park';
import { useDelayedLoading } from '../hooks/useDelayedLoading';
import { Loader } from '../components/Loader';

const ParkVisitors: React.FC = () => {
  const { userId } = useContext(UserContext);
  const { id: parkId } = useOutletContext() as Park;

  const { visitorsIds, friendsInParkIds } = useGetParkVisitors(parkId!, userId);

  const { data: friendsInParkWithDogs, isLoading } = useQuery({
    queryKey: ['parkVisitorsWithDogs', parkId],
    queryFn: () => fetchUsersWithDogsByIds(friendsInParkIds),
    enabled: !!friendsInParkIds.length,
    staleTime: 6000,
  });

  const { showLoader } = useDelayedLoading({ isLoading });

  const friendsCount = friendsInParkIds.length;
  const othersCount = visitorsIds.length - friendsCount;
  const userIsVisitor = userId && visitorsIds.includes(userId);
  const userIsOnlyVisitor =
    userIsVisitor && othersCount === 1 && friendsCount === 0;
  const othersWithoutUserCount = userIsVisitor ? othersCount - 1 : othersCount;

  if (!friendsCount && !othersCount) {
    return null;
  }

  if (showLoader) {
    return <Loader inside className={styles.loader} />;
  }

  return (
    <div className={styles.container}>
      {!!friendsCount && !isLoading && (
        <div className={styles.friendsContainer}>
          <span className={styles.friendsTitle}>
            Friends at the park right now
          </span>
          {friendsInParkWithDogs?.map((user) => (
            <UserPreview
              key={user.id}
              user={user}
              showFriendshipButton={false}
            />
          ))}
        </div>
      )}
      {!!othersCount && !isLoading && (
        <div className={styles.othersContainer}>
          <div className={styles.othersTitle}>
            {userIsOnlyVisitor ? (
              'You are the only Klabhuber at the park right now'
            ) : othersWithoutUserCount ? (
              <>
                {othersWithoutUserCount}
                {(!!friendsCount || userIsVisitor) && ' more'} Klabhuber
                {othersWithoutUserCount > 1 && 's'} at the park right now
              </>
            ) : null}
          </div>
          {!friendsCount && !userIsOnlyVisitor && (
            <div className={styles.notFriends}>
              <span>You can only see friends' details</span>
              <div>
                <span>Sniff out some friends </span>
                <Button variant="simple">
                  <Link to="/users">here!</Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ParkVisitors;

import { useContext } from 'react';
import { Link, useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { UserPreview } from '../components/users/UserPreview';
import { UserContext } from '../context/UserContext';
import { fetchUsersWithDogsByIds } from '../services/users';
import { Loader } from '../components/Loader';
import { useGetParkVisitors } from '../hooks/api/useGetParkVisitors';
import { useDelayedLoading } from '../hooks/useDelayedLoading';
import { Button } from '../components/Button';
import styles from './ParkVisitors.module.scss';

const ParkVisitors: React.FC = () => {
  const { userId } = useContext(UserContext);
  const { id: parkId } = useParams();

  const {
    visitorsIds,
    friendsInParkIds,
    isLoadingFriendsIds,
    isLoadingVisitors,
  } = useGetParkVisitors(parkId!, userId);

  const { data: friendsInParkWithDogs, isLoading: isLoadingFriends } = useQuery(
    {
      queryKey: ['parkVisitorsWithDogs', parkId],
      queryFn: () => fetchUsersWithDogsByIds(friendsInParkIds),
      enabled: !!friendsInParkIds.length,
    }
  );

  const { showLoader } = useDelayedLoading({
    isLoading: isLoadingFriends || isLoadingFriendsIds || isLoadingVisitors,
    minDuration: 1000,
  });

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
    return <Loader />;
  }

  return (
    <div className={styles.container}>
      {!!friendsCount && (
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
      {!showLoader && !!othersCount && (
        <div className={styles.othersContainer}>
          <span className={styles.othersTitle}>
            {userIsOnlyVisitor ? (
              'You are the only visitor in the park right now'
            ) : othersWithoutUserCount ? (
              <>
                {othersWithoutUserCount}
                {(!!friendsCount || userIsVisitor) && ' more'} visitor
                {othersWithoutUserCount > 1 && 's'} at the park right now
              </>
            ) : null}
          </span>
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

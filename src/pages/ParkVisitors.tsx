import { useContext } from 'react';
import { Link } from 'react-router-dom';
import { UserPreview } from '../components/users/UserPreview';
import { ParkVisitorsContext } from '../context/ParkVisitorsContext';
import styles from './ParkVisitors.module.scss';

const ParkVisitors: React.FC = () => {
  const { friends, othersCount } = useContext(ParkVisitorsContext);
  const friendsCount = friends.length;

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
          {friends.map((user) => (
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

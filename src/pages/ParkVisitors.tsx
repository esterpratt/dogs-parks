import { useContext } from 'react';
import { UserPreview } from '../components/users/UserPreview';
import { ParkVisitorsContext } from '../context/ParkVisitorsContext';
import { Link } from 'react-router-dom';

const ParkVisitors: React.FC = () => {
  const { visitors } = useContext(ParkVisitorsContext);
  const friendsCount = visitors.friends.length;
  const othersCount = visitors.others.length;

  if (!friendsCount && !othersCount) {
    return null;
  }

  return (
    <div>
      {!!friendsCount && (
        <div>
          <span>Your Friends that in the park right now:</span>
          {visitors.friends.map((user) => (
            <UserPreview key={user.id} user={user} />
          ))}
        </div>
      )}
      {!!othersCount && (
        <div>
          {friendsCount ? (
            <span>
              There {othersCount > 1 ? 'are' : 'is'} {othersCount} more visitor
              {othersCount > 1 && 's'} in the park right now
            </span>
          ) : (
            <span>
              None of the current visitors in the park is your friend.{' '}
              <Link to="/users">Search for new friends</Link>
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default ParkVisitors;

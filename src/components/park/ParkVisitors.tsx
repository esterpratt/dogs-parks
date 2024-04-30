import { useContext } from 'react';
import { Park } from '../../types/park';
import { UserPreview } from '../users/UserPreview';
import { ParkVisitorsContext } from './ParkVisitorsContext';

interface ParkFriendsProps {
  parkId: Park['id'];
}

const ParkVisitors: React.FC<ParkFriendsProps> = () => {
  const { visitors } = useContext(ParkVisitorsContext);

  if (!visitors.friends.length && !visitors.others.length) {
    return null;
  }

  return (
    <div>
      {!!visitors.friends.length && (
        <div>
          <span>Your Friends that in the park right now:</span>
          {visitors.friends.map((user) => (
            <UserPreview key={user.id} user={user} />
          ))}
        </div>
      )}
      {!!visitors.others.length && (
        <div>
          <span>
            {visitors.friends.length ? 'Other v' : 'V'}isitors in the park
          </span>
          {visitors.others.map((user) => (
            <UserPreview key={user.id} user={user} />
          ))}
        </div>
      )}
    </div>
  );
};

export { ParkVisitors };

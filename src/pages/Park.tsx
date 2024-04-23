import { useLoaderData } from 'react-router';
import { Park as ParkType } from '../types/park';
import { ParkGallery } from '../components/ParkGallery';
import { checkin, checkout } from '../services/checkins';
import { useContext } from 'react';
import { UserContext } from '../context/UserContext';
import { useLocalStorage } from '../hooks/useLocalStorage';

const Park: React.FC = () => {
  const park = useLoaderData() as ParkType;
  const [checkIn, setCheckIn] = useLocalStorage('checkin');
  const { user } = useContext(UserContext);

  const shouldCheckIn = !checkIn || checkIn.parkId !== park.id;

  const onCheckIn = async () => {
    if (!shouldCheckIn) {
      await checkout(checkIn.id);
      setCheckIn(null);
    } else {
      const id = await checkin({ userId: user?.id, parkId: park.id });
      if (id) {
        setCheckIn({ id, parkId: park.id });
      }
      // else there was an error while checkin, for now I return null
    }
  };

  return (
    <div>
      <span>Park: {park.name}</span>
      <button onClick={onCheckIn}>
        {!shouldCheckIn ? 'Check Out' : 'Check In'}
      </button>
      <ParkGallery parkId={park.id} />
    </div>
  );
};

export { Park };

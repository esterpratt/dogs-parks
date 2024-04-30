import { checkin, checkout } from '../../services/checkins';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { Modal } from '../Modal';
import { DogsCount } from './DogsCount';
import { reportDogsCount } from '../../services/dogsCount';
import { useState } from 'react';

const ParkCheckIn: React.FC<{
  parkId: string;
  userId: string;
  userName?: string;
}> = ({ parkId, userId, userName }) => {
  const [checkIn, setCheckIn] = useLocalStorage('checkin');
  const [openDogsCountModal, setOpenDogsCountModal] = useState(false);

  const shouldCheckIn =
    !checkIn || checkIn.parkId !== parkId || checkIn.userId !== userId;

  const onCheckIn = async () => {
    if (!shouldCheckIn) {
      await checkout(checkIn.id);
      setCheckIn(null);
    } else {
      const id = await checkin({ userId, parkId });
      if (id) {
        setCheckIn({ id, parkId, userId });
        setOpenDogsCountModal(true);
      }
      // else there was an error while checkin, for now I return null
    }
  };

  const onSubmitDogsCount = async (dogsCount: string) => {
    // TODO: add animation of thank you before closing - not important if report was succesfull
    const numDogsCount = Number(dogsCount);
    try {
      await reportDogsCount({
        parkId,
        dogsCount: numDogsCount,
        userId,
      });
    } finally {
      setOpenDogsCountModal(false);
    }
  };

  return (
    <div>
      <button onClick={onCheckIn}>
        {!shouldCheckIn ? 'Check Out' : 'Check In'}
      </button>
      <Modal
        open={openDogsCountModal}
        onClose={() => setOpenDogsCountModal(false)}
      >
        <div>
          <p>Have a nice stay ${userName}!</p>
          <DogsCount onSubmitDogsCount={onSubmitDogsCount} />
        </div>
      </Modal>
    </div>
  );
};

export { ParkCheckIn };

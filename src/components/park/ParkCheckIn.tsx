import { checkin, checkout } from '../../services/checkins';
import { useContext, useState } from 'react';
import { UserContext } from '../../context/UserContext';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { Modal } from '../Modal';
import { DogsCount } from './DogsCount';
import { reportDogsCount } from '../../services/dogsCount';

const ParkCheckIn = ({ parkId }: { parkId: string }) => {
  const [checkIn, setCheckIn] = useLocalStorage('checkin');
  const [openDogsCountModal, setOpenDogsCountModal] = useState(false);
  const { user } = useContext(UserContext);

  const shouldCheckIn = !checkIn || checkIn.parkId !== parkId;

  const onCheckIn = async () => {
    if (!shouldCheckIn) {
      await checkout(checkIn.id);
      setCheckIn(null);
    } else {
      const id = await checkin({ userId: user?.id, parkId });
      if (id) {
        setCheckIn({ id, parkId });
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
        userId: user?.id,
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
          <p>Have a nice stay{user && `, ${user.name}`}!</p>
          <DogsCount onSubmitDogsCount={onSubmitDogsCount} />
        </div>
      </Modal>
    </div>
  );
};

export { ParkCheckIn };

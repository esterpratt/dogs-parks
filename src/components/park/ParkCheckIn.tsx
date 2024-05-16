import { useContext, useState } from 'react';
import { TbPennant, TbPennantOff } from 'react-icons/tb';
import { checkin, checkout } from '../../services/checkins';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { Modal } from '../Modal';
import { DogsCount } from './DogsCount';
import { reportDogsCount } from '../../services/dogsCount';
import { Button } from '../Button';
import styles from './ParkCheckIn.module.scss';
import { IconContext } from 'react-icons';
import { ReviewModal } from '../ReviewModal';
import { ParkReviewsContext } from '../../context/ParkReviewsContext';

const ParkCheckIn: React.FC<{
  parkId: string;
  userId: string;
  userName?: string;
}> = ({ parkId, userId, userName }) => {
  const [checkIn, setCheckIn] = useLocalStorage('checkin');
  const [openDogsCountModal, setOpenDogsCountModal] = useState(false);
  const [openReviewModal, setOpenReviewModal] = useState(false);
  const { addReview } = useContext(ParkReviewsContext);

  const shouldCheckIn =
    !checkIn || checkIn.parkId !== parkId || checkIn.userId !== userId;

  const onCheckIn = async () => {
    if (!shouldCheckIn) {
      await checkout(checkIn.id);
      setCheckIn(null);
      setOpenReviewModal(true);
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
    // TODO: add animation of thank you before closing - not important if report was succesfull or not
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

  const onSubmitReview = async (review: {
    title: string;
    content?: string;
    rank: number;
  }) => {
    setOpenReviewModal(false);
    addReview(review, userId!);
  };

  return (
    <div>
      <Button onClick={onCheckIn} className={styles.button}>
        {!shouldCheckIn ? (
          <IconContext.Provider
            value={{ className: styles.checkoutIcon, size: '32' }}
          >
            <TbPennantOff />
          </IconContext.Provider>
        ) : (
          <IconContext.Provider
            value={{ className: styles.checkinIcon, size: '32' }}
          >
            <TbPennant />
          </IconContext.Provider>
        )}
      </Button>
      <Modal
        height="50%"
        className={styles.dogsCountModal}
        open={openDogsCountModal}
        onClose={() => setOpenDogsCountModal(false)}
      >
        <div className={styles.modalContent}>
          <div className={styles.title}>Have a nice stay {userName}!</div>
          <DogsCount onSubmitDogsCount={onSubmitDogsCount} />
        </div>
      </Modal>
      <ReviewModal
        title="Hope you had a great time! We will be happy if you could add a review!"
        isOpen={openReviewModal}
        closeModal={() => setOpenReviewModal(false)}
        onSubmitReview={onSubmitReview}
      />
    </div>
  );
};

export { ParkCheckIn };

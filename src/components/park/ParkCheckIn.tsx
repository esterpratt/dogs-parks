import { useState } from 'react';
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
import { useAddReview } from '../../hooks/api/useAddReview';
import { useMutation } from '@tanstack/react-query';
import { queryClient } from '../../services/react-query';

const ParkCheckIn: React.FC<{
  parkId: string;
  userId: string;
  userName?: string;
}> = ({ parkId, userId, userName }) => {
  const [checkIn, setCheckIn] = useLocalStorage('checkin');
  const [openDogsCountModal, setOpenDogsCountModal] = useState(false);
  const [openReviewModal, setOpenReviewModal] = useState(false);
  const { addReview } = useAddReview(parkId, userId);
  const { mutate: addDogCountReport } = useMutation({
    mutationFn: (dogsCount: number) =>
      reportDogsCount({
        parkId,
        dogsCount,
        userId,
      }),
    onSuccess: async () => {
      queryClient.invalidateQueries({
        queryKey: ['dogsCount', parkId],
      });
    },
  });

  // TODO: CHECKIN USING REACT-QUERY
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
    }
  };

  const onSubmitDogsCount = async (dogsCount: string) => {
    setOpenDogsCountModal(false);
    addDogCountReport(Number(dogsCount));
  };

  const onSubmitReview = async (review: {
    title: string;
    content?: string;
    rank: number;
  }) => {
    setOpenReviewModal(false);
    addReview({ reviewData: review });
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

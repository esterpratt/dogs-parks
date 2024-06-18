import { useContext, useState, lazy, Suspense } from 'react';
import { TbPennant, TbPennantOff } from 'react-icons/tb';
import { checkin, checkout } from '../../services/checkins';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { Modal } from '../Modal';
import { DogsCount } from './DogsCount';
import { reportDogsCount } from '../../services/dogsCount';
import { Button } from '../Button';
import styles from './ParkCheckIn.module.scss';
import { IconContext } from 'react-icons';
import { useAddReview } from '../../hooks/api/useAddReview';
import { useMutation, useQuery } from '@tanstack/react-query';
import { queryClient } from '../../services/react-query';
import { ThankYouModalContext } from '../../context/ThankYouModalContext';
import { Loading } from '../Loading';
import { fetchUserReviews } from '../../services/reviews';

const ReviewModal = lazy(() => import('../ReviewModal'));

const ParkCheckIn: React.FC<{
  parkId: string;
  userId: string;
  userName?: string;
}> = ({ parkId, userId, userName }) => {
  const { setIsOpen: setIsThankYouModalOpen } =
    useContext(ThankYouModalContext);
  const [checkIn, setCheckIn] = useLocalStorage('checkin');
  const [openDogsCountModal, setOpenDogsCountModal] = useState(false);
  const [openReviewModal, setOpenReviewModal] = useState(false);
  const [showForm, setShowForm] = useState(true);
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
      setIsThankYouModalOpen(true);
    },
  });

  const { mutateAsync: parkCheckIn } = useMutation({
    mutationFn: async () => {
      const id = await checkin({ userId, parkId });
      return id;
    },
    onSuccess: async () => {
      setOpenDogsCountModal(true);
      queryClient.invalidateQueries({
        queryKey: ['parkVisitors', parkId],
      });
    },
  });

  const { data: userReviews } = useQuery({
    queryKey: ['reviews', userId],
    queryFn: () => fetchUserReviews(userId),
  });

  const { mutate: parkCheckout } = useMutation({
    mutationFn: () => checkout(checkIn.id),
    onMutate: () => {
      if (userReviews?.find((review) => review.parkId === parkId)) {
        setShowForm(false);
      } else {
        setShowForm(true);
      }
      setOpenReviewModal(true);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['parkVisitors', parkId],
      });
    },
    onSettled: () => {
      setCheckIn(null);
    },
  });

  const shouldCheckIn = !checkIn || checkIn.parkId !== parkId;

  const onCheckIn = async () => {
    if (!shouldCheckIn) {
      parkCheckout();
    } else {
      const id = await parkCheckIn();
      setCheckIn({ id, parkId });
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
          <div className={styles.title}>Enjoy your stay, {userName}!</div>
          <DogsCount onSubmitDogsCount={onSubmitDogsCount} />
        </div>
      </Modal>
      <Suspense fallback={<Loading />}>
        <ReviewModal
          showForm={showForm}
          title={`Hope you had a tail-wagging time! ${
            showForm ? 'Leave a review if you can!' : ''
          }`}
          isOpen={openReviewModal}
          closeModal={() => setOpenReviewModal(false)}
          onSubmitReview={onSubmitReview}
        />
      </Suspense>
    </div>
  );
};

export { ParkCheckIn };

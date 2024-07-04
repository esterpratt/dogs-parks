import { useContext, useState, lazy, Suspense } from 'react';
import { TbPennant, TbPennantOff } from 'react-icons/tb';
import { useMutation, useQuery } from '@tanstack/react-query';
import { checkin, checkout } from '../../services/checkins';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { Modal } from '../Modal';
import { reportDogsCount } from '../../services/dogsCount';
import styles from './ParkCheckIn.module.scss';
import { useAddReview } from '../../hooks/api/useAddReview';
import { queryClient } from '../../services/react-query';
import { ThankYouModalContext } from '../../context/ThankYouModalContext';
import { fetchUserReviews } from '../../services/reviews';
import { ControlledInput } from '../inputs/ControlledInput';
import { ParkIcon } from './ParkIcon';

const ReviewModal = lazy(() => import('../ReviewModal'));

const ParkCheckIn: React.FC<{
  parkId: string;
  userId: string;
  userName?: string;
  className?: string;
}> = ({ parkId, userId, userName, className }) => {
  const { setIsOpen: setIsThankYouModalOpen } =
    useContext(ThankYouModalContext);
  const [checkIn, setCheckIn] = useLocalStorage('checkin');
  const [openDogsCountModal, setOpenDogsCountModal] = useState(false);
  const [openReviewModal, setOpenReviewModal] = useState(false);
  const [showForm, setShowForm] = useState(true);
  const [dogsCount, setDogsCount] = useState<string>('');
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
    <div className={className}>
      <ParkIcon
        iconCmp={
          !shouldCheckIn ? (
            <TbPennantOff onClick={onCheckIn} />
          ) : (
            <TbPennant onClick={onCheckIn} />
          )
        }
        iconClassName={
          !shouldCheckIn ? styles.checkoutIcon : styles.checkinIcon
        }
        textCmp={<span>{!shouldCheckIn ? 'Check Out' : 'Check In'}</span>}
      />
      <Modal
        height="50%"
        open={openDogsCountModal}
        onClose={() => setOpenDogsCountModal(false)}
        onSave={() => onSubmitDogsCount(dogsCount)}
        saveButtonDisabled={!dogsCount && dogsCount !== '0'}
        className={styles.modalContent}
      >
        <div className={styles.title}>
          Enjoy your stay, <span>{userName}!</span>
        </div>
        <div className={styles.inputsContainer}>
          <ControlledInput
            type="number"
            name="dogsCount"
            label="How many dogs are with you?"
            min={0}
            max={99}
            value={dogsCount}
            onChange={(event) => setDogsCount(event.currentTarget.value)}
          />
        </div>
      </Modal>
      <Suspense fallback={null}>
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

import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { MapPinCheckInside, MapPinXInside } from 'lucide-react';
import { checkin, checkout } from '../../services/checkins';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { useAddReview } from '../../hooks/api/useAddReview';
import { queryClient } from '../../services/react-query';
import { fetchUserReviews } from '../../services/reviews';
import { ParkIcon } from './ParkIcon';
import { ReviewModal } from '../ReviewModal';
import { DogsCountModal } from './DogsCountModal';
import styles from './ParkCheckIn.module.scss';

const ParkCheckIn: React.FC<{
  parkId: string;
  userId: string | null;
  userName?: string;
  className?: string;
}> = ({ parkId, userId, userName, className }) => {
  const [checkIn, setCheckIn] = useLocalStorage('checkin');
  const [openDogsCountModal, setOpenDogsCountModal] = useState(false);
  const [openReviewModal, setOpenReviewModal] = useState(false);
  const [showForm, setShowForm] = useState(true);
  const { addReview } = useAddReview(parkId, userId);

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
    queryFn: () => fetchUserReviews(userId!),
    enabled: !!userId,
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
        IconCmp={!shouldCheckIn ? MapPinXInside : MapPinCheckInside}
        iconColor={!shouldCheckIn ? styles.orange : styles.green}
        onClick={onCheckIn}
        textCmp={<span>{!shouldCheckIn ? 'Checkout' : 'Checkin'}</span>}
      />
      <DogsCountModal
        parkId={parkId}
        userName={userName}
        isOpen={openDogsCountModal}
        onClose={() => setOpenDogsCountModal(false)}
      />
      <ReviewModal
        showForm={showForm}
        title={`Hope you had a tail-wagging time! ${
          showForm ? 'Leave a review if you can!' : ''
        }`}
        isOpen={openReviewModal}
        closeModal={() => setOpenReviewModal(false)}
        onSubmitReview={onSubmitReview}
      />
    </div>
  );
};

export { ParkCheckIn };

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
import { useNotification } from '../../context/NotificationContext';

const ParkCheckIn: React.FC<{
  parkId: string;
  userId: string | null;
  userName?: string;
}> = ({ parkId, userId, userName }) => {
  const [checkIn, setCheckIn] = useLocalStorage('checkin');
  const [openDogsCountModal, setOpenDogsCountModal] = useState(false);
  const [openReviewModal, setOpenReviewModal] = useState(false);
  const { addReview } = useAddReview(parkId, userId);
  const { notify } = useNotification();

  const title = `Enjoy your stay${
    userName
      ? ', ' + userName.charAt(0).toUpperCase() + userName.slice(1) + '!'
      : '!'
  }`;

  const { mutateAsync: parkCheckIn } = useMutation({
    mutationFn: async () => {
      const id = await checkin({ userId, parkId });
      return id;
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({
        queryKey: ['parkVisitors', parkId],
      });
      if (localStorage.getItem('hideDogsModal')) {
        notify(title);
      } else {
        setOpenDogsCountModal(true);
      }
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
      if (userReviews?.find((review) => review.park_id === parkId)) {
        notify('Hope you had a tail-wagging time!');
      } else {
        setOpenReviewModal(true);
      }
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
    <div>
      <ParkIcon
        IconCmp={!shouldCheckIn ? MapPinXInside : MapPinCheckInside}
        iconColor={!shouldCheckIn ? styles.orange : styles.green}
        onClick={onCheckIn}
        textCmp={<span>{!shouldCheckIn ? 'Checkout' : 'Checkin'}</span>}
      />
      <DogsCountModal
        parkId={parkId}
        title={title}
        isOpen={openDogsCountModal}
        onClose={() => setOpenDogsCountModal(false)}
      />
      <ReviewModal
        title={'Hope you had a tail-wagging time! Leave a review if you can!'}
        isOpen={openReviewModal}
        closeModal={() => setOpenReviewModal(false)}
        onSubmitReview={onSubmitReview}
      />
    </div>
  );
};

export { ParkCheckIn };

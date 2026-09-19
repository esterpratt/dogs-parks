import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery } from '@tanstack/react-query';
import { MapPinCheckInside, MapPinXInside } from 'lucide-react';
import { checkin, checkout } from '../../services/checkins';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { useAddReview } from '../../hooks/api/useAddReview';
import { queryClient } from '../../services/react-query';
import { fetchUserReviews } from '../../services/reviews';
import { useNotification } from '../../context/NotificationContext';
import { capitalizeWords } from '../../utils/text';
import { ReviewData } from '../../types/review';
import { ParkIcon } from './ParkIcon';
import { ReviewModal } from '../ReviewModal';
import { DogsCountModal } from './DogsCountModal';
import CheckoutFromAnotherParkModal from './CheckoutFromAnotherParkModal';
import styles from './ParkCheckIn.module.scss';

interface ParkCheckInProps {
  parkId: string;
  userId: string | null;
  userName?: string;
}

const ParkCheckIn: React.FC<ParkCheckInProps> = (props) => {
  const { parkId, userId, userName } = props;
  const { t } = useTranslation();
  const [checkIn, setCheckIn] = useLocalStorage('checkin');
  const [openDogsCountModal, setOpenDogsCountModal] = useState(false);
  const [openReviewModal, setOpenReviewModal] = useState(false);
  const [openChekoutFromAnotherParkModal, setOpenChekoutFromAnotherParkModal] =
    useState(false);
  const { addReview } = useAddReview(parkId, userId);
  const { notify } = useNotification();

  const title = userName
    ? t('parks.checkin.titleWithName', { name: capitalizeWords(userName) })
    : t('parks.checkin.title');

  const { mutateAsync: parkCheckIn } = useMutation({
    mutationFn: async () => {
      const id = await checkin({ userId, parkId });
      return id;
    },
    onSuccess: async (id) => {
      if (id) {
        setCheckIn({ id, parkId });
      }

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

  const { mutate: anotherParkCheckout } = useMutation({
    mutationFn: ({ checkinId }: { checkinId: string; parkId: string }) =>
      checkout(checkinId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['parkVisitors', variables.parkId],
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
      if (userReviews?.find((review) => review.park_id === parkId)) {
        notify(t('toasts.checkout.hadFun'));
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

  const isCheckedInInAnotherPark = checkIn && checkIn.parkId !== parkId;
  const canCheckIn = !checkIn || isCheckedInInAnotherPark;

  const onClickCheckIn = async () => {
    if (!canCheckIn) {
      parkCheckout();
    } else if (isCheckedInInAnotherPark) {
      setOpenChekoutFromAnotherParkModal(true);
    } else {
      parkCheckIn();
    }
  };

  const onReplaceCheckIn = async () => {
    setOpenChekoutFromAnotherParkModal(false);
    anotherParkCheckout({ checkinId: checkIn.id, parkId: checkIn.parkId });
    parkCheckIn();
  };

  const onSubmitReview = (
    reviewData: ReviewData,
    isAnonymous: boolean
  ) => {
    // Preserve the modal until the review insert succeeds.
    return addReview({ reviewData, isAnonymous });
  };

  return (
    <div>
      <ParkIcon
        IconCmp={!canCheckIn ? MapPinXInside : MapPinCheckInside}
        iconColor={!canCheckIn ? styles.orange : styles.green}
        onClick={onClickCheckIn}
      />
      <DogsCountModal
        parkId={parkId}
        title={title}
        isOpen={openDogsCountModal}
        onClose={() => setOpenDogsCountModal(false)}
      />
      <ReviewModal
        title={t('toasts.checkout.askReview')}
        isOpen={openReviewModal}
        closeModal={() => setOpenReviewModal(false)}
        onSubmitReview={onSubmitReview}
      />
      <CheckoutFromAnotherParkModal
        isOpen={openChekoutFromAnotherParkModal}
        onClose={() => setOpenChekoutFromAnotherParkModal(false)}
        onCheckin={onReplaceCheckIn}
      />
    </div>
  );
};

export { ParkCheckIn };

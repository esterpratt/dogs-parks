import { useContext, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { UserContext } from '../context/UserContext';
import { Button } from '../components/Button';
import { ReviewPreview } from '../components/ReviewPreview';
import {
  UpdateReviewProps,
  fetchReviews,
  updateReview,
} from '../services/reviews';
import { queryClient } from '../services/react-query';
import { Review, ReviewData } from '../types/review';
import { useAddReview } from '../hooks/api/useAddReview';
import { ReviewModalContextProvider } from '../context/ReviewModalContext';
import { ReviewModal } from '../components/ReviewModal';
import { ReviewsPreview } from '../components/park/ReviewsPreview';
import styles from './ParkReviews.module.scss';
import { Park } from '../types/park';

const Reviews: React.FC = () => {
  const { id: parkId } = useOutletContext() as Park;
  const [isAddReviewModalOpen, setIsAddReviewModalOpen] = useState(false);

  const { data: reviews } = useQuery({
    queryKey: ['reviews', parkId],
    queryFn: () => fetchReviews(parkId!),
    enabled: !!parkId,
  });

  const { userId } = useContext(UserContext);

  const { addReview } = useAddReview(parkId!, userId);

  const { mutate: mutateReview } = useMutation({
    mutationFn: (data: { reviewData: ReviewData; reviewId: string }) =>
      updateReview({ reviewData: data.reviewData, reviewId: data.reviewId }),
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: ['reviews', parkId] });
      const prevReviews = queryClient.getQueryData<Review[]>([
        'reviews',
        parkId,
      ]);
      const review = prevReviews?.find((review) => review.id === data.reviewId);
      const updatedReview = { ...review, ...data?.reviewData };
      queryClient.setQueryData(
        ['reviews', parkId],
        [
          ...(prevReviews ?? []).filter(
            (review) => review.id !== data.reviewId
          ),
          updatedReview,
        ]
      );
      return { prevReviews };
    },
    onError: (_error, _data, context) => {
      queryClient.setQueryData(['reviews', parkId], context?.prevReviews);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', parkId] });
      queryClient.invalidateQueries({ queryKey: ['reviews', userId] });
    },
  });

  if (reviews?.length) {
    reviews.sort((a, b) => {
      const aDate = a.updated_at
        ? new Date(a.updated_at).getTime()
        : new Date(a.created_at).getTime();
      const bDate = b.update_aAt
        ? new Date(b.updated_at).getTime()
        : new Date(b.created_at).getTime();
      return bDate - aDate;
    });
  }

  const onAddReview = (
    reviewData: { title: string; content?: string; rank: number },
    isAnonymous: boolean
  ) => {
    setIsAddReviewModalOpen(false);
    addReview({ reviewData, isAnonymous });
  };

  const onUpdateReview = ({ reviewData, reviewId }: UpdateReviewProps) => {
    mutateReview({ reviewData, reviewId });
  };

  if (!reviews?.length) {
    return (
      <div className={styles.noReviews}>
        <span className={styles.title}>No barks about this park yet</span>
        {userId && (
          <div>
            <Button
              onClick={() => setIsAddReviewModalOpen(true)}
              className={styles.button}
              variant="simple"
            >
              Be the first to leave a review!
            </Button>
            <ReviewModal
              onSubmitReview={onAddReview}
              isOpen={isAddReviewModalOpen}
              closeModal={() => setIsAddReviewModalOpen(false)}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <ReviewModalContextProvider onUpdateReview={onUpdateReview}>
      <div className={styles.container}>
        <ReviewsPreview variant="reviews" />
        <ul className={styles.list}>
          {reviews.map((review) => (
            <li key={review.id} className={styles.item}>
              <ReviewPreview review={review} userId={userId} />
            </li>
          ))}
        </ul>
      </div>
    </ReviewModalContextProvider>
  );
};

export default Reviews;

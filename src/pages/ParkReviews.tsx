import { useContext, useState } from 'react';
import { UserContext } from '../context/UserContext';
import { Button } from '../components/Button';
import { ReviewModal } from '../components/ReviewModal';
import { ReviewPreview } from '../components/ReviewPreview';
import styles from './ParkReviews.module.scss';
import {
  UpdateReviewProps,
  fetchReviews,
  updateReview,
} from '../services/reviews';
import { useParams } from 'react-router';
import { useMutation, useQuery } from '@tanstack/react-query';
import { queryClient } from '../services/react-query';
import { Review, ReviewData } from '../types/review';
import { useAddReview } from '../hooks/api/useAddReview';

const Reviews: React.FC = () => {
  const { id: parkId } = useParams();
  const { userId } = useContext(UserContext);
  const [isAddReviewModalOpen, setIsAddReviewModalOpen] = useState(false);

  const { data: reviews } = useQuery({
    queryKey: ['reviews', parkId],
    queryFn: () => fetchReviews(parkId!),
  });

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
    onError: (error, data, context) => {
      queryClient.setQueryData(['reviews', parkId], context?.prevReviews);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', parkId] });
      queryClient.invalidateQueries({ queryKey: ['reviews', userId] });
    },
  });

  if (reviews?.length) {
    reviews.sort((a, b) => {
      const aDate = a.updatedAt
        ? a.updatedAt.getTime()
        : a.createdAt!.getTime();
      const bDate = b.updatedAt
        ? b.updatedAt.getTime()
        : b.createdAt!.getTime();
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
        <span className={styles.title}>No reviews yet for the park</span>
        {userId && (
          <div>
            <Button
              onClick={() => setIsAddReviewModalOpen(true)}
              className={styles.button}
            >
              Add a review
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
    <div>
      <ul className={styles.list}>
        {reviews.map((review) => (
          <li key={review.id} className={styles.item}>
            <ReviewPreview
              review={review}
              userId={userId}
              onUpdateReview={onUpdateReview}
            />
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Reviews;

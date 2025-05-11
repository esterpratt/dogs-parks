import { useOutletContext } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ReviewPreview } from '../components/ReviewPreview';
import {
  UpdateReviewProps,
  fetchUserReviews,
  updateReview,
} from '../services/reviews';
import { User } from '../types/user';
import { queryClient } from '../services/react-query';
import { Review, ReviewData } from '../types/review';
import { ReviewModalContextProvider } from '../context/ReviewModalContext';
import styles from './UserReviews.module.scss';

const UserReviews = () => {
  const { user } = useOutletContext() as { user: User };

  const { data: reviews } = useQuery({
    queryKey: ['reviews', user.id],
    queryFn: () => fetchUserReviews(user.id),
  });

  const { mutate: mutateReview } = useMutation({
    mutationFn: (data: { reviewData: ReviewData; reviewId: string }) =>
      updateReview({ reviewData: data.reviewData, reviewId: data.reviewId }),
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: ['reviews', user.id] });
      const prevReviews = queryClient.getQueryData<Review[]>([
        'reviews',
        user.id,
      ]);
      const review = prevReviews?.find((review) => review.id === data.reviewId);
      const updatedReview = { ...review, ...data?.reviewData };
      queryClient.setQueryData(
        ['reviews', user.id],
        [
          ...(prevReviews ?? []).filter(
            (review) => review.id !== data.reviewId
          ),
          updatedReview,
        ]
      );
      return { prevReviews, updatedReview };
    },
    onError: (_error, _data, context) => {
      queryClient.setQueryData(['reviews', user.id], context?.prevReviews);
    },
    onSettled: (_data, _error, _variables, context) => {
      const parkId = context?.updatedReview.park_id;
      queryClient.invalidateQueries({ queryKey: ['reviews', user.id] });
      queryClient.invalidateQueries({ queryKey: ['reviews', parkId] });
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

  const onUpdateReview = ({ reviewData, reviewId }: UpdateReviewProps) => {
    mutateReview({ reviewData, reviewId });
  };

  if (!reviews?.length) {
    return null;
  }

  return (
    <ReviewModalContextProvider onUpdateReview={onUpdateReview}>
      <div className={styles.container}>
        <div className={styles.title}>My park reviews</div>
        {reviews.map((review) => {
          return (
            <ReviewPreview
              showPark
              withName={false}
              key={review.id}
              review={review}
              userId={user.id}
            />
          );
        })}
      </div>
    </ReviewModalContextProvider>
  );
};

export default UserReviews;

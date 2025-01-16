import { useContext, useState } from 'react';
import { Link, useParams } from 'react-router';
import { Stars } from '../Stars';
import styles from './ReviewsPreview.module.scss';
import { Button } from '../Button';
import { UserContext } from '../../context/UserContext';
import { useQuery } from '@tanstack/react-query';
import { fetchParkRank, fetchReviews } from '../../services/reviews';
import { useAddReview } from '../../hooks/api/useAddReview';
import { ReviewModal } from '../ReviewModal';

const ReviewsPreview = () => {
  const { id: parkId } = useParams();
  const [isAddReviewModalOpen, setIsAddReviewModalOpen] = useState(false);
  const { userId } = useContext(UserContext);

  const { data: reviews, isLoading: isLoadingReviews } = useQuery({
    queryKey: ['reviews', parkId],
    queryFn: () => fetchReviews(parkId!),
  });
  const { data: rank, isLoading: isLoadingRank } = useQuery({
    queryKey: ['reviews', parkId, 'rank'],
    queryFn: () => fetchParkRank(parkId!),
  });

  const reviewsCount = reviews?.length;

  const { addReview } = useAddReview(parkId!, userId);

  if (isLoadingReviews || isLoadingRank) {
    return null;
  }

  const onAddReview = async (
    reviewData: {
      title: string;
      content?: string;
      rank: number;
    },
    isAnonymous: boolean
  ) => {
    setIsAddReviewModalOpen(false);
    addReview({ reviewData, isAnonymous });
  };

  return (
    <div className={styles.container}>
      {reviewsCount ? (
        <>
          <Stars rank={rank || 0} />
          <Link to="reviews" className={styles.reviewCount}>
            {reviewsCount === 1 ? '1 Review' : `${reviewsCount} Reviews`}
          </Link>
        </>
      ) : (
        <span>No reviews yet</span>
      )}
      {userId && (
        <div className={styles.addReview}>
          <Button
            onClick={() => setIsAddReviewModalOpen(true)}
            className={styles.addReviewButton}
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
};

export { ReviewsPreview };

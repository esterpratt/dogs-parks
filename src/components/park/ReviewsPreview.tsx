import { useContext, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import classnames from 'classnames';
import { Stars } from '../Stars';
import { Button } from '../Button';
import { UserContext } from '../../context/UserContext';
import { fetchParkRank, fetchReviews } from '../../services/reviews';
import { useAddReview } from '../../hooks/api/useAddReview';
import { ReviewModal } from '../ReviewModal';
import styles from './ReviewsPreview.module.scss';

interface ReviewsPreviewProps {
  variant?: 'title' | 'reviews';
  className?: string;
}

const ReviewsPreview = (props: ReviewsPreviewProps) => {
  const { variant = 'title', className } = props;
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

  const isReviewsPage = variant === 'reviews';

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
    <div className={classnames(styles.container, styles[variant], className)}>
      {!!reviewsCount && !isReviewsPage && (
        <>
          <Stars rank={rank || 0} />
          <Link to="reviews" className={styles.reviewCount}>
            {reviewsCount === 1 ? '1 Review' : `${reviewsCount} Reviews`}
          </Link>
        </>
      )}
      {!reviewsCount && !isReviewsPage && <span>No reviews yet</span>}
      {!!reviewsCount && isReviewsPage && (
        <div className={styles.rank}>
          Average rank: {(rank || 0).toFixed(1)}
        </div>
      )}
      {userId && isReviewsPage && (
        <div className={styles.addReview}>
          <Button
            onClick={() => setIsAddReviewModalOpen(true)}
            className={styles.addReviewButton}
            variant="primary"
          >
            Add review
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

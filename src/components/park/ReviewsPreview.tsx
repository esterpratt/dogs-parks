import { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Stars } from '../Stars';
import { fetchParkRank, fetchReviewsCount } from '../../services/reviews';
import { Review } from '../../types/review';
import styles from './ReviewsPreview.module.scss';
import { Button } from '../Button';
import { ReviewModal } from './ReviewModal';
import { UserContext } from '../../context/UserContext';

interface ReviewsPreviewProps {
  parkId: string;
}

const ReviewsPreview = ({ parkId }: ReviewsPreviewProps) => {
  const [loading, setLoading] = useState(true);
  const [reviewsCount, setReviewsCount] = useState<number>(0);
  const [rank, setRank] = useState<number | null>(null);
  const [isAddReviewModalOpen, setIsAddReviewModalOpen] = useState(false);
  const { userId } = useContext(UserContext);

  useEffect(() => {
    const getInitialData = async () => {
      const reviewsCount = await fetchReviewsCount(parkId);
      if (reviewsCount) {
        const rank = await fetchParkRank(parkId);
        setReviewsCount(reviewsCount);
        setRank(rank);
      }
      setLoading(false);
    };
    getInitialData();
  }, [parkId]);

  const onAddReview = async (
    addedReview: Pick<Review, 'id' | 'rank' | 'title' | 'content'>
  ) => {
    setRank(
      (prev) =>
        ((prev || 0) * reviewsCount + addedReview.rank) / (reviewsCount + 1)
    );
    setReviewsCount((prev) => prev + 1);
  };

  if (loading) {
    return null;
  }

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
          <Button onClick={() => setIsAddReviewModalOpen(true)}>
            Add a review
          </Button>
          <ReviewModal
            parkId={parkId}
            userId={userId}
            onAddReview={onAddReview}
            isOpen={isAddReviewModalOpen}
            closeModal={() => setIsAddReviewModalOpen(false)}
          />
        </div>
      )}
    </div>
  );
};

export { ReviewsPreview };

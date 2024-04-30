import { useEffect, useState } from 'react';
import { Park } from '../../types/park';
import { Stars } from '../Stars';
import { fetchParkRank, fetchReviewsCount } from '../../services/reviews';
import { Review } from '../../types/review';
import { AddReviewButton } from './AddReviewButton';

interface ReviewsPreviewProps {
  parkId: Park['id'];
}

const ReviewsPreview = ({ parkId }: ReviewsPreviewProps) => {
  const [loading, setLoading] = useState(true);
  const [reviewsCount, setReviewsCount] = useState<number>(0);
  const [rank, setRank] = useState<number | null>(null);

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
    setRank((prev) => (prev || 0 + addedReview.rank) / reviewsCount + 1);
    setReviewsCount((prev) => prev + 1);
  };

  if (loading) {
    return null;
  }

  return (
    <div>
      {reviewsCount ? (
        <div>
          <Stars rank={rank || 0} />
          <span>
            {reviewsCount === 1 ? '1 Review' : `${reviewsCount} Reviews`}
          </span>
        </div>
      ) : (
        <span>No reviews yet</span>
      )}
      <AddReviewButton parkId={parkId} onAddReview={onAddReview} />
    </div>
  );
};

export { ReviewsPreview };

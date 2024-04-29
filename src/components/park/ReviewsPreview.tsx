import { useContext, useEffect, useState } from 'react';
import { Park } from '../../types/park';
import { Stars } from '../Stars';
import {
  addReview,
  fetchParkRank,
  fetchReviewsCount,
} from '../../services/reviews';
import { Modal } from '../Modal';
import { ReviewForm } from './ReviewForm';
import { UserContext } from '../../context/UserContext';

interface ReviewsPreviewProps {
  parkId: Park['id'];
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

  const onAddReview = async (reviewData: {
    title: string;
    content?: string;
    rank: number;
  }) => {
    setIsAddReviewModalOpen(false);
    const res = await addReview({
      parkId,
      userId: userId!,
      review: reviewData,
    });
    if (res) {
      setRank((prev) => (prev || 0 + reviewData.rank) / reviewsCount + 1);
      setReviewsCount((prev) => prev + 1);
    }
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
      {userId && (
        <>
          <button onClick={() => setIsAddReviewModalOpen(true)}>
            Add a review
          </button>
          <Modal
            open={isAddReviewModalOpen}
            onClose={() => setIsAddReviewModalOpen(false)}
          >
            <ReviewForm onSubmitForm={onAddReview} />
          </Modal>
        </>
      )}
    </div>
  );
};

export { ReviewsPreview };

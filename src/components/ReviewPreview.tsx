import { useState } from 'react';
import { Review } from '../types/review';
import { Button } from './Button';
import { ReviewModal } from './ReviewModal';
import { UpdateReviewProps } from '../services/reviews';

interface ReviewPreviewProps {
  review: Review;
  userId?: string;
  onUpdateReview?: ({ reviewId, reviewData }: UpdateReviewProps) => void;
}

const ReviewPreview: React.FC<ReviewPreviewProps> = ({
  review,
  userId,
  onUpdateReview,
}) => {
  const [isAddReviewModalOpen, setIsAddReviewModalOpen] = useState(false);

  const onSubmitReview = (updatedReview: {
    title: string;
    content?: string;
    rank: number;
  }) => {
    setIsAddReviewModalOpen(false);
    if (onUpdateReview) {
      onUpdateReview({ reviewId: review.id, reviewData: updatedReview });
    }
  };

  return (
    <>
      <div>
        <div>{review.title}</div>
        {userId === review.userId && (
          <Button onClick={() => setIsAddReviewModalOpen(true)}>
            Update Review
          </Button>
        )}
      </div>
      <ReviewModal
        review={review}
        onSubmitReview={onSubmitReview}
        isOpen={isAddReviewModalOpen}
        closeModal={() => setIsAddReviewModalOpen(false)}
      />
    </>
  );
};

export { ReviewPreview };

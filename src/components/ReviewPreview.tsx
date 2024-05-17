import { useEffect, useMemo, useState } from 'react';
import { Review } from '../types/review';
import { Button } from './Button';
import { ReviewModal } from './ReviewModal';
import { UpdateReviewProps } from '../services/reviews';
import { getFormattedDate } from '../utils/time';
import { fetchUser } from '../services/users';
import styles from './ReviewPreview.module.scss';
import { Stars } from './Stars';

interface ReviewPreviewProps {
  review: Review;
  userId?: string | null;
  onUpdateReview?: ({ reviewId, reviewData }: UpdateReviewProps) => void;
}

const ReviewPreview: React.FC<ReviewPreviewProps> = ({
  review,
  userId,
  onUpdateReview,
}) => {
  const [isAddReviewModalOpen, setIsAddReviewModalOpen] = useState(false);
  const reviewTime = useMemo<string>(() => {
    return getFormattedDate(review.updatedAt || review.createdAt);
  }, [review.createdAt, review.updatedAt]);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const getUserName = async () => {
      let userName = 'Anonymous';
      if (review.userId) {
        const user = await fetchUser(review.userId);
        if (user && user.name) {
          userName = user.name;
        }
      }
      setUserName(userName);
    };

    getUserName();
  }, [review.userId]);

  const onSubmitReview = (updatedReview: {
    title: string;
    content?: string;
    rank: number;
  }) => {
    setIsAddReviewModalOpen(false);
    if (onUpdateReview) {
      onUpdateReview({
        reviewId: review.id,
        reviewData: updatedReview,
      });
    }
  };

  return (
    <>
      <div className={styles.container}>
        <div className={styles.preview}>
          <div className={styles.title}>{review.title}</div>
          <Stars rank={review.rank} className={styles.stars} />
        </div>
        {review.content && (
          <div className={styles.content}>{review.content}</div>
        )}
        <div className={styles.footer}>
          <div className={styles.time}>{reviewTime}</div>
          <div className={styles.name}>By: {userName}</div>
          {userId === review.userId && (
            <Button
              onClick={() => setIsAddReviewModalOpen(true)}
              className={styles.button}
            >
              Update Review
            </Button>
          )}
        </div>
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

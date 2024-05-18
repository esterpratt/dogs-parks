import { useEffect, useMemo, useState } from 'react';
import { Review } from '../types/review';
import { Button } from './Button';
import { ReviewModal } from './ReviewModal';
import { UpdateReviewProps } from '../services/reviews';
import { getFormattedDate } from '../utils/time';
import { fetchUser } from '../services/users';
import styles from './ReviewPreview.module.scss';
import { Stars } from './Stars';
import { fetchPark } from '../services/parks';
import { User } from '../types/user';
import { Park } from '../types/park';

interface ReviewPreviewProps {
  review: Review;
  userId?: string | null;
  showPark?: boolean;
  onUpdateReview?: ({ reviewId, reviewData }: UpdateReviewProps) => void;
}

const ReviewPreview: React.FC<ReviewPreviewProps> = ({
  review,
  userId,
  onUpdateReview,
  showPark = false,
}) => {
  const [isAddReviewModalOpen, setIsAddReviewModalOpen] = useState(false);
  const reviewTime = useMemo<string>(() => {
    return getFormattedDate(review.updatedAt || review.createdAt);
  }, [review.createdAt, review.updatedAt]);
  const [userName, setUserName] = useState<string>('');
  const [parkName, setParkName] = useState<string>('');

  useEffect(() => {
    const getNames = async () => {
      const promises: [
        Promise<Partial<User> | undefined>,
        Promise<Partial<Park> | undefined>
      ] = [
        review.userId
          ? fetchUser(review.userId)
          : Promise.resolve({ name: 'Anonymous' }),
        fetchPark(review.parkId),
      ];
      const [user, park] = await Promise.all(promises);
      setUserName(user?.name || 'Anonymous');
      setParkName(park?.name || 'N/A');
    };

    getNames();
  }, [review.userId, review.parkId]);

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
        {showPark && <div className={styles.parkName}>{parkName}</div>}
        <div className={styles.preview}>
          <div className={styles.title}>{review.title}</div>
          <Stars rank={review.rank} className={styles.stars} />
        </div>
        {review.content && (
          <div className={styles.content}>{review.content}</div>
        )}
        <div className={styles.footer}>
          <div className={styles.time}>{reviewTime}</div>
          <div className={styles.name}>by: {userName}</div>
          {userId && userId === review.userId && (
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

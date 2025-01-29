import { useMemo, useContext } from 'react';
import { Review } from '../types/review';
import { Button } from './Button';
import { getFormattedPastDate } from '../utils/time';
import { fetchUser } from '../services/users';
import styles from './ReviewPreview.module.scss';
import { Stars } from './Stars';
import { fetchPark } from '../services/parks';
import { useQuery } from '@tanstack/react-query';
import { ReviewModalContext } from '../context/ReviewModalContext';
import { sanitizContent } from '../utils/sanitize';

interface ReviewPreviewProps {
  review: Review;
  userId?: string | null;
  showPark?: boolean;
}

const ReviewPreview: React.FC<ReviewPreviewProps> = ({
  review,
  userId,
  showPark = false,
}) => {
  const { setOpenedReview } = useContext(ReviewModalContext);
  const reviewTime = useMemo<string>(() => {
    return getFormattedPastDate(review.updatedAt || review.createdAt);
  }, [review.createdAt, review.updatedAt]);

  const { data: user } = useQuery({
    queryKey: ['user', review.userId],
    queryFn: () => fetchUser(review.userId!),
    enabled: !!review.userId,
  });

  const { data: park } = useQuery({
    queryKey: ['park', review.parkId],
    queryFn: () => fetchPark(review.parkId),
  });

  const sanitizedReviewTitle = sanitizContent(review.title);
  const sanitizedReviewContent = sanitizContent(review.content);

  return (
    <>
      <div className={styles.container}>
        {showPark && (
          <div className={styles.parkName}>{park?.name || 'N/A'}</div>
        )}
        <div className={styles.preview}>
          <div className={styles.title}>{sanitizedReviewTitle}</div>
          <Stars rank={review.rank} className={styles.stars} />
        </div>
        {sanitizedReviewContent && (
          <div className={styles.content}>{sanitizedReviewContent}</div>
        )}
        <div className={styles.footer}>
          <div className={styles.time}>{reviewTime}</div>
          <div className={styles.name}>by: {user?.name || 'Anonymous'}</div>
          {userId && userId === review.userId && (
            <Button
              onClick={() => setOpenedReview(review)}
              className={styles.button}
            >
              Update Review
            </Button>
          )}
        </div>
      </div>
    </>
  );
};

export { ReviewPreview };

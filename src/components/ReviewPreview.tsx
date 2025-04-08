import { useMemo, useContext, useState } from 'react';
import { FiAlertCircle } from 'react-icons/fi';
import { Review } from '../types/review';
import { Button } from './Button';
import { getFormattedPastDate } from '../utils/time';
import { fetchUser } from '../services/users';
import styles from './ReviewPreview.module.scss';
import { Stars } from './Stars';
import { fetchPark } from '../services/parks';
import { useQuery } from '@tanstack/react-query';
import { ReviewModalContext } from '../context/ReviewModalContext';
import { IconContext } from 'react-icons';
import { ReportModal } from './ReportModal';

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
    return getFormattedPastDate(review.updated_at || review.created_at);
  }, [review.created_at, review.updated_at]);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['user', review.user_id],
    queryFn: () => fetchUser(review.user_id!),
    enabled: !!review.user_id,
  });

  const { data: park } = useQuery({
    queryKey: ['park', review.park_id],
    queryFn: () => fetchPark(review.park_id),
  });

  return (
    <div className={styles.container}>
      {showPark && <div className={styles.parkName}>{park?.name || 'N/A'}</div>}
      <div className={styles.preview}>
        <div className={styles.title}>{review.title}</div>
        <Stars rank={review.rank} className={styles.stars} />
      </div>
      {review.content && <div className={styles.content}>{review.content}</div>}
      <div className={styles.footer}>
        <div className={styles.time}>{reviewTime}</div>
        <div className={styles.name}>
          by:{' '}
          <span className={styles.userName}>{user?.name || 'Anonymous'}</span>
        </div>
        {!!userId &&
          (userId === review.user_id ? (
            <Button
              onClick={() => setOpenedReview(review)}
              className={styles.button}
            >
              Update Review
            </Button>
          ) : (
            <>
              <IconContext.Provider value={{ className: styles.reportIcon }}>
                <FiAlertCircle onClick={() => setIsReportModalOpen(true)} />
              </IconContext.Provider>
              <ReportModal
                isOpen={isReportModalOpen}
                onClose={() => setIsReportModalOpen(false)}
                reviewId={review.id}
              />
            </>
          ))}
      </div>
    </div>
  );
};

export { ReviewPreview };

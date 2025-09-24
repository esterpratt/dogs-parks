import { useContext, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Flag } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Review } from '../types/review';
import { Button } from './Button';
import { useDateUtils } from '../hooks/useDateUtils';
import { fetchUser } from '../services/users';
import { Stars } from './Stars';
import { fetchPark } from '../services/parks';
import { ReviewModalContext } from '../context/ReviewModalContext';
import { ReportModal } from './ReportModal';
import styles from './ReviewPreview.module.scss';
import { capitalizeText } from '../utils/text';

interface ReviewPreviewProps {
  review: Review;
  userId?: string | null;
  showPark?: boolean;
  withName?: boolean;
}

const ReviewPreview: React.FC<ReviewPreviewProps> = ({
  review,
  userId,
  showPark = false,
  withName = true,
}) => {
  const { t } = useTranslation();
  const { getFormattedPastDate } = useDateUtils();
  const { setOpenedReview } = useContext(ReviewModalContext);
  const reviewTime = capitalizeText(
    getFormattedPastDate(review.updated_at || review.created_at)
  );
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
      <div className={styles.review}>
        <div className={styles.top}>
          <div className={styles.title}>{review.title}</div>
          <Stars rank={review.rank} className={styles.stars} />
        </div>
        {review.content && (
          <div className={styles.content}>{review.content}</div>
        )}
        <div className={styles.bottom}>
          <div className={styles.details}>
            {withName && (
              <div className={styles.userName}>{user?.name || 'Anonymous'}</div>
            )}
            <div className={styles.time}>{reviewTime}</div>
          </div>
          {!!userId &&
            (userId === review.user_id ? (
              <Button
                onClick={() => setOpenedReview(review)}
                className={styles.button}
                variant="simple"
              >
                {t('parkReviews.updateReview')}
              </Button>
            ) : (
              <>
                <Button
                  color={styles.red}
                  onClick={() => setIsReportModalOpen(true)}
                  variant="secondary"
                  className={styles.reportButton}
                >
                  <Flag size={11} />
                </Button>
                <ReportModal
                  isOpen={isReportModalOpen}
                  onClose={() => setIsReportModalOpen(false)}
                  reviewId={review.id}
                />
              </>
            ))}
        </div>
      </div>
    </div>
  );
};

export { ReviewPreview };

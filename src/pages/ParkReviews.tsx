import { useContext, useState } from 'react';
import { UserContext } from '../context/UserContext';
import { Button } from '../components/Button';
import { ReviewModal } from '../components/ReviewModal';
import { ParkReviewsContext } from '../context/ParkReviewsContext';
import { ReviewPreview } from '../components/ReviewPreview';
import styles from './ParkReviews.module.scss';
import { UpdateReviewProps } from '../services/reviews';
import { UserReviewsContext } from '../context/UserReviewsContext';
import { useParams } from 'react-router';

const Reviews: React.FC = () => {
  const { id: parkId } = useParams();
  const { reviews } = useContext(ParkReviewsContext);
  const { updateUserReview, addReview } = useContext(UserReviewsContext);
  const { userId } = useContext(UserContext);
  const [isAddReviewModalOpen, setIsAddReviewModalOpen] = useState(false);

  const onAddReview = (
    reviewData: { title: string; content?: string; rank: number },
    isAnonymous: boolean
  ) => {
    setIsAddReviewModalOpen(false);
    addReview({ reviewData, isAnonymous, parkId: parkId! });
  };

  const onUpdateReview = ({ reviewData, reviewId }: UpdateReviewProps) => {
    updateUserReview({ reviewData, reviewId });
  };

  if (!reviews.length) {
    return (
      <div className={styles.noReviews}>
        <span className={styles.title}>No reviews yet for the park</span>
        {userId && (
          <div>
            <Button
              onClick={() => setIsAddReviewModalOpen(true)}
              className={styles.button}
            >
              Add a review
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
  }

  return (
    <div>
      <ul className={styles.list}>
        {reviews.map((review) => (
          <li key={review.id} className={styles.item}>
            <ReviewPreview
              review={review}
              userId={userId}
              onUpdateReview={onUpdateReview}
            />
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Reviews;

import { useContext, useState } from 'react';
import { UserContext } from '../context/UserContext';
import { Button } from '../components/Button';
import { ReviewModal } from '../components/ReviewModal';
import { ParkReviewsContext } from '../context/ParkReviewsContext';
import { ReviewPreview } from '../components/ReviewPreview';
import styles from './ParkReviews.module.scss';

const Reviews: React.FC = () => {
  const { reviews } = useContext(ParkReviewsContext);
  const { userId } = useContext(UserContext);
  const [isAddReviewModalOpen, setIsAddReviewModalOpen] = useState(false);

  const onAddReview = () => {
    // todo: add review
    setIsAddReviewModalOpen(false);
  };

  if (!reviews.length) {
    return (
      <div>
        <span>No reviews yet for the park</span>
        {userId && (
          <div>
            <Button onClick={() => setIsAddReviewModalOpen(true)}>
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
            <ReviewPreview review={review} userId={userId} />
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Reviews;

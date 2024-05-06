import { useContext, useState } from 'react';
import { UserContext } from '../context/UserContext';
import { Button } from '../components/Button';
import { ReviewModal } from '../components/park/ReviewModal';
import { ParkReviewsContext } from '../context/ParkReviewsContext';
// import styles from './Reviews.module.scss';

const Reviews: React.FC = () => {
  const { reviews } = useContext(ParkReviewsContext);
  const { userId } = useContext(UserContext);
  const [isAddReviewModalOpen, setIsAddReviewModalOpen] = useState(false);

  const onAddReview = () => {
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
              userId={userId}
              onAddReview={onAddReview}
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
      <ul>
        {reviews.map((review) => (
          <li key={review.id}>{review.title}</li>
        ))}
      </ul>
    </div>
  );
};

export { Reviews };

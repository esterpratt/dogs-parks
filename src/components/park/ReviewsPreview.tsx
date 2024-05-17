import { useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import { Stars } from '../Stars';
import styles from './ReviewsPreview.module.scss';
import { Button } from '../Button';
import { ReviewModal } from '../ReviewModal';
import { UserContext } from '../../context/UserContext';
import { ParkReviewsContext } from '../../context/ParkReviewsContext';

const ReviewsPreview = () => {
  const { rank, reviewsCount, loading, addReview } =
    useContext(ParkReviewsContext);
  const [isAddReviewModalOpen, setIsAddReviewModalOpen] = useState(false);
  const { userId } = useContext(UserContext);

  if (loading) {
    return null;
  }

  const onAddReview = async (
    review: {
      title: string;
      content?: string;
      rank: number;
    },
    isAnonymous: boolean
  ) => {
    setIsAddReviewModalOpen(false);
    addReview({ review, userId: isAnonymous ? null : userId! });
  };

  return (
    <div className={styles.container}>
      {reviewsCount ? (
        <>
          <Stars rank={rank || 0} />
          <Link to="reviews" className={styles.reviewCount}>
            {reviewsCount === 1 ? '1 Review' : `${reviewsCount} Reviews`}
          </Link>
        </>
      ) : (
        <span>No reviews yet</span>
      )}
      {userId && (
        <div className={styles.addReview}>
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
};

export { ReviewsPreview };

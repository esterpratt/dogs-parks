import { useContext, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Stars } from '../Stars';
import styles from './ReviewsPreview.module.scss';
import { Button } from '../Button';
import { ReviewModal } from '../ReviewModal';
import { UserContext } from '../../context/UserContext';
import { ParkReviewsContext } from '../../context/ParkReviewsContext';
import { UserReviewsContext } from '../../context/UserReviewsContext';

const ReviewsPreview = () => {
  const { id: parkId } = useParams();
  const { rank, reviewsCount, loading } = useContext(ParkReviewsContext);
  const { addReview } = useContext(UserReviewsContext);
  const [isAddReviewModalOpen, setIsAddReviewModalOpen] = useState(false);
  const { userId } = useContext(UserContext);
  console.log(rank, reviewsCount, loading);

  if (loading) {
    return null;
  }

  const onAddReview = async (
    reviewData: {
      title: string;
      content?: string;
      rank: number;
    },
    isAnonymous: boolean
  ) => {
    setIsAddReviewModalOpen(false);
    addReview({ reviewData, isAnonymous, parkId: parkId! });
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

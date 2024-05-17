import { useContext } from 'react';
import { useOutletContext } from 'react-router';
import { UserReviewsContext } from '../context/UserReviewsContext';
import { ReviewPreview } from '../components/ReviewPreview';
import { UpdateReviewProps } from '../services/reviews';
import { User } from '../types/user';
import styles from './UserReviews.module.scss';

const UserReviews = () => {
  const { user } = useOutletContext() as { user: User };
  const { updateUserReview } = useContext(UserReviewsContext);
  const { reviews } = useContext(UserReviewsContext);

  if (!reviews.length) {
    return null;
  }

  const onUpdateReview = ({ reviewId, reviewData }: UpdateReviewProps) => {
    updateUserReview({ reviewId, reviewData });
  };

  return (
    <div className={styles.container}>
      {reviews.map((review) => {
        return (
          <ReviewPreview
            showPark
            key={review.id}
            review={review}
            userId={user.id}
            onUpdateReview={onUpdateReview}
          />
        );
      })}
    </div>
  );
};

export default UserReviews;

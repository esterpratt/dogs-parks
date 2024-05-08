import { useContext } from 'react';
import { UserReviewsContext } from '../context/UserReviewsContext';
import { ReviewPreview } from '../components/ReviewPreview';
import { useOutletContext } from 'react-router';
import { UpdateReviewProps } from '../services/reviews';
import { User } from '../types/user';

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
    <div>
      {reviews.map((review) => {
        return (
          <ReviewPreview
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

export { UserReviews };

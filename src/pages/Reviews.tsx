import { useLoaderData, useRevalidator } from 'react-router';
import { Review } from '../types/review';
import { AddReviewButton } from '../components/park/AddReviewButton';

const Reviews: React.FC = () => {
  const { reviews, parkId } = useLoaderData() as {
    reviews: Review[];
    parkId: string;
  };
  const revalidator = useRevalidator();

  const onAddReview = () => {
    revalidator.revalidate();
  };

  if (!reviews.length) {
    return (
      <div>
        <span>No reviews yet for the park</span>
        <AddReviewButton parkId={parkId} onAddReview={onAddReview} />
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

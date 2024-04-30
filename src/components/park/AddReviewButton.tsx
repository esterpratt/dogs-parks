import { useContext, useState } from 'react';
import { UserContext } from '../../context/UserContext';
import { Modal } from '../Modal';
import { ReviewForm } from './ReviewForm';
import { addReview } from '../../services/reviews';
import { Review } from '../../types/review';

interface AddReviewButtonProps {
  parkId: string;
  onAddReview?: (
    addedReview: Pick<Review, 'id' | 'rank' | 'title' | 'content'>
  ) => void;
}

const AddReviewButton: React.FC<AddReviewButtonProps> = ({
  parkId,
  onAddReview,
}) => {
  const [isAddReviewModalOpen, setIsAddReviewModalOpen] = useState(false);
  const { userId } = useContext(UserContext);

  if (!userId) {
    return null;
  }

  const onSubmitReview = async (reviewData: {
    title: string;
    content?: string;
    rank: number;
  }) => {
    setIsAddReviewModalOpen(false);
    const id = await addReview({
      parkId,
      userId: userId!,
      review: reviewData,
    });
    if (id && onAddReview) {
      onAddReview({ id, ...reviewData });
    }
  };

  return (
    <div>
      <button onClick={() => setIsAddReviewModalOpen(true)}>
        Add a review
      </button>
      <Modal
        open={isAddReviewModalOpen}
        onClose={() => setIsAddReviewModalOpen(false)}
      >
        <ReviewForm onSubmitForm={onSubmitReview} />
      </Modal>
    </div>
  );
};

export { AddReviewButton };

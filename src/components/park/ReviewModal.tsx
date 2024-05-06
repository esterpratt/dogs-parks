import { addReview } from '../../services/reviews';
import { Review } from '../../types/review';
import { Modal } from '../Modal';
import { ReviewForm } from './ReviewForm';
import styles from './ReviewModal.module.scss';

interface ReviewModalProps {
  title?: string;
  isOpen: boolean;
  parkId: string;
  userId: string;
  closeModal: () => void;
  onAddReview?: (
    addedReview: Pick<Review, 'id' | 'rank' | 'title' | 'content'>
  ) => void;
}

const ReviewModal: React.FC<ReviewModalProps> = ({
  isOpen,
  closeModal,
  onAddReview,
  parkId,
  userId,
  title,
}) => {
  const onSubmitReview = async (reviewData: {
    title: string;
    content?: string;
    rank: number;
  }) => {
    closeModal();
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
    <Modal open={isOpen} onClose={() => closeModal()}>
      {title && <div className={styles.title}>{title}</div>}
      <ReviewForm onSubmitForm={onSubmitReview} />
    </Modal>
  );
};

export { ReviewModal };

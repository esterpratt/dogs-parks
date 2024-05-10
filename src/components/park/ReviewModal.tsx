import { Modal } from '../Modal';
import { ReviewForm } from './ReviewForm';
import styles from './ReviewModal.module.scss';
import { Review } from '../../types/review';

interface ReviewModalProps {
  title?: string;
  isOpen: boolean;
  review?: Review;
  closeModal: () => void;
  onSubmitReview: (reviewData: {
    title: string;
    content?: string;
    rank: number;
  }) => void;
}

const ReviewModal: React.FC<ReviewModalProps> = ({
  isOpen,
  closeModal,
  title,
  review,
  onSubmitReview,
}) => {
  return (
    <Modal
      open={isOpen}
      onClose={() => closeModal()}
      className={styles.content}
      height="75%"
    >
      {title && <div className={styles.title}>{title}</div>}
      <ReviewForm onSubmitForm={onSubmitReview} review={review} />
    </Modal>
  );
};

export { ReviewModal };

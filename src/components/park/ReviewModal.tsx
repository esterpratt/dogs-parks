import { useContext } from 'react';
import { Modal } from '../Modal';
import { ReviewForm } from './ReviewForm';
import styles from './ReviewModal.module.scss';
import { ParkReviewsContext } from '../../context/ParkReviewsContext';

interface ReviewModalProps {
  title?: string;
  isOpen: boolean;
  userId: string;
  closeModal: () => void;
  onAddReview?: () => void;
}

const ReviewModal: React.FC<ReviewModalProps> = ({
  isOpen,
  closeModal,
  onAddReview,
  userId,
  title,
}) => {
  const { addReview } = useContext(ParkReviewsContext);

  const onSubmitReview = async (reviewData: {
    title: string;
    content?: string;
    rank: number;
  }) => {
    closeModal();
    addReview(reviewData, userId);

    if (onAddReview) {
      onAddReview();
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

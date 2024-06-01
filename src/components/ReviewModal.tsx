import { Modal } from './Modal';
import { ReviewForm } from './park/ReviewForm';
import styles from './ReviewModal.module.scss';
import { Review } from '../types/review';
import { useContext } from 'react';
import { ThankYouModalContext } from '../context/ThankYouModalContext';

interface ReviewModalProps {
  title?: string;
  isOpen: boolean;
  review?: Review;
  closeModal: () => void;
  onSubmitReview: (
    reviewData: {
      title: string;
      content?: string;
      rank: number;
    },
    isAnonymous: boolean
  ) => void;
}

const ReviewModal: React.FC<ReviewModalProps> = ({
  isOpen,
  closeModal,
  title,
  review,
  onSubmitReview,
}) => {
  const { setIsOpen: setIsThankYouModalOpen } =
    useContext(ThankYouModalContext);

  const onClose = () => {
    closeModal();
  };

  const onSubmitForm = (
    reviewData: { title: string; content?: string; rank: number },
    isAnonymous: boolean
  ) => {
    setIsThankYouModalOpen(true);
    onSubmitReview(reviewData, isAnonymous);
  };

  return (
    <Modal
      open={isOpen}
      onClose={() => onClose()}
      className={styles.content}
      height="80%"
    >
      {title && <div className={styles.title}>{title}</div>}
      <ReviewForm onSubmitForm={onSubmitForm} review={review} />
    </Modal>
  );
};

export { ReviewModal };

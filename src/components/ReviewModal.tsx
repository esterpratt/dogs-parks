import { useContext } from 'react';
import { Modal } from './Modal';
import { ReviewForm } from './park/ReviewForm';
import styles from './ReviewModal.module.scss';
import { Review } from '../types/review';
import { ThankYouModalContext } from '../context/ThankYouModalContext';

interface ReviewModalProps {
  title?: string;
  isOpen: boolean;
  review?: Review;
  showForm?: boolean;
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
  showForm = true,
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
      height={showForm ? '80%' : '28%'}
      autoClose={!showForm}
    >
      {title && <div className={styles.title}>{title}</div>}
      {showForm && <ReviewForm onSubmitForm={onSubmitForm} review={review} />}
    </Modal>
  );
};

export default ReviewModal;

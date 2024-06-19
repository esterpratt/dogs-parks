import { useContext, useEffect, useState } from 'react';
import { Modal } from './Modal';
import styles from './ReviewModal.module.scss';
import { Review } from '../types/review';
import { ThankYouModalContext } from '../context/ThankYouModalContext';
import { ControlledInput } from './inputs/ControlledInput';
import { TextArea } from './inputs/TextArea';
import { Stars } from './Stars';
import { Checkbox } from './inputs/Checkbox';
import { ModalSaveButton } from './ModalSaveButton';

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

  const [reviewData, setReviewData] = useState(() => {
    return {
      title: review?.title || '',
      content: review?.content || '',
    };
  });
  const [rank, setRank] = useState<number>(0);
  const [isAnonymous, setIsAnonymous] = useState(false);

  useEffect(() => {
    if (review) {
      setReviewData({
        title: review.title,
        content: review.content || '',
      });
      setRank(review.rank);
    } else {
      setReviewData({
        title: '',
        content: '',
      });
      setRank(0);
    }
  }, [review]);

  const onChangeInput = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setReviewData((prev) => {
      return {
        ...prev,
        [event.target.name]: event.target.value,
      };
    });
  };

  const resetReview = () => {
    setReviewData({ title: '', content: '' });
    setRank(0);
    setIsAnonymous(false);
  };

  const onSubmit = async () => {
    onSubmitReview(
      {
        title: reviewData.title,
        content: reviewData.content,
        rank: Number(rank),
      },
      isAnonymous
    );
    resetReview();
    setIsThankYouModalOpen(true);
  };

  const onChangeAnonymousStatus = () => {
    setIsAnonymous((prev) => !prev);
  };

  return (
    <Modal
      open={isOpen}
      onClose={closeModal}
      className={styles.modal}
      height={showForm ? '80%' : '28%'}
      autoClose={!showForm}
    >
      <div className={styles.contentContainer}>
        {title && <div className={styles.title}>{title}</div>}
        {showForm && (
          <div className={styles.formContainer}>
            <span className={styles.fromTitle}>How did you dig the park?</span>
            <form className={styles.form}>
              <div className={styles.formInputs}>
                <ControlledInput
                  label="Title"
                  name="title"
                  value={reviewData.title}
                  onChange={onChangeInput}
                  placeholder="Review title"
                  required
                />
                <TextArea
                  label="Content"
                  name="content"
                  rows={7}
                  maxLength={280}
                  value={reviewData.content}
                  onChange={onChangeInput}
                  placeholder="Please elaborate..."
                />
                <div className={styles.rankContainer}>
                  <span className={styles.rankTitle}>Rate the park</span>
                  <Stars
                    className={styles.stars}
                    rank={rank}
                    setRank={setRank}
                    size={32}
                  />
                </div>
                {!review && (
                  <Checkbox
                    id="isAnonymous"
                    label="Report anonymously"
                    isChecked={isAnonymous}
                    onChange={onChangeAnonymousStatus}
                  />
                )}
              </div>
            </form>
          </div>
        )}
      </div>
      <ModalSaveButton onClick={onSubmit} />
    </Modal>
  );
};

export default ReviewModal;

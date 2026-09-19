import { useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Review, ReviewData } from '../types/review';
import { ControlledInput } from './inputs/ControlledInput';
import { TextArea } from './inputs/TextArea';
import { Stars } from './Stars';
import { Checkbox } from './inputs/Checkbox';
import { UserContext } from '../context/UserContext';
import { useOrientationContext } from '../context/OrientationContext';
import { useNotification } from '../context/NotificationContext';
import { FormModal } from './modals/FormModal';
import styles from './ReviewModal.module.scss';

interface ReviewModalProps {
  title?: string;
  isOpen: boolean;
  review?: Review;
  closeModal: () => void;
  onSubmitReview: (
    reviewData: ReviewData,
    isAnonymous: boolean
  ) => Promise<unknown>;
}

const ReviewModal: React.FC<ReviewModalProps> = (props) => {
  const {
    isOpen,
    closeModal,
    title,
    review,
    onSubmitReview,
  } = props;
  const { t } = useTranslation();
  const { notify } = useNotification();
  const { userId } = useContext(UserContext);
  const orientation = useOrientationContext((state) => state.orientation);

  const [reviewData, setReviewData] = useState(() => {
    return {
      title: review?.title || '',
      content: review?.content || '',
    };
  });
  const [rank, setRank] = useState(5);
  const [isAnonymous, setIsAnonymous] = useState(!userId);
  const [isPending, setIsPending] = useState(false);

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
      setRank(5);
    }
  }, [review]);

  const onChangeInput = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setReviewData((previousReviewData) => {
      return {
        ...previousReviewData,
        [event.target.name]: event.target.value,
      };
    });
  };

  const resetReview = () => {
    setReviewData({ title: '', content: '' });
    setRank(5);
    setIsAnonymous(!userId);
  };

  const handleClose = () => {
    resetReview();
    closeModal();
  };

  const onSubmit = async () => {
    if (!reviewData.title || isPending) {
      return;
    }

    setIsPending(true);

    try {
      // Wait for the caller's mutation before showing success or closing.
      await onSubmitReview(
        {
          title: reviewData.title,
          content: reviewData.content,
          rank: Number(rank),
        },
        isAnonymous
      );
    } catch {
      notify(t('toasts.generic.error'), true);
      setIsPending(false);
      return;
    }

    resetReview();
    notify();
    setIsPending(false);
    closeModal();
  };

  const onChangeAnonymousStatus = () => {
    setIsAnonymous((previousIsAnonymous) => !previousIsAnonymous);
  };

  return (
    <FormModal
      saveText={t('common.actions.submit')}
      open={isOpen}
      onClose={handleClose}
      onSave={onSubmit}
      disabled={!reviewData.title}
      isPending={isPending}
      className={styles.modal}
      title={title || t('reviews.modal.title')}
    >
      <form className={styles.form}>
        <ControlledInput
          label={`${t('reviews.modal.placeholderTitle')} *`}
          name="title"
          value={reviewData.title}
          onChange={onChangeInput}
          placeholder={t('reviews.modal.placeholderTitle')}
          required
        />
        <TextArea
          label={t('reviews.modal.placeholderContentLabel') || 'Content'}
          name="content"
          rows={orientation === 'landscape' ? 3 : 7}
          maxLength={280}
          value={reviewData.content}
          onChange={onChangeInput}
          placeholder={t('reviews.modal.placeholderContent')}
          className={styles.content}
        />
        <div className={styles.rankContainer}>
          <span className={styles.rankTitle}>
            {t('reviews.modal.rankTitle')}
          </span>
          <Stars
            className={styles.stars}
            rank={rank}
            setRank={setRank}
            size={32}
          />
        </div>
        {!review && !!userId && (
          <Checkbox
            id="isAnonymous"
            label={t('reviews.modal.reportAnonymously')}
            isChecked={isAnonymous}
            onChange={onChangeAnonymousStatus}
            className={styles.checkbox}
          />
        )}
      </form>
    </FormModal>
  );
};

export { ReviewModal };

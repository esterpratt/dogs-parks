import { useContext, useEffect, useState } from 'react';
import { Review } from '../types/review';
import { ControlledInput } from './inputs/ControlledInput';
import { TextArea } from './inputs/TextArea';
import { Stars } from './Stars';
import { Checkbox } from './inputs/Checkbox';
import { UserContext } from '../context/UserContext';
import { useOrientationContext } from '../context/OrientationContext';
import { useNotification } from '../context/NotificationContext';
import { FormModal } from './modals/FormModal';
import styles from './ReviewModal.module.scss';
import { useTranslation } from 'react-i18next';

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

export const ReviewModal: React.FC<ReviewModalProps> = ({
  isOpen,
  closeModal,
  title,
  review,
  onSubmitReview,
}) => {
  const { t } = useTranslation();
  const { notify } = useNotification();

  const [reviewData, setReviewData] = useState(() => {
    return {
      title: review?.title || '',
      content: review?.content || '',
    };
  });
  const [rank, setRank] = useState<number>(5);
  const { userId } = useContext(UserContext);
  const [isAnonymous, setIsAnonymous] = useState(userId ? false : true);

  const orientation = useOrientationContext((state) => state.orientation);

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
    setReviewData((prev) => {
      return {
        ...prev,
        [event.target.name]: event.target.value,
      };
    });
  };

  const resetReview = () => {
    setReviewData({ title: '', content: '' });
    setRank(5);
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
    notify();
  };

  const onChangeAnonymousStatus = () => {
    setIsAnonymous((prev) => !prev);
  };

  return (
    <FormModal
      saveText={t('common.actions.submit')}
      open={isOpen}
      onClose={closeModal}
      onSave={onSubmit}
      disabled={!reviewData.title}
      className={styles.modal}
      title={title || t('reviews.modal.title')}
    >
      <form className={styles.form}>
        <ControlledInput
          label={t('reviews.modal.placeholderTitle') + ' *'}
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

import { useEffect, useState } from 'react';
import { ControlledInput } from '../inputs/ControlledInput';
import { Stars } from '../Stars';
import { Button } from '../Button';
import styles from './ReviewForm.module.scss';
import { Review } from '../../types/review';
import { TextArea } from '../inputs/TextArea';
import { Checkbox } from '../inputs/Checkbox';

interface ReviewFormProps {
  review?: Review;
  onSubmitForm: (
    reviewData: {
      title: string;
      content: string;
      rank: number;
    },
    isAnonymous: boolean
  ) => void;
}

const ReviewForm: React.FC<ReviewFormProps> = ({ review, onSubmitForm }) => {
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

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmitForm(
      {
        title: reviewData.title,
        content: reviewData.content,
        rank: Number(rank),
      },
      isAnonymous
    );
    resetReview();
  };

  const onChangeAnonymousStatus = () => {
    setIsAnonymous((prev) => !prev);
  };

  return (
    <div className={styles.container}>
      <span className={styles.title}>How do you find the park?</span>
      <form onSubmit={onSubmit} className={styles.form}>
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
        <Button variant="green" type="submit" className={styles.button}>
          Submit
        </Button>
      </form>
    </div>
  );
};

export { ReviewForm };

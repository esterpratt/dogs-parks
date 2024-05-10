import { useEffect, useState } from 'react';
import { ControlledInput } from '../ControlledInput';
import { Stars } from '../Stars';
import { Button } from '../Button';
import styles from './ReviewForm.module.scss';
import { Review } from '../../types/review';
import { TextArea } from '../TextArea';

interface ReviewFormProps {
  review?: Review;
  onSubmitForm: (reviewData: {
    title: string;
    content: string;
    rank: number;
  }) => void;
}

const ReviewForm: React.FC<ReviewFormProps> = ({ review, onSubmitForm }) => {
  const [reviewData, setReviewData] = useState(() => {
    return {
      title: review?.title || '',
      content: review?.content || '',
    };
  });
  const [rank, setRank] = useState<number>(0);

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

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmitForm({
      title: reviewData.title,
      content: reviewData.content,
      rank: Number(rank),
    });
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
        <Button variant="orange" type="submit" className={styles.button}>
          Submit
        </Button>
      </form>
    </div>
  );
};

export { ReviewForm };

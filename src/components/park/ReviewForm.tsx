import { useEffect, useState } from 'react';
import { ControlledInput } from '../ControlledInput';
import { fetchReview } from '../../services/reviews';
import { Stars } from '../Stars';
import { Button } from '../Button';
import styles from './ReviewForm.module.scss';

interface ReviewFormProps {
  reviewId?: string;
  onSubmitForm: (
    reviewData: {
      title: string;
      content: string;
      rank: number;
    },
    reviewId?: string
  ) => void;
}

const ReviewForm: React.FC<ReviewFormProps> = ({ reviewId, onSubmitForm }) => {
  const [reviewData, setReviewData] = useState({
    title: '',
    content: '',
  });
  const [rank, setRank] = useState<number>(5);

  useEffect(() => {
    const getReviewData = async () => {
      const data = await fetchReview(reviewId!);
      // TODO: setReviewData
      console.log(data);
    };
    if (reviewId) {
      getReviewData();
    }
  }, [reviewId]);

  const onChangeInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    setReviewData((prev) => {
      return {
        ...prev,
        [event.target.name]: event.target.value,
      };
    });
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmitForm(
      {
        title: reviewData.title,
        content: reviewData.content,
        rank: Number(rank),
      },
      reviewId
    );
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
        <ControlledInput
          label="Content"
          name="content"
          value={reviewData.content}
          onChange={onChangeInput}
          placeholder="Please elaborate"
        />
        <span className={styles.rankTitle}>Rank:</span>
        <Stars rank={rank} setRank={setRank} size={32} />
        <Button type="submit" className={styles.button}>
          Submit review
        </Button>
      </form>
    </div>
  );
};

export { ReviewForm };

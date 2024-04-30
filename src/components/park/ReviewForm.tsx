import { useEffect, useState } from 'react';
import { ControlledInput } from '../ControlledInput';

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
  const [rank, setRank] = useState<string>('5');

  useEffect(() => {
    const getReviewData = async () => {
      // TODO: implement
      // const data = fetchReview(reviewId)
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
    <div>
      <form onSubmit={onSubmit}>
        <ControlledInput
          label="Title"
          name="title"
          value={reviewData.title}
          onChange={onChangeInput}
        />
        <ControlledInput
          label="Content"
          name="content"
          value={reviewData.content}
          onChange={onChangeInput}
        />
        {/* TODO: change to stars component */}
        <input
          value={rank}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
            setRank(event.target.value)
          }
          type="number"
          max={5}
          min={0}
        />
        <button type="submit">Add review</button>
      </form>
    </div>
  );
};

export { ReviewForm };

import {
  Dispatch,
  ReactNode,
  SetStateAction,
  createContext,
  useState,
} from 'react';
import { Review } from '../types/review';
import { UpdateReviewProps } from '../services/reviews';
import { ReviewModal } from '../components/ReviewModal';

interface ReviewModalContextObj {
  openedReview: Review | null;
  setOpenedReview: Dispatch<SetStateAction<Review | null>>;
  onUpdateReview: (updateReviewProps: UpdateReviewProps) => Promise<unknown>;
}

const initialData: ReviewModalContextObj = {
  openedReview: null,
  setOpenedReview: () => {},
  onUpdateReview: async () => {},
};

const ReviewModalContext = createContext<ReviewModalContextObj>(initialData);

interface ReviewModalContextProviderProps {
  onUpdateReview: (updateReviewProps: UpdateReviewProps) => Promise<unknown>;
  children: ReactNode;
}

const ReviewModalContextProvider: React.FC<
  ReviewModalContextProviderProps
> = (props) => {
  const { children, onUpdateReview } = props;
  const [openedReview, setOpenedReview] = useState<Review | null>(null);

  const onSubmitReview = (
    updatedReview: UpdateReviewProps['reviewData']
  ) => {
    // Return the mutation promise so ReviewModal controls its pending state.
    return onUpdateReview({
      reviewId: openedReview!.id,
      reviewData: updatedReview,
    });
  };

  const value: ReviewModalContextObj = {
    openedReview,
    setOpenedReview,
    onUpdateReview,
  };

  return (
    <ReviewModalContext.Provider value={value}>
      {children}
      <ReviewModal
        review={openedReview ?? undefined}
        isOpen={!!openedReview}
        closeModal={() => setOpenedReview(null)}
        onSubmitReview={onSubmitReview}
      />
    </ReviewModalContext.Provider>
  );
};

export { ReviewModalContextProvider, ReviewModalContext };

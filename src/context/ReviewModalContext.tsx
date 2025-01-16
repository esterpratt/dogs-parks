import {
  Dispatch,
  SetStateAction,
  createContext,
  useState,
  ReactNode,
} from 'react';
import { Review } from '../types/review';
import { UpdateReviewProps } from '../services/reviews';
import { ReviewModal } from '../components/ReviewModal';

interface ReviewModalContextObj {
  openedReview: Review | null;
  setOpenedReview: Dispatch<SetStateAction<Review | null>>;
  onUpdateReview: ({ reviewData, reviewId }: UpdateReviewProps) => void;
}

const initialData: ReviewModalContextObj = {
  openedReview: null,
  setOpenedReview: () => {},
  onUpdateReview: () => {},
};

const ReviewModalContext = createContext<ReviewModalContextObj>(initialData);

interface ReviewModalContextProviderProps {
  onUpdateReview: ({ reviewData, reviewId }: UpdateReviewProps) => void;
  children: ReactNode;
}

const ReviewModalContextProvider: React.FC<ReviewModalContextProviderProps> = ({
  children,
  onUpdateReview,
}) => {
  const [openedReview, setOpenedReview] = useState<Review | null>(null);

  const onSubmitReview = (updatedReview: {
    title: string;
    content?: string;
    rank: number;
  }) => {
    if (onUpdateReview) {
      onUpdateReview({
        reviewId: openedReview!.id,
        reviewData: updatedReview,
      });
    }
    setOpenedReview(null);
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

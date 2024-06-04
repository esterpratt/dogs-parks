import {
  Dispatch,
  SetStateAction,
  createContext,
  useState,
  lazy,
  Suspense,
  ReactNode,
} from 'react';
import { Loading } from '../components/Loading';
import { Review } from '../types/review';
import { UpdateReviewProps } from '../services/reviews';
const ReviewModal = lazy(() => import('../components/ReviewModal'));

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
      <Suspense fallback={<Loading />}>
        <ReviewModal
          review={openedReview ?? undefined}
          isOpen={!!openedReview}
          closeModal={() => setOpenedReview(null)}
          onSubmitReview={onSubmitReview}
        />
      </Suspense>
    </ReviewModalContext.Provider>
  );
};

export { ReviewModalContextProvider, ReviewModalContext };

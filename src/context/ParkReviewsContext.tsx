import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useReducer,
} from 'react';
import { Review } from '../types/review';
import { fetchParkRank, fetchReviews } from '../services/reviews';
import { UserReviewsContext } from './UserReviewsContext';

interface ParkReviewsContextObj {
  reviews: Review[];
  reviewsCount: number;
  rank: number | null;
  loading: boolean;
}

interface ParkReviewsContextProps {
  children: ReactNode;
  parkId: string;
}

const initialData: ParkReviewsContextObj = {
  reviews: [],
  reviewsCount: 0,
  rank: 0,
  loading: true,
};

const ParkReviewsContext = createContext<ParkReviewsContextObj>(initialData);

enum REVIEWS_ACTION_TYPE {
  GET_REVIEWS = 'get-reviews',
  UPDATE_REVIEWS = 'update-reviews',
}

interface ReviewsState {
  reviews: Review[];
  rank: number;
  loading: boolean;
}

interface ReviewsAction {
  type: REVIEWS_ACTION_TYPE;
  payload:
    | { reviews: Review[]; rank: number | null }
    | { updatedReview: Review | null };
}

const reviewsReducer = (state: ReviewsState, action: ReviewsAction) => {
  switch (action.type) {
    case REVIEWS_ACTION_TYPE.GET_REVIEWS: {
      const { reviews, rank } = action.payload as ReviewsState;
      return {
        reviews,
        rank,
        loading: false,
      };
    }
    case REVIEWS_ACTION_TYPE.UPDATE_REVIEWS: {
      const { updatedReview } = action.payload as {
        updatedReview: Review | null;
      };

      if (!updatedReview) {
        return state;
      }

      const reviewsWithoutUpdated = [
        ...state.reviews.filter((review) => review.id !== updatedReview.id),
      ];
      const newReviews = [updatedReview, ...reviewsWithoutUpdated];
      const prevReviewsLength = state.reviews.length;
      let newRank;
      if (newReviews.length > prevReviewsLength) {
        newRank =
          ((state.rank || 0) * prevReviewsLength + updatedReview.rank) /
          (prevReviewsLength + 1);
      } else {
        const prevReview = state.reviews.find(
          (review) => review.id === updatedReview.id
        );
        const prevRankWithoutUpdated =
          ((state.rank || 0) * prevReviewsLength - (prevReview?.rank || 0)) /
          (prevReviewsLength - 1);
        newRank =
          (prevRankWithoutUpdated * (prevReviewsLength - 1) +
            updatedReview.rank) /
          newReviews.length;
      }

      return {
        ...state,
        reviews: newReviews,
        rank: newRank,
      };
    }
    default: {
      return state;
    }
  }
};

const ParkReviewsContextProvider: React.FC<ParkReviewsContextProps> = ({
  children,
  parkId,
}) => {
  const { updatedReview } = useContext(UserReviewsContext);
  const [reviewsState, reviewsDispatch] = useReducer(reviewsReducer, {
    reviews: [],
    rank: 0,
    loading: true,
  });

  useEffect(() => {
    const getReviewsData = async () => {
      const reviews = await fetchReviews(parkId);
      let rank = null;

      if (reviews.length) {
        reviews.sort((a, b) => {
          const aDate = a.updatedAt
            ? a.updatedAt.getTime()
            : a.createdAt!.getTime();
          const bDate = b.updatedAt
            ? b.updatedAt.getTime()
            : b.createdAt!.getTime();
          return bDate - aDate;
        });
        rank = await fetchParkRank(parkId);
      }

      reviewsDispatch({
        type: REVIEWS_ACTION_TYPE.GET_REVIEWS,
        payload: { reviews, rank },
      });
    };

    getReviewsData();
  }, [parkId]);

  useEffect(() => {
    reviewsDispatch({
      type: REVIEWS_ACTION_TYPE.UPDATE_REVIEWS,
      payload: { updatedReview },
    });
  }, [updatedReview]);

  const value: ParkReviewsContextObj = {
    reviews: reviewsState.reviews,
    reviewsCount: reviewsState.reviews.length,
    rank: reviewsState.rank,
    loading: reviewsState.loading,
  };

  return (
    <ParkReviewsContext.Provider value={value}>
      {children}
    </ParkReviewsContext.Provider>
  );
};

export { ParkReviewsContextProvider, ParkReviewsContext };

import { ReactNode, createContext, useEffect, useState } from 'react';
import { Review } from '../types/review';
import { createReview, fetchParkRank, fetchReviews } from '../services/reviews';

interface ParkReviewsContextObj {
  reviews: Review[];
  reviewsCount: number;
  rank: number | null;
  loading: boolean;
  addReview: ({
    review,
    userId,
  }: {
    review: Omit<Review, 'id' | 'parkId' | 'createdAt' | 'userId'>;
    userId: string | null;
  }) => void;
}

interface ParkReviewsContextProps {
  children: ReactNode;
  parkId: string;
}

const initialData: ParkReviewsContextObj = {
  reviews: [],
  reviewsCount: 0,
  rank: null,
  loading: true,
  addReview: () => {},
};

const ParkReviewsContext = createContext<ParkReviewsContextObj>(initialData);

const ParkReviewsContextProvider: React.FC<ParkReviewsContextProps> = ({
  children,
  parkId,
}) => {
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsCount, setReviewsCount] = useState(0);
  const [rank, setRank] = useState<number | null>(null);

  useEffect(() => {
    const getReviewsData = async () => {
      const reviews = await fetchReviews(parkId);
      if (reviews.length) {
        setReviewsCount(reviews.length);
        setReviews(reviews);
        const rank = await fetchParkRank(parkId);
        setRank(rank);
      }
      setLoading(false);
    };

    getReviewsData();
  }, [parkId]);

  const addReview = async ({
    review,
    userId,
  }: {
    review: Omit<Review, 'id' | 'parkId' | 'createdAt' | 'userId'>;
    userId: string | null;
  }) => {
    const id = await createReview({ parkId, review, userId });
    if (id) {
      setReviews((prevReviews) => [
        ...prevReviews,
        { ...review, id, parkId, userId },
      ]);
      setRank(
        (prev) =>
          ((prev || 0) * reviewsCount + review.rank) / (reviewsCount + 1)
      );
      setReviewsCount((prev) => prev + 1);
    }
  };

  const value: ParkReviewsContextObj = {
    reviews,
    addReview,
    reviewsCount,
    rank,
    loading,
  };

  return (
    <ParkReviewsContext.Provider value={value}>
      {children}
    </ParkReviewsContext.Provider>
  );
};

export { ParkReviewsContextProvider, ParkReviewsContext };

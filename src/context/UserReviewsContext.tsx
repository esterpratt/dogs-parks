import { PropsWithChildren, createContext, useEffect, useState } from 'react';
import { useOnAuthStateChanged } from '../hooks/useOnAuthStateChanged';
import { Review } from '../types/review';
import {
  UpdateReviewProps,
  fetchUserReviews,
  updateReview,
} from '../services/reviews';

interface UserReviewsContextObj {
  reviews: Review[];
  updateUserReview: ({ reviewId, reviewData }: UpdateReviewProps) => void;
}

const initialData: UserReviewsContextObj = {
  reviews: [],
  updateUserReview: () => {},
};

const UserReviewsContext = createContext<UserReviewsContextObj>(initialData);

const UserReviewsContextProvider: React.FC<PropsWithChildren> = ({
  children,
}) => {
  const { userId } = useOnAuthStateChanged();
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    const getReviews = async () => {
      const reviews = await fetchUserReviews(userId!);
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
        setReviews(reviews);
      } else {
        setReviews([]);
      }
    };

    if (userId) {
      getReviews();
    } else {
      setReviews([]);
    }
  }, [userId]);

  const updateUserReview = async ({
    reviewId,
    reviewData,
  }: UpdateReviewProps) => {
    const updatedReview = await updateReview({ reviewId, reviewData });
    if (updatedReview) {
      setReviews((prevReviews) => [
        { ...updatedReview },
        ...prevReviews.filter((review) => review.id !== reviewId),
      ]);
    }
  };

  const value: UserReviewsContextObj = {
    reviews,
    updateUserReview,
  };

  return (
    <UserReviewsContext.Provider value={value}>
      {children}
    </UserReviewsContext.Provider>
  );
};

export { UserReviewsContextProvider, UserReviewsContext };

import { PropsWithChildren, createContext, useEffect, useState } from 'react';
import { useOnAuthStateChanged } from '../hooks/useOnAuthStateChanged';
import { Review } from '../types/review';
import {
  AddReviewProps,
  UpdateReviewProps,
  createReview,
  fetchUserReviews,
  updateReview,
} from '../services/reviews';

interface UserReviewsContextObj {
  reviews: Review[];
  updatedReview: Review | null;
  addReview: ({
    parkId,
    reviewData,
    isAnonymous,
  }: Omit<AddReviewProps, 'userId'> & { isAnonymous?: boolean }) => void;
  updateUserReview: ({ reviewId, reviewData }: UpdateReviewProps) => void;
}

const initialData: UserReviewsContextObj = {
  reviews: [],
  updatedReview: null,
  addReview: () => {},
  updateUserReview: () => {},
};

const UserReviewsContext = createContext<UserReviewsContextObj>(initialData);

const UserReviewsContextProvider: React.FC<PropsWithChildren> = ({
  children,
}) => {
  const { userId } = useOnAuthStateChanged();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [updatedReview, setUpdatedReview] = useState<Review | null>(null);

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

  const addReview = async ({
    parkId,
    reviewData,
    isAnonymous,
  }: Omit<AddReviewProps, 'userId'> & { isAnonymous?: boolean }) => {
    const savedReview = await createReview({
      parkId,
      reviewData,
      userId: isAnonymous ? null : userId,
    });
    if (savedReview) {
      if (!isAnonymous) {
        setReviews((prevReviews) => [{ ...savedReview }, ...prevReviews]);
      }
      setUpdatedReview(savedReview);
    }
  };

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
      setUpdatedReview(updatedReview);
    }
  };

  const value: UserReviewsContextObj = {
    reviews,
    updateUserReview,
    addReview,
    updatedReview,
  };

  return (
    <UserReviewsContext.Provider value={value}>
      {children}
    </UserReviewsContext.Provider>
  );
};

export { UserReviewsContextProvider, UserReviewsContext };

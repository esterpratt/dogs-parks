import { Review } from '../types/review';
import { db } from './firebase-config';
import {
  collection,
  where,
  query,
  getCountFromServer,
  average,
  getAggregateFromServer,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';

interface AddReviewProps {
  parkId: string;
  userId: string;
  review: Omit<Review, 'parkId' | 'createdAt' | 'userId'>;
}

const reviewsCollection = collection(db, 'reviews');

const fetchReviewsCount = async (parkId: string) => {
  try {
    const reviewsCountQuery = query(
      reviewsCollection,
      where('parkId', '==', parkId)
    );
    const snapshot = await getCountFromServer(reviewsCountQuery);
    return snapshot.data().count;
  } catch (error) {
    console.error(error);
    return null;
  }
};

const fetchParkRank = async (parkId: string) => {
  try {
    const parkRankQuery = query(
      reviewsCollection,
      where('parkId', '==', parkId)
    );
    const snapshot = await getAggregateFromServer(parkRankQuery, {
      average: average('rank'),
    });
    return snapshot.data().average;
  } catch (error) {
    console.error(error);
    return null;
  }
};

const fetchReviews = async (parkId: string) => {};

const addReview = async ({ parkId, userId, review }: AddReviewProps) => {
  // TODO: first check if review exists and needs to be updated. if so - update updateTime and not creationTime
  try {
    const res = await addDoc(reviewsCollection, {
      title: review.title,
      content: review.content,
      rank: review.rank,
      parkId,
      userId,
      createdAt: serverTimestamp(),
    });
    return res.id;
  } catch (error) {
    return null;
  }
};

export { fetchParkRank, fetchReviews, fetchReviewsCount, addReview };

import { Review } from '../types/review';
import { AppError, throwError } from './error';
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
  doc,
  updateDoc,
  getDoc,
  getDocs,
} from 'firebase/firestore';

interface AddReviewProps {
  parkId: string;
  userId: string;
  review: Omit<Review, 'id' | 'parkId' | 'createdAt' | 'userId'>;
}

interface UpdateReviewProps {
  reviewId: string;
  review: Omit<Review, 'id' | 'parkId' | 'createdAt' | 'userId'>;
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

const fetchReviews = async (parkId: string) => {
  try {
    const reviewsQuery = query(
      reviewsCollection,
      where('parkId', '==', parkId)
    );

    const querySnapshot = await getDocs(reviewsQuery);
    const res: Review[] = [];
    querySnapshot.forEach((doc) => {
      res.push({
        ...doc.data(),
        id: doc.id,
        createdAt: doc.data().createdAt.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      } as Review);
    });
    return res;
  } catch (error) {
    console.error(
      `there was an error while fetching reviews for park ${parkId}: ${error}`
    );
    return [];
  }
};

const fetchReview = async (reviewId: string) => {
  try {
    const docRef = doc(db, 'reviews', reviewId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new AppError('review does not exists', 404);
    }

    const review = docSnap.data() as Review;
    return { ...review, id: docSnap.id };
  } catch (error) {
    throwError(error);
  }
};

const updateReview = async ({ reviewId, review }: UpdateReviewProps) => {
  try {
    const reviewRef = doc(db, 'reviews', reviewId);
    const res = await updateDoc(reviewRef, {
      ...review,
      updatedAt: serverTimestamp(),
    });
    return res;
  } catch {
    return null;
  }
};

const addReview = async ({ parkId, userId, review }: AddReviewProps) => {
  try {
    const res = await addDoc(reviewsCollection, {
      title: review.title,
      content: review.content,
      rank: review.rank,
      parkId,
      userId,
      createdAt: serverTimestamp(),
      updatedAt: null,
    });
    return res.id;
  } catch (error) {
    return null;
  }
};

export {
  fetchParkRank,
  fetchReviews,
  fetchReview,
  fetchReviewsCount,
  addReview,
  updateReview,
};

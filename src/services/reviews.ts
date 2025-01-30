import { ReportReason } from '../types/report';
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
  userId: string | null;
  reviewData: Omit<Review, 'id' | 'parkId' | 'createdAt' | 'userId'>;
}

interface UpdateReviewProps {
  reviewId: string;
  reviewData: Omit<Review, 'id' | 'parkId' | 'createdAt' | 'userId'>;
}

const reviewsCollection = collection(db, 'reviews');
const reviewReportsCollection = collection(db, 'reviewReports');

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

const fetchUserReviews = async (userId: string) => {
  try {
    const reviewsQuery = query(
      reviewsCollection,
      where('userId', '==', userId)
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
      `there was an error while fetching reviews pf user ${userId}: ${error}`
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

const updateReview = async ({ reviewId, reviewData }: UpdateReviewProps) => {
  try {
    const reviewRef = doc(db, 'reviews', reviewId);
    await updateDoc(reviewRef, {
      ...reviewData,
      updatedAt: serverTimestamp(),
    });
    const reviewSnap = await getDoc(reviewRef);
    return {
      ...reviewSnap.data(),
      id: reviewSnap.id,
      updatedAt: reviewSnap.data()?.updatedAt.toDate(),
      createdAt: reviewSnap.data()?.createdAt.toDate(),
    } as Review;
  } catch (error) {
    console.error(`there was an error updating review ${reviewId}: ${error}`);
    return null;
  }
};

const createReview = async ({ parkId, userId, reviewData }: AddReviewProps) => {
  try {
    const docRef = await addDoc(reviewsCollection, {
      title: reviewData.title,
      content: reviewData.content,
      rank: reviewData.rank,
      parkId,
      userId,
      createdAt: serverTimestamp(),
      updatedAt: null,
    });
    const savedReview = await getDoc(docRef);
    return {
      ...savedReview.data(),
      id: savedReview.id,
      updatedAt: savedReview.data()?.updatedAt?.toDate(),
      createdAt: savedReview.data()?.createdAt.toDate(),
    } as Review;
  } catch (error) {
    console.error(
      `there was an error creating review for park ${parkId}: ${error}`
    );
    return null;
  }
};

const reportReview = async ({
  reviewId,
  reason,
}: {
  reviewId: string;
  reason: ReportReason;
}) => {
  try {
    await addDoc(reviewReportsCollection, {
      reviewId,
      reason,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error(`there was an error reporting review ${reviewId}: ${error}`);
  }
};

export {
  fetchParkRank,
  fetchReviews,
  fetchReview,
  fetchReviewsCount,
  createReview,
  updateReview,
  fetchUserReviews,
  reportReview,
};

export type { UpdateReviewProps, AddReviewProps };

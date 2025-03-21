import { ReportReason } from '../types/report';
import { Review } from '../types/review';
import { throwError } from './error';
import { supabase } from './supabase-client';

interface AddReviewProps {
  parkId: string;
  userId: string | null;
  reviewData: Omit<Review, 'id' | 'park_id' | 'created_at' | 'user_id'>;
}

interface UpdateReviewProps {
  reviewId: string;
  reviewData: Omit<Review, 'id' | 'park_id' | 'created_at' | 'user_id'>;
}

const fetchReviewsCount = async (parkId: string) => {
  try {
    const { count, error } = await supabase
    .from('reviews')
    .select('*', { count: 'exact', head: true })
    .eq('park_id', parkId);


    if (error) {
      throw error;
    }

    return count;
  } catch (error) {
    console.error(`there was an error while fetching reviews count for park ${parkId}: ${JSON.stringify(error)}`);
    return null;
  }
};

const fetchParkRank = async (parkId: string) => {
  try {
    const { data, error } = await supabase
    .from('reviews')
    .select('rank.avg()')
    .eq('park_id', parkId)
    .single()

    if (error) {
      throw error;
    }

    return data.avg;
  } catch (error) {
    console.error(`there was an error while fetching rank for park ${parkId}: ${JSON.stringify(error)}`);
    return null;
  }
};

const fetchReviews = async (parkId: string) => {
  try {
    const { data: reviews, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('park_id', parkId)

    if (error) {
      throw error;
    }

    return reviews;
  } catch (error) {
    console.error(
      `there was an error while fetching reviews for park ${parkId}: ${JSON.stringify(error)}`
    );
    return [];
  }
};

const fetchUserReviews = async (userId: string) => {
  try {
    const { data: reviews, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('user_id', userId)

    if (error) {
      throw error;
    }

    return reviews;
  } catch (error) {
    console.error(
      `there was an error while fetching reviews of user ${userId}: ${JSON.stringify(error)}`
    );
    return [];
  }
};

const fetchReview = async (reviewId: string) => {
  try {
    const { data: review, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('id', reviewId)
    .single();

    if (error) {
      throw error;
    }

    return review;
  } catch (error) {
    throwError(error);
  }
};

const updateReview = async ({ reviewId, reviewData }: UpdateReviewProps) => {
  try {
    const { data: reviews, error } = await supabase
    .from('reviews')
    .update({ ...reviewData })
    .eq('id', reviewId)
    .select()
    .single();

    if (error) {
      throw error;
    }

    return reviews;
  } catch (error) {
    console.error(`there was an error updating review ${reviewId}: ${JSON.stringify(error)}`);
    return null;
  }
};

const createReview = async ({ parkId, userId, reviewData }: AddReviewProps) => {
  try {
    const { data: review, error } = await supabase
    .from('reviews')
    .insert([
      { 'park_id': parkId, 'user_id': userId, 'title': reviewData.title, 'content': reviewData.content, 'rank': reviewData.rank},
    ])
    .select()
    .single();
  
    if (error) {
      throw error;
    }
    
    return review;
  } catch (error) {
    console.error(
      `there was an error creating review for park ${parkId}: ${JSON.stringify(error)}`
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
    const { error } = await supabase
    .from('review_reports')
    .insert([
      { 'review_id': reviewId, 'reason': reason },
    ])

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error(`there was an error reporting review ${reviewId}: ${JSON.stringify(error)}`);
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

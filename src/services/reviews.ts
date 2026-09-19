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

const fetchParkRank = async (parkId: string) => {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('rank.avg()')
      .eq('park_id', parkId)
      .single();

    if (error) {
      throw error;
    }

    return data.avg;
  } catch (error) {
    console.error(
      `there was an error while fetching rank for park ${parkId}: ${error}`
    );
    return null;
  }
};

const fetchReviews = async (parkId: string) => {
  try {
    const { data: reviews, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('park_id', parkId);

    if (error) {
      throw error;
    }

    return reviews;
  } catch (error) {
    console.error(
      `there was an error while fetching reviews for park ${parkId}: ${error}`
    );
    return [];
  }
};

const fetchUserReviews = async (userId: string) => {
  try {
    const { data: reviews, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      throw error;
    }

    return reviews;
  } catch (error) {
    console.error(
      `there was an error while fetching reviews of user ${userId}: ${error}`
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
    const { data: review, error } = await supabase
      .from('reviews')
      .update({ ...reviewData })
      .eq('id', reviewId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return review;
  } catch (error) {
    // Allow the review modal to roll back and remain open after failure.
    throwError(error);
  }
};

const createReview = async ({ parkId, userId, reviewData }: AddReviewProps) => {
  try {
    const { data: review, error } = await supabase
      .from('reviews')
      .insert([
        {
          park_id: parkId,
          user_id: userId,
          title: reviewData.title,
          content: reviewData.content,
          rank: reviewData.rank,
        },
      ])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return review;
  } catch (error) {
    // A failed insert must reject instead of being treated as a successful null result.
    throwError(error);
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
      .insert([{ review_id: reviewId, reason }]);

    if (error) {
      throw error;
    }
  } catch (error) {
    // Keep the report modal open when the report was not persisted.
    throwError(error);
  }
};

export {
  fetchParkRank,
  fetchReviews,
  fetchReview,
  createReview,
  updateReview,
  fetchUserReviews,
  reportReview,
};

export type { UpdateReviewProps };

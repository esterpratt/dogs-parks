import { useMutation } from '@tanstack/react-query';
import { createReview } from '../services/reviews';
import { ReviewData } from '../types/review';
import { queryClient } from '../services/react-query';

const useAddReview = (parkId: string, userId: string | null) => {
  const { mutate } = useMutation({
    mutationFn: (data: { reviewData: ReviewData; isAnonymous?: boolean }) =>
      createReview({
        parkId,
        reviewData: data.reviewData,
        userId: data.isAnonymous ? null : userId,
      }),
    onSuccess: async () => {
      queryClient.invalidateQueries({
        queryKey: ['reviews', parkId],
      });
      queryClient.invalidateQueries({
        queryKey: ['reviews', userId],
      });
    },
  });

  return { addReview: mutate };
};

export { useAddReview };

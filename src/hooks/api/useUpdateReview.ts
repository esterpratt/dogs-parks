import { useMutation } from '@tanstack/react-query';
import { updateReview } from '../../services/reviews';
import { Review, ReviewData } from '../../types/review';
import { queryClient } from '../../services/react-query';

const useUpdateReview = (parkId: string) => {
  const { mutate } = useMutation({
    mutationFn: (data: { reviewData: ReviewData; reviewId: string }) =>
      updateReview({ reviewData: data.reviewData, reviewId: data.reviewId }),
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: ['reviews', parkId] });
      const prevReviews = queryClient.getQueryData<Review[]>([
        'reviews',
        parkId,
      ]);
      const review = prevReviews?.find((review) => review.id === data.reviewId);
      const updatedReview = { ...review, ...data?.reviewData };
      queryClient.setQueryData(
        ['reviews', parkId],
        [
          ...(prevReviews ?? []).filter(
            (review) => review.id !== data.reviewId
          ),
          updatedReview,
        ]
      );
      return { prevReviews };
    },
    onError: (_error, _data, context) => {
      queryClient.setQueryData(['reviews', parkId], context?.prevReviews);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', parkId] });
    },
  });

  return { mutateReview: mutate };
};

export { useUpdateReview };

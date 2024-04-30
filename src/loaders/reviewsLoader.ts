import { LoaderFunction } from 'react-router';
import { fetchReviews } from '../services/reviews';

const reviewsLoader: LoaderFunction = async ({ params }) => {
  const { id: parkId } = params;
  const reviews = await fetchReviews(parkId!);
  return { reviews, parkId };
};

export { reviewsLoader };

import { LoaderFunction } from 'react-router';
import { fetchUserFavorites } from '../services/favorites';

const userFavoritesLoader: LoaderFunction = async ({ params }) => {
  const { id: userId } = params;
  const favoriteParkIds = await fetchUserFavorites(userId!);

  return { favoriteParkIds: favoriteParkIds?.parkIds ?? [] };
};

export { userFavoritesLoader };

import { Favorites } from '../types/favorites';
import { supabase } from './supabase-client';

interface ActionFavoriteProps {
  userId: string;
  parkId: string;
}

const addFavorite = async ({ userId, parkId }: ActionFavoriteProps) => {
  try {
    const { error } = await supabase
      .from('favorites')
      .insert([
        { user_id: userId, park_id: parkId },
      ])

    if (error) {
      throw error;
    }
  } catch(error) {
    console.error(`there was an error adding favorite park: ${parkId} for user: ${userId}: ${JSON.stringify(error)}`)
  }
};

const removeFavorite = async ({ userId, parkId }: ActionFavoriteProps) => {
  try {
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('park_id', parkId)
      .eq('user_id', userId)

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error(
      `there was an error removing favorite park ${parkId} from user ${userId}: ${JSON.stringify(error)}`
    );
  }
};

const fetchUserFavorites = async (userId: string) => {
  try {
    const { data: favorites, error } = await supabase
      .from('favorites')
      .select('park_id')
      .eq('user_id', userId)

    if (error) {
      throw error;
    }

    return favorites.map(favorite => favorite.park_id);
  } catch (error) {
    console.error(
      `there was an error fetching favorites parks for user ${userId}: ${JSON.stringify(error)}`
    );
    return null;
  }
};

const fetchFavoriteParks = async () => {
  try {
    const { data: favorites, error } = await supabase.rpc('get_favorite_park');

    if (error) {
      throw error;
    }

    return (favorites as Favorites[]).map(favorite => favorite.park_id);
  } catch (error) {
    console.error(`there was an error fetching favorite park: ${JSON.stringify(error)}`);
    return [];
  }
};

export { addFavorite, removeFavorite, fetchUserFavorites, fetchFavoriteParks };

import {
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { db } from './firebase-config';
import { Favorites } from '../types/favorites';

interface AddFavoriteProps {
  userId: string;
  parkId: string;
}

interface RemoveFavoriteProps extends AddFavoriteProps {}

interface GetAndUpdateProps extends AddFavoriteProps {
  action: 'remove' | 'add';
}

const favoritesCollection = collection(db, 'favorites');

const getAndUpdate = async ({ action, userId, parkId }: GetAndUpdateProps) => {
  try {
    const userFavoritesQuery = query(
      favoritesCollection,
      where('userId', '==', userId)
    );

    const querySnapshot = await getDocs(userFavoritesQuery);
    querySnapshot.forEach(async (doc) => {
      if (action === 'add') {
        await updateDoc(doc.ref, {
          favorites: arrayUnion(parkId),
        });
      } else {
        await updateDoc(doc.ref, {
          favorites: arrayRemove(parkId),
        });
      }
      return doc.id;
    });
  } catch (error) {
    console.error(
      `there was an error ${
        action === 'add' ? 'adding' : 'removing'
      } park ${parkId} to favorites: ${error}`
    );
    return null;
  }
};

const addFavorite = async ({ userId, parkId }: AddFavoriteProps) => {
  await getAndUpdate({ userId, parkId, action: 'add' });
};

const removeFavorite = async ({ userId, parkId }: RemoveFavoriteProps) => {
  await getAndUpdate({ userId, parkId, action: 'remove' });
};

const fetchUserFavorites = async (userId: string) => {
  try {
    const userFavoritesQuery = query(
      favoritesCollection,
      where('userId', '==', userId)
    );

    const querySnapshot = await getDocs(userFavoritesQuery);

    querySnapshot.forEach((doc) => {
      return {
        ...doc.data(),
        id: doc.id,
      } as Favorites;
    });
  } catch (error) {
    console.error(
      `there was an error fetching favorites for user ${userId}: ${error}`
    );
    return null;
  }
};

export { addFavorite, removeFavorite, fetchUserFavorites };

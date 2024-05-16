import {
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  arrayUnion,
  arrayRemove,
  doc,
  addDoc,
} from 'firebase/firestore';
import { db } from './firebase-config';
import { Favorites } from '../types/favorites';

interface ActionFavoriteProps {
  userId: string;
  parkId: string;
}

const favoritesCollection = collection(db, 'favorites');

const createFavorites = async ({ userId, parkId }: ActionFavoriteProps) => {
  try {
    await addDoc(favoritesCollection, {
      parkIds: [parkId],
      userId,
    });
  } catch (error) {
    console.error('there was an error reporting dogs count');
  }
};

const updateFavorites = async (favoritesId: string, parkId: string) => {
  try {
    const favoritesRef = doc(db, 'favorites', favoritesId);
    await updateDoc(favoritesRef, {
      parkIds: arrayUnion(parkId),
    });
  } catch (error) {
    console.error(
      `there was an error adding park ${parkId} to favorites:  ${error}`
    );
  }
};

const addFavorite = async ({ userId, parkId }: ActionFavoriteProps) => {
  const userFavoritesQuery = query(
    favoritesCollection,
    where('userId', '==', userId)
  );

  const querySnapshot = await getDocs(userFavoritesQuery);
  if (!querySnapshot.docs.length) {
    await createFavorites({ userId, parkId });
  } else {
    await updateFavorites(querySnapshot.docs[0].id, parkId);
  }
};

const removeFavorite = async ({ userId, parkId }: ActionFavoriteProps) => {
  try {
    const userFavoritesQuery = query(
      favoritesCollection,
      where('userId', '==', userId)
    );

    const querySnapshot = await getDocs(userFavoritesQuery);
    if (querySnapshot.docs.length) {
      const docRef = doc(db, 'favorites', querySnapshot.docs[0].id);
      await updateDoc(docRef, {
        parkIds: arrayRemove(parkId),
      });
    }
  } catch (error) {
    console.error(
      `there was an error removing park ${parkId} to favorites: ${error}`
    );
    return null;
  }
};

const fetchUserFavorites = async (userId: string) => {
  try {
    const userFavoritesQuery = query(
      favoritesCollection,
      where('userId', '==', userId)
    );

    const querySnapshot = await getDocs(userFavoritesQuery);
    const res: Favorites[] = [];

    querySnapshot.forEach((doc) => {
      res.push({
        ...doc.data(),
        id: doc.id,
      } as Favorites);
    });
    return res[0];
  } catch (error) {
    console.error(
      `there was an error fetching favorites for user ${userId}: ${error}`
    );
    return null;
  }
};

const fetchAllFavorites = async () => {
  try {
    const favorites = await getDocs(favoritesCollection);
    return favorites.docs.map((doc) => {
      return {
        ...doc.data(),
        id: doc.id,
      } as Favorites;
    });
  } catch (error) {
    console.error(`there was an error fetching favorites parks: ${error}`);
    return [];
  }
};

const fetchFavoriteParks = async () => {
  try {
    const favorites = await fetchAllFavorites();
    const parkList = favorites.map((favoriteReport) => favoriteReport.parkIds);

    const parksCounts: { [key: string]: number } = {};
    parkList.flat().forEach((park) => {
      parksCounts[park] = (parksCounts[park] || 0) + 1;
    });
    const maxParksCount = Math.max(...Object.values(parksCounts));
    const mostFrequentParks = Object.keys(parksCounts).filter(
      (parkId) => parksCounts[parkId] === maxParksCount
    );

    return mostFrequentParks;
  } catch (error) {
    console.error(`there was an error fetching favorite park: ${error}`);
    return [];
  }
};

export { addFavorite, removeFavorite, fetchUserFavorites, fetchFavoriteParks };

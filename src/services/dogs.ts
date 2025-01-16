import { db } from './firebase-config';
import {
  addDoc,
  collection,
  doc,
  documentId,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import { AppError, throwError } from './error';
import { Dog } from '../types/dog';
import { fetchImagesByDirectory, uploadImage } from './image';

const dogsCollection = collection(db, 'dogs');

type CreateDogProps = Omit<Dog, 'id'>;

interface EditDogProps {
  dogId: string;
  dogDetails: Partial<Dog>;
}

const dogOwnerCache = new Map<string, string>();

const createDog = async (createDogProps: CreateDogProps) => {
  try {
    const res = await addDoc(dogsCollection, {
      ...createDogProps,
    });
    return res.id;
  } catch (error) {
    throwError(error);
  }
};

const updateDog = async ({ dogId, dogDetails }: EditDogProps) => {
  try {
    const dogRef = doc(db, 'dogs', dogId);
    await updateDoc(dogRef, {
      ...dogDetails,
    });
  } catch (error) {
    throwError(error);
  }
};

const getDogOwnerId = async (dogId: string) => {
  if (dogOwnerCache.has(dogId)) {
    return dogOwnerCache.get(dogId);
  }

  const dogRef = doc(db, 'dogs', dogId);
  const dogSnap = await getDoc(dogRef);

  if (!dogSnap.exists()) {
    throw new AppError('dog does not exists', 404);
  }

  const ownerId = dogSnap.data().owner;
  dogOwnerCache.set(dogId, ownerId);
  return ownerId;
};

const fetchDogs = async (ids?: string[]) => {
  try {
    if (!ids || !ids.length) {
      const data = await getDocs(dogsCollection);
      const dogs = data.docs.map((doc) => {
        return {
          ...doc.data(),
          birthday: doc.data().birthday?.toDate(),
          id: doc.id,
        };
      }) as Dog[];
      return dogs;
    } else {
      const usersQuery = query(dogsCollection, where(documentId(), 'in', ids));
      const querySnapshot = await getDocs(usersQuery);
      const res: Dog[] = [];
      querySnapshot.forEach((doc) => {
        res.push({
          ...doc.data(),
          birthday: doc.data().birthday?.toDate(),
          id: doc.id,
        } as Dog);
      });
      return res;
    }
  } catch (error) {
    throwError(error);
  }
};

const fetchUserDogs = async (userId: string) => {
  try {
    const dogsQuery = query(dogsCollection, where('owner', '==', userId));
    const querySnapshot = await getDocs(dogsQuery);
    const res: Dog[] = [];
    querySnapshot.forEach((doc) => {
      res.push({
        ...doc.data(),
        birthday: doc.data().birthday?.toDate(),
        id: doc.id,
      } as Dog);
    });
    return res;
  } catch (error) {
    throwError(error);
  }
};

const fetchUsersDogs = async (userIds: string[]) => {
  try {
    const dogsQuery = query(dogsCollection, where('owner', 'in', userIds));
    const querySnapshot = await getDocs(dogsQuery);
    const res: Dog[] = [];
    querySnapshot.forEach((doc) => {
      res.push({
        ...doc.data(),
        birthday: doc.data().birthday?.toDate(),
        id: doc.id,
      } as Dog);
    });
    return res;
  } catch (error) {
    throwError(error);
  }
};

const uploadDogImage = async (image: File | string, dogId: string) => {
  try {
    const userId = await getDogOwnerId(dogId);
    const res = await uploadImage({
      image,
      path: `users/${userId}/dogs/${dogId}/other`,
    });
    return res;
  } catch (error) {
    throwError(error);
  }
};

const uploadDogPrimaryImage = async (image: File | string, dogId: string) => {
  try {
    const userId = await getDogOwnerId(dogId);
    const res = await uploadImage({
      image,
      path: `users/${userId}/dogs/${dogId}/primary`,
      name: 'primaryImage',
    });
    return res;
  } catch (error) {
    throwError(error);
  }
};

const fetchDogPrimaryImage = async (dogId: string) => {
  try {
    const userId = await getDogOwnerId(dogId);
    const res = await fetchImagesByDirectory(
      `users/${userId}/dogs/${dogId}/primary`
    );
    return res;
  } catch (error) {
    console.error(
      `there was a problem fetching primary image for dog ${dogId}: ${error}`
    );
    return null;
  }
};

const fetchAllDogImages = async (dogId: string) => {
  try {
    const userId = await getDogOwnerId(dogId);
    const res = await fetchImagesByDirectory(
      `users/${userId}/dogs/${dogId}/other`
    );
    return res;
  } catch (error) {
    throwError(error);
  }
};

export {
  fetchDogs,
  createDog,
  updateDog,
  fetchUserDogs,
  fetchUsersDogs,
  fetchDogPrimaryImage,
  fetchAllDogImages,
  uploadDogImage,
  uploadDogPrimaryImage,
};

export type { EditDogProps };

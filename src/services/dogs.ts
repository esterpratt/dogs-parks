import { db } from './firebase-config';
import {
  addDoc,
  collection,
  documentId,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import { throwError } from './error';
import { Dog } from '../types/dog';
import { fetchImagesByDirectory, uploadImage } from './image';

const dogsCollection = collection(db, 'dogs');

type CreateDogProps = Omit<Dog, 'id'>;

const createDog = async (createDogProps: CreateDogProps) => {
  try {
    await addDoc(dogsCollection, {
      ...createDogProps,
    });
  } catch (error) {
    throwError(error);
  }
};

const fetchDogs = async (ids: string[]) => {
  try {
    const usersQuery = query(dogsCollection, where(documentId(), 'in', ids));
    const querySnapshot = await getDocs(usersQuery);
    const res: Dog[] = [];
    querySnapshot.forEach((doc) => {
      res.push({ ...doc.data(), id: doc.id } as Dog);
    });
    return res;
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
      res.push({ ...doc.data(), id: doc.id } as Dog);
    });
    return res;
  } catch (error) {
    throwError(error);
  }
};

const uploadDogImage = async (image: File | string, dogId: string) => {
  try {
    const res = await uploadImage({ image, path: `dogs/${dogId}/other` });
    return res;
  } catch (error) {
    throwError(error);
  }
};

const fetchDogPrimaryImage = async (dogId: string) => {
  try {
    const res = await fetchImagesByDirectory(`dogs/${dogId}/primary`);
    return res;
  } catch (error) {
    throwError(error);
  }
};

const fetchAllDogsImages = async (dogId: string) => {
  try {
    const res = await fetchImagesByDirectory(`dogs/${dogId}/other`);
    return res;
  } catch (error) {
    throwError(error);
  }
};

export {
  fetchDogs,
  createDog,
  fetchUserDogs,
  fetchDogPrimaryImage,
  fetchAllDogsImages,
  uploadDogImage,
};

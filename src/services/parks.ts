import { db } from './firebase-config';
import { getDocs, collection, doc, getDoc } from 'firebase/firestore';
import { Park } from '../types/park';
import { fetchImagesByDirectory, uploadImage } from './image';
import { AppError, throwError } from './error';

const parksCollection = collection(db, 'parks');

const fetchParks = async () => {
  try {
    const data = await getDocs(parksCollection);
    const parks = data.docs.map((doc) => {
      return {
        ...doc.data(),
        id: doc.id,
        location: doc.data().location.toJSON(),
      };
    }) as Park[];

    return parks;
  } catch (error) {
    throwError(error);
  }
};

const fetchPark = async (parkId: string) => {
  try {
    const docRef = doc(db, 'parks', parkId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new AppError('No such park', 404);
    }

    const park = docSnap.data();
    return { ...park, location: park.location.toJSON(), id: docSnap.id };
  } catch (error) {
    throwError(error);
  }
};

const uploadParkImage = async (image: File | string, parkId: string) => {
  try {
    const res = await uploadImage({ image, path: `parks/${parkId}/other` });
    return res;
  } catch (error) {
    throwError(error);
  }
};

const fetchParkPrimaryImage = async (parkId: string) => {
  try {
    const res = await fetchImagesByDirectory(`parks/${parkId}/primary`);
    return res;
  } catch (error) {
    throwError(error);
  }
};

const fetchAllParkImages = async (parkId: string) => {
  try {
    const res = await fetchImagesByDirectory(`parks/${parkId}/other`);
    return res;
  } catch (error) {
    throwError(error);
  }
};

export {
  fetchPark,
  fetchParks,
  uploadParkImage,
  fetchParkPrimaryImage,
  fetchAllParkImages,
};

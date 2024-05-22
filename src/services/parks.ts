import { db } from './firebase-config';
import {
  getDocs,
  collection,
  doc,
  getDoc,
  addDoc,
  GeoPoint,
  updateDoc,
} from 'firebase/firestore';
import { Park } from '../types/park';
import { fetchImagesByDirectory, uploadImage } from './image';
import { AppError, throwError } from './error';

const parksCollection = collection(db, 'parks');
const suggestedParksCollection = collection(db, 'suggestedParks');

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
    return {
      ...park,
      location: park.location.toJSON(),
      id: docSnap.id,
    } as Park;
  } catch (error) {
    throwError(error);
  }
};

const createPark = async (
  parkDetails: Pick<Park, 'address' | 'city' | 'name' | 'location'> &
    Partial<Park>
) => {
  try {
    const res = await addDoc(suggestedParksCollection, {
      ...parkDetails,
      location: new GeoPoint(
        parkDetails.location.latitude,
        parkDetails.location.longitude
      ),
    });
    return res.id;
  } catch (error) {
    console.error(`there was an error while creating park: ${error}`);
    return null;
  }
};

const updatePark = async (parkId: string, parkDetails: Partial<Park>) => {
  try {
    const parkRef = doc(db, 'parks', parkId);
    if (parkDetails.location) {
      parkDetails.location = new GeoPoint(
        parkDetails.location.latitude,
        parkDetails.location.longitude
      );
    }

    await updateDoc(parkRef, {
      ...parkDetails,
    });
  } catch (error) {
    console.error(`there was an error while updating park ${parkId}: ${error}`);
    return null;
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

const uploadParkPrimaryImage = async (image: File | string, parkId: string) => {
  try {
    const res = await uploadImage({
      image,
      path: `parks/${parkId}/primary`,
      name: 'primaryImage',
    });
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
  uploadParkPrimaryImage,
  fetchParkPrimaryImage,
  fetchAllParkImages,
  createPark,
  updatePark,
};

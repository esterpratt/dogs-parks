import { db } from './firebase-config';
import { getDocs, collection, doc, getDoc } from 'firebase/firestore';
import { Park } from '../types/park';
import { json } from 'react-router';
import { fetchImagesByDirectory, uploadImage } from './image';

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
    console.error(`there was an error while fetching parks: ${error}`);
    throw error;
  }
};

const fetchPark = async (parkId: string) => {
  try {
    const docRef = doc(db, 'parks', parkId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw json('no data', {
        status: 404,
        statusText: 'No Such Park',
      });
    }

    const park = docSnap.data();
    return { ...park, location: park.location.toJSON(), id: docSnap.id };
  } catch (error) {
    console.error(`there was an error while fetching park ${parkId}: ${error}`);

    let status = 500;
    let message = 'We Hate Google';
    if (error instanceof Response) {
      status = error.status;
      message = error.statusText;
    }
    throw json({ message }, { status });
  }
};

const uploadParkImage = async (image: File | string, parkId: string) => {
  try {
    const res = await uploadImage({ image, path: `parks/${parkId}/other` });
    return res;
  } catch (error) {
    console.error(
      'there was a problem while trying to upload the image: ',
      error
    );
    throw error;
  }
};

const fetchParkPrimaryImage = async (parkId: string) => {
  try {
    const res = await fetchImagesByDirectory(`parks/${parkId}/primary`);
    return res;
  } catch (error) {
    console.error(
      `there was a problem while trying to fetch the primary image of park ${parkId}: ${error}`
    );
    throw error;
  }
};

const fetchAllParkImages = async (parkId: string) => {
  try {
    const res = await fetchImagesByDirectory(`parks/${parkId}/other`);
    return res;
  } catch (error) {
    console.error(
      `there was a problem while trying to fetch the images of park ${parkId}: ${error}`
    );
    throw error;
  }
};

export {
  fetchPark,
  fetchParks,
  uploadParkImage,
  fetchParkPrimaryImage,
  fetchAllParkImages,
};

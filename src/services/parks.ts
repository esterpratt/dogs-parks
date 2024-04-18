import { db } from '../firebase-config';
import { getDocs, collection, doc, getDoc } from 'firebase/firestore';
import { Park } from '../types/park';
import { json } from 'react-router';

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
    return { ...park, location: park.location.toJSON() };
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

export { fetchPark, fetchParks };

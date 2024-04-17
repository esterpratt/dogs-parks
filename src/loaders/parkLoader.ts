import { LoaderFunction, json } from 'react-router';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase-config';

const parkLoader: LoaderFunction = async ({ params }) => {
  const { id: parkId } = params;
  try {
    const docRef = doc(db, 'parkss', parkId!);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw json('No Such Park', { status: 404 });
    }
    const park = docSnap.data();

    return { ...park, location: park.location.toJSON() };
  } catch (error) {
    throw json('We Hate Google', { status: 500 });
  }
};

export { parkLoader };

import { LoaderFunction } from 'react-router';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase-config';

const parkLoader: LoaderFunction = async ({ params }) => {
  const { id: parkId } = params;
  const docRef = doc(db, 'parks', parkId!);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    console.log('No such document!');

    // TODO: throw error when I have error element on routes
    return null;
  }

  const park = docSnap.data();

  return { ...park, location: park.location.toJSON() };
};

export { parkLoader };

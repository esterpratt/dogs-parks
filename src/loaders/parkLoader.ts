import { LoaderFunction, json } from 'react-router';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase-config';

const parkLoader: LoaderFunction = async ({ params }) => {
  const { id: parkId } = params;
  try {
    const docRef = doc(db, 'parks', parkId!);
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
    console.error(error);
    let status = 500;
    let message = 'We Hate Google';
    if (error instanceof Response) {
      status = error.status;
      message = error.statusText;
    }
    throw json({ message }, { status });
  }
};

export { parkLoader };

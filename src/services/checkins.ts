import {
  doc,
  updateDoc,
  addDoc,
  serverTimestamp,
  collection,
} from 'firebase/firestore';
import { db } from './firebase-config';

interface CheckinProps {
  userId?: string | null;
  parkId: string;
}

const checkinsCollection = collection(db, 'checkins');

const checkin = async ({ userId = null, parkId }: CheckinProps) => {
  try {
    const res = await addDoc(checkinsCollection, {
      parkId,
      checkinTimestamp: serverTimestamp(),
      userId,
    });
    return res.id;
  } catch (error) {
    console.error(`there was an error while checking in: ${error}`);
    return null;
  }
};

const checkout = async (checkoutId: string) => {
  try {
    const checkinRef = doc(db, 'checkins', checkoutId);
    await updateDoc(checkinRef, {
      checkoutTimestamp: serverTimestamp(),
    });
  } catch (error) {
    console.error('there was an error while checking out: ', error);
  }
};

export { checkin, checkout };

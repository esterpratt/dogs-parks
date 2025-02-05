import {
  doc,
  updateDoc,
  addDoc,
  serverTimestamp,
  collection,
  query,
  and,
  where,
  getDocs,
} from 'firebase/firestore';
import { db } from './firebase-config';
import { Checkin } from '../types/checkin';

const allowedCheckinHours = 3;
const hoursInMiliSeconds = 1000 * 60 * 60 * allowedCheckinHours;

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
      checkoutTimestamp: null,
      userId,
    });
    return res.id;
  } catch (error) {
    console.error(`there was an error while checking in: ${error}`);
    return null;
  }
};

const checkout = async (checkinId: string) => {
  try {
    const checkinRef = doc(db, 'checkins', checkinId);
    await updateDoc(checkinRef, {
      checkoutTimestamp: serverTimestamp(),
    });
  } catch (error) {
    console.error('there was an error while checking out: ', error);
  }
};

const fetchAllDayParkCheckins = async (parkId: string) => {
  try {
    const parkCheckinsQuery = query(
      checkinsCollection,
      and(where('parkId', '==', parkId))
    );

    const querySnapshot = await getDocs(parkCheckinsQuery);
    const res: Checkin[] = [];
    querySnapshot.forEach((doc) => {
      res.push({
        ...doc.data(),
        checkinTimestamp: doc.data().checkinTimestamp.toDate(),
        checkoutTimestamp: doc.data().checkoutTimestamp.toDate(),
        id: doc.id,
      } as Checkin);
    });
    return res;
  } catch (error) {
    console.error(
      `there was an error while fetching all day checkins for park ${parkId}: ${error}`
    );
    return null;
  }
};

const fetchParkCheckins = async (parkId: string) => {
  try {
    const parkCheckinsQuery = query(
      checkinsCollection,
      and(
        where('parkId', '==', parkId),
        where('checkoutTimestamp', '==', null),
        where(
          'checkinTimestamp',
          '>',
          new Date(Date.now() - hoursInMiliSeconds)
        )
      )
    );

    const querySnapshot = await getDocs(parkCheckinsQuery);
    const res: Checkin[] = [];
    querySnapshot.forEach((doc) => {
      res.push({
        ...doc.data(),
        checkinTimestamp: doc.data().checkinTimestamp.toDate(),
        id: doc.id,
      } as Checkin);
    });
    return res;
  } catch (error) {
    console.error(
      `there was an error while fetching checkins for park ${parkId}: ${error}`
    );
    return null;
  }
};

export { checkin, checkout, fetchParkCheckins, fetchAllDayParkCheckins };

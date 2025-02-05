import {
  Query,
  addDoc,
  collection,
  getDocs,
  query,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import { db } from './firebase-config';
import { DogsCountReport } from '../types/dogsCount';

interface ReportParkDogsCountProps {
  parkId: string;
  dogsCount: number;
  userId?: string | null;
}

const dogsCountReportsCollection = collection(db, 'dogsCountReports');

const reportDogsCount = async ({
  parkId,
  dogsCount,
}: ReportParkDogsCountProps) => {
  try {
    await addDoc(dogsCountReportsCollection, {
      parkId,
      dogsCount,
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    console.error('there was an error reporting dogs count');
  }
};

const fetchDogsCountByReports = async (parkId: string) => {
  const dogsCountQuery: Query = query(
    dogsCountReportsCollection,
    where('parkId', '==', parkId)
  );

  const querySnapshot = await getDocs(dogsCountQuery);
  const res: DogsCountReport[] = [];
  querySnapshot.forEach((doc) => {
    res.push({
      ...doc.data(),
      timestamp: doc.data().timestamp.toDate(),
      id: doc.id,
    } as DogsCountReport);
  });
  return res;
};

export { reportDogsCount, fetchDogsCountByReports };

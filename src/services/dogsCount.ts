import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase-config';

interface ReportParkDogsCountProps {
  parkId: string;
  dogsCount: number;
  userId?: string | null;
}

const dogsCountReportsCollection = collection(db, 'dogsCountReports');

const reportDogsCount = async ({
  parkId,
  dogsCount,
  userId = null,
}: ReportParkDogsCountProps) => {
  try {
    await addDoc(dogsCountReportsCollection, {
      parkId,
      dogsCount,
      timestamp: serverTimestamp(),
      userId,
    });
  } catch (error) {
    console.error('there was an error reporting the dogs count');
  }
};

export { reportDogsCount };

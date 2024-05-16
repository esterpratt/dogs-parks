import { db } from './firebase-config';
import { addDoc, collection } from 'firebase/firestore';

const reportsCollection = collection(db, 'reports');

interface CreateReportProps {
  userId: string;
  parkId: string;
  text: string;
}

const createReport = async ({ userId, parkId, text }: CreateReportProps) => {
  try {
    const res = await addDoc(reportsCollection, {
      userId,
      parkId,
      text,
    });
    return res.id;
  } catch (error) {
    console.error(
      `there was an error while sending report for park ${parkId} by user ${userId}: ${error}`
    );
    return null;
  }
};

export { createReport };

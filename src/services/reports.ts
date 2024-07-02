import { MAIL } from '../utils/constants';
import { db } from './firebase-config';
import { addDoc, collection } from 'firebase/firestore';

const reportsCollection = collection(db, 'reports');

interface CreateReportProps {
  userId: string;
  parkId: string;
  text: string;
}

const createReport = async ({
  userId,
  parkId,
  text: reportBody,
}: CreateReportProps) => {
  try {
    const res = await addDoc(reportsCollection, {
      to: [MAIL],
      message: {
        subject: 'A report regarding a park was created',
        text: `${JSON.stringify({
          userId,
          parkId,
          reportBody,
        })}`,
      },
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

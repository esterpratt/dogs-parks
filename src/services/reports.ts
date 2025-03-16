import { Park } from '../types/park';
import { db } from './firebase-config';
import { GeoPoint, addDoc, collection } from 'firebase/firestore';

const reportsCollection = collection(db, 'reports');

const MAIL = 'esterpratt@gmail.com';

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
      `there was an error while sending report for park ${parkId} by user ${userId}: ${JSON.stringify(error)}`
    );
    return null;
  }
};

const createPark = async (
  parkDetails: Pick<Park, 'address' | 'city' | 'name' | 'location'> &
    Partial<Park>
) => {
  try {
    const res = await addDoc(reportsCollection, {
      to: [MAIL],
      message: {
        subject: 'A new park was suggested',
        text: `The park details are: ${JSON.stringify({
          ...parkDetails,
          location: new GeoPoint(
            parkDetails.location.lat,
            parkDetails.location.long
          ),
        })}`,
      },
    });
    return res.id;
  } catch (error) {
    console.error(`there was an error while creating park: ${JSON.stringify(error)}`);
    return null;
  }
};

export { createReport, createPark, MAIL };

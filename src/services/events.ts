import { getAnalytics, logEvent } from 'firebase/analytics';
import { NewParkDetails } from '../types/park';

const analytics = getAnalytics();

const addParkEvent = (parkDetails: NewParkDetails) => {
  logEvent(analytics, 'add_park', { ...parkDetails });
};

const errorEvent = (error: unknown) => {
  logEvent(analytics, 'error', { error });
};

export { addParkEvent, errorEvent };

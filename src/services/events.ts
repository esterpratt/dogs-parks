import { getAnalytics, logEvent } from 'firebase/analytics';
import { Park } from '../types/park';

const analytics = getAnalytics();

const addParkEvent = (parkDetails: Park) => {
  logEvent(analytics, 'add_park', { ...parkDetails });
};

export { addParkEvent };

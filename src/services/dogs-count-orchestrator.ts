import { Checkin } from '../types/checkin';
import { DogsCountReport } from '../types/dogsCount';
import { fetchAllDayParkCheckins } from './checkins';
import { fetchDogsCountByReports } from './dogs-count';

const processReportsToDogsCount = (reports: DogsCountReport[]) => {
  reports.map((report) => {
    const hour = report.timestamp.getHours();
    const fullDate = `${report.timestamp.getDate()}, ${report.timestamp.getMonth()}, ${report.timestamp.getFullYear()}`;

    return {
      count: report.dogsCount,
      hour,
      fullDate,
    };
  });
};

const processCheckinsToDogsCount = (checkins: Checkin[]) => {
  const dogsPerHour: { [key: string]: number } = {};

  checkins.forEach(({ checkinTimestamp, checkoutTimestamp }) => {
    const checkin = new Date(checkinTimestamp);
    const checkout = checkoutTimestamp
      ? new Date(checkoutTimestamp)
      : new Date();

    for (let hour = checkin.getHours(); hour <= checkout.getHours(); hour++) {
      const fullDate = `${checkin.getDate()}, ${checkin.getMonth()}, ${checkin.getFullYear()}`;
      const key = `${hour}_${fullDate}`;

      if (!dogsPerHour[key]) {
        dogsPerHour[key] = 1;
      } else {
        dogsPerHour[key]++;
      }
    }
  });

  return Object.entries(dogsPerHour).map(([key, count]) => {
    const [hour, fullDate] = key.split('_');
    return { count, hour: Number(hour), fullDate };
  });
};

const fetchDogsCount = async (parkId: string) => {
  try {
    const dogsCountByReports = await fetchDogsCountByReports(parkId);
    if (dogsCountByReports.length) {
      const dogsCount = processReportsToDogsCount(dogsCountByReports);
      return dogsCount;
    }

    const parkCheckins = await fetchAllDayParkCheckins(parkId);
    if (!parkCheckins) {
      return [];
    }

    const dogsCountByCheckins = processCheckinsToDogsCount(parkCheckins);
    return dogsCountByCheckins;
  } catch (error) {
    console.error(
      `there was a problem fetching dogs count of park ${parkId}: ${error}`
    );
  }
};

export { fetchDogsCount };

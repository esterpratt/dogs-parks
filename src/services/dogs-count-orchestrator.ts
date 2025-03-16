import { Checkin } from '../types/checkin';
import { DogsCountReport } from '../types/dogsCount';
import { fetchAllDayParkCheckins } from './checkins';
import { fetchDogsCountByReports } from './dogs-count';

const processReportsToDogsCount = (reports: DogsCountReport[]) => {
  return reports.map((report) => {
    const date = new Date(report.timestamp);

    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Jerusalem",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      hour12: false,
    }).formatToParts(date);

    const year = parts.find(p => p.type === "year")!.value;
    const month = parts.find(p => p.type === "month")!.value;
    const day = parts.find(p => p.type === "day")!.value;
    const hour = Number(parts.find(p => p.type === "hour")!.value);

    return {
      count: report.count,
      hour,
      fullDate: `${day}, ${month}, ${year}`,
    };
  });
};

const processCheckinsToDogsCount = (checkins: Checkin[]) => {
  const dogsPerHour: { [key: string]: number } = {};

  checkins.forEach(({ checkin_timestamp, checkout_timestamp }) => {
    const checkin = new Date(checkin_timestamp);
    const checkout = checkout_timestamp
      ? new Date(checkout_timestamp)
      : new Date();

    const startParts = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Jerusalem",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      hour12: false,
    }).formatToParts(checkin);

    const year = startParts.find(p => p.type === "year")!.value;
    const month = startParts.find(p => p.type === "month")!.value;
    const day = startParts.find(p => p.type === "day")!.value;
    const startHour = Number(startParts.find(p => p.type === "hour")!.value);
    const endHour = Number(new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Jerusalem",
      hour: "2-digit",
      hour12: false,
    }).format(checkout));

    for (let hour = startHour; hour <= endHour; hour++) {
      const fullDate = `${day}, ${month}, ${year}`;
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
      `there was a problem fetching dogs count of park ${parkId}: ${JSON.stringify(error)}`
    );
  }
};

export { fetchDogsCount };

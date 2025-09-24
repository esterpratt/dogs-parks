import { getMean, getSTD } from '../../utils/calcs';
import barChartStyles from '../charts/BarChart.module.scss';
import { getHoursChartData, getStrHour } from '../charts/getHoursChartData';

enum BusinessLevel {
  LIGHT = 'LIGHT',
  MEDIUM = 'MEDIUM',
  BUSY = 'BUSY',
}

export const BUSINESS: Record<
  BusinessLevel,
  { key: string; className: string; color: string }
> = {
  [BusinessLevel.LIGHT]: {
    key: 'parks.busyHours.status.quiet',
    className: 'light',
    color: barChartStyles.green,
  },
  [BusinessLevel.MEDIUM]: {
    key: 'parks.busyHours.status.medium',
    className: 'medium',
    color: barChartStyles.orange,
  },
  [BusinessLevel.BUSY]: {
    key: 'parks.busyHours.status.busy',
    className: 'busy',
    color: barChartStyles.red,
  },
};

const WEEKEND_DAYS = ['Fri', 'Sat'];

interface DogsCount {
  count: number;
  hour: number;
  weekday: string;
  fullDate: string;
}

const getBusyHoursData = (dogsCount: DogsCount[]) => {
  let weekdaysHoursChartData;
  let weekendHoursChartData;
  let fullData;
  let isWeekend = false;
  let level: BusinessLevel = BusinessLevel.LIGHT;

  const currentDate = new Date();
  const currentHour = currentDate.getHours();
  const currentDay = currentDate.getDay();
  const currentStrHour = getStrHour(currentHour);
  isWeekend = currentDay === 5 || currentDay === 6;
  const weekendData = dogsCount.filter((item) =>
    WEEKEND_DAYS.includes(item.weekday)
  );
  const weekdaysData = dogsCount.filter(
    (item) => !WEEKEND_DAYS.includes(item.weekday)
  );

  const shouldSplitData = weekdaysData.length && weekendData.length;
  let currentCount;
  let mean;
  let std;

  if (!shouldSplitData) {
    fullData = getHoursChartData(dogsCount);
    const counts = fullData.map((item) => item.count);
    mean = getMean(counts);
    std = getSTD(counts, mean);
    currentCount = fullData[currentHour].count;
  } else {
    weekdaysHoursChartData = getHoursChartData(weekdaysData);
    weekendHoursChartData = getHoursChartData(weekendData);

    const counts = isWeekend
      ? weekendHoursChartData.map((item) => item.count)
      : weekdaysHoursChartData.map((item) => item.count);
    mean = getMean(counts);
    std = getSTD(counts, mean);
    currentCount = isWeekend
      ? weekendHoursChartData[currentHour].count
      : weekdaysHoursChartData[currentHour].count;
  }

  if (currentCount > 15) {
    level = BusinessLevel.BUSY;
  } else if (currentCount > 3 && currentCount > mean + std * 0.5) {
    level = BusinessLevel.BUSY;
  } else if (currentCount > 2 && currentCount > mean - std * 0.5) {
    level = BusinessLevel.MEDIUM;
  }

  return {
    currentStrHour,
    level,
    business: BUSINESS[level],
    isWeekend,
    fullData,
    weekdaysHoursChartData,
    weekendHoursChartData,
  };
};

export { getBusyHoursData };

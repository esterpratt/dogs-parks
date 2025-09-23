import { getMean, getSTD } from '../../utils/calcs';
import barChartStyles from '../charts/BarChart.module.scss';
import { getHoursChartData, getStrHour } from '../charts/getHoursChartData';
import i18next from 'i18next';

export const BUSINESS = {
  LIGHT: {
    get str() {
      return i18next.t('parks.busyHours.status.quiet');
    },
    className: 'light',
    color: barChartStyles.green,
  },
  MEDIUM: {
    get str() {
      return i18next.t('parks.busyHours.status.medium');
    },
    className: 'medium',
    color: barChartStyles.orange,
  },
  BUSY: {
    get str() {
      return i18next.t('parks.busyHours.status.busy');
    },
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
  let business = BUSINESS.LIGHT;

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
    business = BUSINESS.BUSY;
  } else if (currentCount > 3 && currentCount > mean + std * 0.5) {
    business = BUSINESS.BUSY;
  } else if (currentCount > 2 && currentCount > mean - std * 0.5) {
    business = BUSINESS.MEDIUM;
  }

  return {
    currentStrHour,
    business,
    isWeekend,
    fullData,
    weekdaysHoursChartData,
    weekendHoursChartData,
  };
};

export { getBusyHoursData };

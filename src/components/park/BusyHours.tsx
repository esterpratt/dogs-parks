import { useEffect, useState } from 'react';
import { getHoursChartData, getStrHour } from '../charts/getHoursChartData';
import { fetchDogsCount } from '../../services/dogsCount';
import { getMean, getSTD } from '../../utils/calcs';
import { BarChart } from '../charts/BarChart';
import styles from './BusyHours.module.scss';
import barChartStyles from '../charts/BarChart.module.scss';

const BUSINESS = {
  LIGHT: {
    str: 'quite',
    className: 'light',
    color: barChartStyles.green,
  },
  MEDIUM: {
    str: 'not so busy',
    className: 'medium',
    color: barChartStyles.orange,
  },
  BUSY: {
    str: 'busy',
    className: 'busy',
    color: barChartStyles.red,
  },
};

interface BusyHoursProps {
  parkId: string;
}

const BusyHours: React.FC<BusyHoursProps> = ({ parkId }) => {
  const [dogsCount, setDogsCount] = useState<
    | {
        count: number;
        hour: number;
        fullDate: string;
      }[]
    | null
  >(null);

  useEffect(() => {
    const getDogsCount = async () => {
      const dogsCountReports = await fetchDogsCount(parkId);
      if (dogsCountReports) {
        const dogsCount = dogsCountReports?.map((report) => {
          const hour = report.timestamp.getHours();
          const fullDate = `${report.timestamp.getDate()}, ${report.timestamp.getMonth()}, ${report.timestamp.getFullYear()}`;

          return {
            count: report.dogsCount,
            hour,
            fullDate,
          };
        });

        setDogsCount(dogsCount);
      }
    };
    getDogsCount();
  }, [parkId]);

  if (!dogsCount) {
    return null;
  }

  const currentHour = new Date().getHours();
  const currentStrHour = getStrHour(currentHour);
  const hoursChartData = getHoursChartData(dogsCount);
  const counts = hoursChartData.map((item) => item.count);
  const mean = getMean(counts);
  const std = getSTD(counts, mean);
  const currentCount = hoursChartData[currentHour].count;

  let business = BUSINESS.LIGHT;
  if (currentCount > 3 && currentCount > mean + std * 0.5) {
    business = BUSINESS.BUSY;
  } else if (currentCount > 2 && currentCount > mean - std * 0.5) {
    business = BUSINESS.MEDIUM;
  }

  return (
    <div>
      <span className={styles.text}>
        At this hour, the park is usually{' '}
        <span className={styles[business.className]}>{business.str}</span>
      </span>
      <div className={styles.chartContainer}>
        <BarChart
          data={hoursChartData}
          xDataKey="hour"
          yDataKey="count"
          currentHour={{ hour: currentStrHour, color: business.color }}
        />
      </div>
    </div>
  );
};

export { BusyHours };

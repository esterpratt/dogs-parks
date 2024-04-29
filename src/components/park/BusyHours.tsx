import { useEffect, useState } from 'react';
import {
  getHoursChartData,
  getSlicedHoursChartData,
  getStrHour,
} from '../charts/getHoursChartData';
import { fetchDogsCount } from '../../services/dogsCount';
import { Park } from '../../types/park';
import { AreaChart } from '../charts/AreaChart';
import styles from './BusyHours.module.scss';
import { getSTD } from '../../utils/calcs';

const BUSINESS = {
  LIGHT: {
    str: 'quite',
    className: 'light',
  },
  MEDIUM: {
    str: 'not so busy',
    className: 'medium',
  },
  BUSY: {
    str: 'busy',
    className: 'busy',
  },
};

interface BusyHoursProps {
  parkId: Park['id'];
}

const BusyHours: React.FC<BusyHoursProps> = ({ parkId }) => {
  const [dogsCount, setDogsCount] = useState<
    | {
        count: number;
        hour: number;
      }[]
    | null
  >(null);

  useEffect(() => {
    const getDogsCount = async () => {
      const dogsCountReports = await fetchDogsCount(parkId);
      if (dogsCountReports) {
        const dogsCountByHour = dogsCountReports?.map((report) => {
          return {
            count: report.dogsCount,
            hour: report.timestamp.getHours(),
          };
        });
        setDogsCount(dogsCountByHour);
      }
    };
    getDogsCount();
  }, [parkId]);

  if (!dogsCount) {
    return null;
  }

  const currentHour = new Date().getHours();
  const currentStrHour = getStrHour(currentHour);
  const std = getSTD(dogsCount.map((item) => item.count));
  const hoursChartData = getHoursChartData({
    data: dogsCount,
  });
  const currentCount = hoursChartData[currentHour].count;
  const slicedHoursChartData = getSlicedHoursChartData({
    data: hoursChartData,
    hourToSliceBy: currentHour,
  });

  let business = BUSINESS.MEDIUM;
  if (currentCount > std * 1.2) {
    business = BUSINESS.BUSY;
  } else if (currentCount < std * 0.8) {
    business = BUSINESS.LIGHT;
  }

  return (
    <div>
      <span>
        In this hour, the park is usually{' '}
        <span className={styles[business.className]}>{business.str}</span>
      </span>
      <div className={styles.chartContainer}>
        <AreaChart
          data={slicedHoursChartData}
          xDataKey="hour"
          yDataKey="count"
          referecnceLineData={currentStrHour}
        />
      </div>
    </div>
  );
};

export { BusyHours };

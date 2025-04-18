import { useContext, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getHoursChartData, getStrHour } from '../charts/getHoursChartData';
import { fetchDogsCount } from '../../services/dogs-count-orchestrator';
import { getMean, getSTD } from '../../utils/calcs';
import { BarChart } from '../charts/BarChart';
import styles from './BusyHours.module.scss';
import barChartStyles from '../charts/BarChart.module.scss';
import { DogsCountModal } from './DogsCountModal';
import { Button } from '../Button';
import { UserContext } from '../../context/UserContext';
import { Link } from 'react-router';

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
  const [isDogsCountModalOpen, setIsDogsCountModalOpen] = useState(false);
  const { userId } = useContext(UserContext);

  const { data: dogsCount } = useQuery({
    queryKey: ['dogsCount', parkId],
    queryFn: () => fetchDogsCount(parkId),
  });

  let currentStrHour;
  let hoursChartData;
  let business = BUSINESS.LIGHT;

  if (dogsCount) {
    const currentHour = new Date().getHours();
    currentStrHour = getStrHour(currentHour);
    hoursChartData = getHoursChartData(dogsCount);
    const counts = hoursChartData.map((item) => item.count);
    const mean = getMean(counts);
    const std = getSTD(counts, mean);
    const currentCount = hoursChartData[currentHour].count;

    if (currentCount > 3 && currentCount > mean + std * 0.5) {
      business = BUSINESS.BUSY;
    } else if (currentCount > 2 && currentCount > mean - std * 0.5) {
      business = BUSINESS.MEDIUM;
    }
  }

  return (
    <>
      {dogsCount?.length ? (
        <div>
          <div className={styles.text}>
            Around this time, the park is usually{' '}
            <span className={styles[business.className]}>{business.str}.</span>
            {userId && (
              <Button
                onClick={() => setIsDogsCountModalOpen(true)}
                className={styles.dogsCountButton}
                variant="simple"
              >
                Report dog count
              </Button>
            )}
          </div>
          <div className={styles.chartContainer}>
            <BarChart
              data={hoursChartData}
              xDataKey="hour"
              yDataKey="count"
              currentHour={{ hour: currentStrHour!, color: business.color }}
            />
          </div>
        </div>
      ) : (
        <>
          <div className={styles.noData}>
            <span>No data yet.</span>
            {userId ? (
              <Button
                onClick={() => setIsDogsCountModalOpen(true)}
                className={styles.dogsCountButton}
                variant="simple"
              >
                Report dog count
              </Button>
            ) : (
              <span>
                <Link to="/signin"> Sign In</Link> to add data.
              </span>
            )}
          </div>
        </>
      )}
      <DogsCountModal
        showOnlyCount
        parkId={parkId}
        isOpen={isDogsCountModalOpen}
        onClose={() => setIsDogsCountModalOpen(false)}
      />
    </>
  );
};

export { BusyHours };

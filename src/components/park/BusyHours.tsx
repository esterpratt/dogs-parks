import { useContext, useState } from 'react';
import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { Info, Plus } from 'lucide-react';
import classnames from 'classnames';
import { getHoursChartData, getStrHour } from '../charts/getHoursChartData';
import { fetchDogsCount } from '../../services/dogs-count-orchestrator';
import { getMean, getSTD } from '../../utils/calcs';
import { BarChart } from '../charts/BarChart';
import barChartStyles from '../charts/BarChart.module.scss';
import { DogsCountModal } from './DogsCountModal';
import { Button } from '../Button';
import { UserContext } from '../../context/UserContext';
import { Section } from '../section/Section';
import styles from './BusyHours.module.scss';

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
      <Section
        titleCmp={
          <div className={styles.title}>
            <span>Busy hours</span>
            {!!userId && (
              <Button
                variant="simple"
                color={styles.white}
                className={styles.button}
                onClick={() => setIsDogsCountModalOpen(true)}
              >
                <Plus size={24} />
              </Button>
            )}
          </div>
        }
        contentCmp={
          <div className={styles.container}>
            <div
              className={classnames(styles.textContainer, {
                [styles.empty]: !userId && !dogsCount?.length,
              })}
            >
              <div
                className={classnames(styles.text, {
                  [styles.empty]: !userId && !dogsCount?.length,
                })}
              >
                <Info size={12} color={styles.green} />
                {dogsCount?.length ? (
                  <>
                    <span>Currently:</span>
                    <span className={styles[business.className]}>
                      {business.str}
                    </span>
                  </>
                ) : (
                  <span>No data yet.</span>
                )}
              </div>
              {!userId && !dogsCount?.length && (
                <div>
                  <Button variant="simple" className={styles.link}>
                    <Link to="/login">Log In</Link>
                  </Button>
                  <span> to add data.</span>
                </div>
              )}
            </div>
            {!!dogsCount?.length && (
              <div className={styles.chartContainer}>
                <BarChart
                  data={hoursChartData}
                  xDataKey="hour"
                  yDataKey="count"
                  currentHour={{ hour: currentStrHour!, color: business.color }}
                />
              </div>
            )}
          </div>
        }
      />
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

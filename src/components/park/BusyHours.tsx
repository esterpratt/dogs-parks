import { useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Info, Plus } from 'lucide-react';
import classnames from 'classnames';
import { fetchDogsCount } from '../../services/dogs-count-orchestrator';
import { DogsCountModal } from './DogsCountModal';
import { Button } from '../Button';
import { UserContext } from '../../context/UserContext';
import { Section } from '../section/Section';
import { BusyHoursChart } from '../charts/BusyHoursChart';
import styles from './BusyHours.module.scss';
import { getBusyHoursData } from './getBusyHoursData';

interface BusyHoursProps {
  parkId: string;
}

const BusyHours: React.FC<BusyHoursProps> = (props: BusyHoursProps) => {
  const { parkId } = props;
  const [isDogsCountModalOpen, setIsDogsCountModalOpen] = useState(false);
  const { userId } = useContext(UserContext);

  const { data: dogsCount, isLoading } = useQuery({
    queryKey: ['dogsCount', parkId],
    queryFn: () => fetchDogsCount(parkId),
  });

  const {
    currentStrHour,
    fullData,
    business,
    weekdaysHoursChartData,
    weekendHoursChartData,
    isWeekend,
  } = dogsCount?.length ? getBusyHoursData(dogsCount) : {};

  const handleClickReportDogCount = () => {
    setIsDogsCountModalOpen(true);
  };

  return (
    <>
      <Section
        title="Busy hours"
        actions={
          userId ? (
            <Button
              variant="simple"
              color={styles.white}
              className={styles.button}
              onClick={handleClickReportDogCount}
            >
              <Plus size={24} />
            </Button>
          ) : undefined
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
                {isLoading && <span>Calculating...</span>}
                {!isLoading && (
                  <>
                    <Info size={12} color={styles.green} />
                    {dogsCount?.length ? (
                      <>
                        <span>Currently:</span>
                        <span className={styles[business!.className]}>
                          {business!.str}
                        </span>
                      </>
                    ) : (
                      <span>No data yet.</span>
                    )}
                  </>
                )}
              </div>
              {!userId && !dogsCount?.length && (
                <div>
                  <Button variant="simple" className={styles.link}>
                    <Link to="/login?mode=login">Log In</Link>
                  </Button>
                  <span> to add data.</span>
                </div>
              )}
            </div>
            {!!dogsCount?.length && (
              <BusyHoursChart
                fullData={fullData}
                weekendData={weekendHoursChartData}
                weekdaysData={weekdaysHoursChartData}
                currHour={currentStrHour!}
                isWeekend={isWeekend!}
                business={business!}
              />
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

export default BusyHours;

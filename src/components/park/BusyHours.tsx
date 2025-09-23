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
import { useTranslation } from 'react-i18next';

interface BusyHoursProps {
  parkId: string;
}

const BusyHours: React.FC<BusyHoursProps> = (props: BusyHoursProps) => {
  const { parkId } = props;
  const [isDogsCountModalOpen, setIsDogsCountModalOpen] = useState(false);
  const { userId } = useContext(UserContext);
  const { t } = useTranslation();

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
        title={t('parks.sections.busyHours')}
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
                {isLoading && <span>{t('common.status.calculating')}</span>}
                {!isLoading && (
                  <>
                    <Info size={12} color={styles.green} />
                    {dogsCount?.length ? (
                      <>
                        <span>{t('common.status.currently')}</span>
                        <span className={styles[business!.className]}>
                          {business!.str}
                        </span>
                      </>
                    ) : (
                      <span>{t('common.status.noData')}</span>
                    )}
                  </>
                )}
              </div>
              {!userId && !dogsCount?.length && (
                <div>
                  <Button variant="simple" className={styles.link}>
                    <Link to="/login?mode=login">
                      {t('common.actions.login')}
                    </Link>
                  </Button>
                  <span> {t('parks.busyHours.toAddDataSuffix')}</span>
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

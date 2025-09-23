import { Link } from 'react-router-dom';
import { useContext, useState } from 'react';
import classnames from 'classnames';
import { Wrench } from 'lucide-react';
import { ParkCondition, ActiveParkCondition } from '../../types/parkCondition';
import { useGetParkVisitors } from '../../hooks/api/useGetParkVisitors';
import { Section } from '../section/Section';
import { Button } from '../Button';
import { UserContext } from '../../context/UserContext';
import { useQuery } from '@tanstack/react-query';
import { fetchUsersWithDogsByIds } from '../../services/users';
import styles from './ParkLive.module.scss';
import { ReportConditionModal } from './ReportConditionModal';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { useGetActiveParkConditions } from '../../hooks/api/useGetActiveParkConditions';
import { ParkConditionsList } from './ParkConditionsList';
import { PARK_CONDITIONS } from '../../utils/parkConditions';
import { useTranslation } from 'react-i18next';

interface ParkGeneralsProps {
  id: string;
}

const ParkLive = (props: ParkGeneralsProps) => {
  const { id: parkId } = props;
  const { t } = useTranslation();
  const { userId } = useContext(UserContext);
  const { friendsInParkIds, visitorsIds } = useGetParkVisitors(parkId, userId);
  const [isReportConditionModalOpen, setIsReportConditionModalOpen] =
    useState(false);
  const [hideReportHint, setHideReportHint] = useLocalStorage('hideReportHint');

  const { data: activeConditions = [] } = useGetActiveParkConditions(parkId);

  const friendsCount = friendsInParkIds.length;
  const othersCount = visitorsIds.length - friendsCount;

  const visitorsContent = friendsCount
    ? friendsCount.toString()
    : othersCount.toString();

  const isParkClosed = activeConditions.some(
    (activeCondition: ActiveParkCondition) =>
      activeCondition.condition === ParkCondition.GATE_CLOSED ||
      activeCondition.condition === ParkCondition.UNDER_CONSTRUCTION
  );

  const canReportCondition =
    !isParkClosed && activeConditions.length < PARK_CONDITIONS.length;

  // prefetch visitors data
  useQuery({
    queryKey: ['parkVisitorsWithDogs', parkId],
    queryFn: () => fetchUsersWithDogsByIds(friendsInParkIds),
    enabled: !!friendsInParkIds.length && !isParkClosed,
    staleTime: 6000,
  });

  const handleClickReport = () => {
    setIsReportConditionModalOpen(true);
    setHideReportHint(true);
  };

  return (
    <>
      <Section
        title={t('parks.sections.liveStatus')}
        titleTestId="live-status-heading"
        actions={
          !!userId &&
          canReportCondition && (
            <Button
              variant="simple"
              color={styles.white}
              className={styles.button}
              onClick={handleClickReport}
              data-test="report-button"
            >
              {!hideReportHint && <span>{t('parks.live.report')}</span>}
              <Wrench size={18} />
            </Button>
          )
        }
        contentCmp={
          <div className={styles.container}>
            {!!activeConditions && (
              <ParkConditionsList conditions={activeConditions} />
            )}
            {!isParkClosed && (
              <div className={styles.visitors}>
                <Button
                  disabled={!friendsCount && !othersCount}
                  className={styles.visitorsButton}
                >
                  <Link
                    to="visitors"
                    className={classnames(styles.link, {
                      [styles.disabled]: !friendsCount && !othersCount,
                    })}
                  >
                    {visitorsContent}
                  </Link>
                </Button>
                <div className={styles.textContainer}>
                  <div>
                    {friendsCount
                      ? t('parks.live.friends')
                      : t('parks.live.visitors')}
                  </div>
                  <div>{t('parks.live.atTheParkRightNow')}</div>
                </div>
              </div>
            )}
          </div>
        }
      />
      {canReportCondition && (
        <ReportConditionModal
          parkId={parkId}
          isOpen={isReportConditionModalOpen}
          onClose={() => setIsReportConditionModalOpen(false)}
          activeConditions={activeConditions}
        />
      )}
    </>
  );
};

export { ParkLive };

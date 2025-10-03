import { Outlet } from 'react-router-dom';
import { ParkHeader } from '../components/park/ParkHeader';
import { ParkTabs } from '../components/park/ParkTabs';
import { memo } from 'react';
import { Park } from '../types/park';
import { usePrefetchRoutesOnIdle } from '../hooks/usePrefetchRoutesOnIdle';
import { useAppLocale } from '../hooks/useAppLocale';
import { useParkWithTranslation } from '../hooks/api/useParkWithTranslation';
import styles from './ParkResolved.module.scss';

interface ParkResolvedProps {
  park: Park;
}

const ParkResolved = memo((props: ParkResolvedProps) => {
  const { park } = props;

  const language = useAppLocale();
  const { park: translatedPark } = useParkWithTranslation({
    parkId: park.id,
    language,
  });

  const effectivePark = translatedPark || park;

  // prefetch park reviews + visitors pages
  usePrefetchRoutesOnIdle(['parkReviews', 'parkVisitors']);

  return (
    <>
      <ParkHeader park={effectivePark} />
      <div className={styles.contentContainer}>
        <ParkTabs parkId={effectivePark.id} />
        <div className={styles.outletContainer}>
          <Outlet context={effectivePark} />
        </div>
      </div>
    </>
  );
});

export { ParkResolved };

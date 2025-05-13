import { Outlet } from 'react-router-dom';
import { ParkHeader } from '../components/park/ParkHeader';
import { ParkTabs } from '../components/park/ParkTabs';
import { memo } from 'react';
import styles from './ParkResolved.module.scss';
import { Park } from '../types/park';
import { usePrefetchRoutesOnIdle } from '../hooks/usePrefetchRoutesOnIdle';

interface ParkResolvedProps {
  park: Park;
}

const ParkResolved = memo((props: ParkResolvedProps) => {
  const { park } = props;

  // prefetch park reviews + visitors pages
  usePrefetchRoutesOnIdle(['parkReviews', 'parkVisitors']);

  return (
    <>
      <ParkHeader park={park} />
      <div className={styles.contentContainer}>
        <ParkTabs parkId={park.id} />
        <div className={styles.outletContainer}>
          <Outlet context={park} />
        </div>
      </div>
    </>
  );
});

export { ParkResolved };

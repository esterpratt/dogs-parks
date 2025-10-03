import { Outlet } from 'react-router-dom';
import { ParkHeader } from '../components/park/ParkHeader';
import { ParkTabs } from '../components/park/ParkTabs';
import { memo } from 'react';
import { Park } from '../types/park';
import { usePrefetchRoutesOnIdle } from '../hooks/usePrefetchRoutesOnIdle';
import { useAppLocale } from '../hooks/useAppLocale';
import { useParkWithTranslation } from '../hooks/api/useParkWithTranslation';
import { usePrefetchParkOtherLanguages } from '../hooks/api/usePrefetchParkOtherLanguages';
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

  // Prefetch park in other languages to enable fast locale switching
  usePrefetchParkOtherLanguages({ parkId: park.id, currentLanguage: language });

  // prefetch park reviews + visitors pages
  usePrefetchRoutesOnIdle(['parkReviews', 'parkVisitors']);

  const effectivePark = translatedPark || park;

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

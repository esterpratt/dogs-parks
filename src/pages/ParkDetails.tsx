import { lazy, Suspense } from 'react';
import { useOutletContext } from 'react-router-dom';
import { ParkGenerals } from '../components/park/ParkGenerals';
import { ParkGalleryContainer } from '../components/park/ParkGalleryContainer';
import { Park } from '../types/park';
import { ParkLive } from '../components/park/ParkLive';
import styles from './ParkDetails.module.scss';

const BusyHours = lazy(() => import('../components/park/BusyHours'));

const ParkDetails = () => {
  const park = useOutletContext() as Park;

  if (!park) {
    return null;
  }

  return (
    <div className={styles.container}>
      <ParkLive id={park.id} />
      <ParkGenerals park={park} />
      <Suspense fallback={null}>
        <BusyHours parkId={park.id} />
      </Suspense>
      <ParkGalleryContainer parkId={park.id} />
    </div>
  );
};

export default ParkDetails;

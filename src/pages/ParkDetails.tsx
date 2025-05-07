import { useOutletContext } from 'react-router-dom';
import { BusyHours } from '../components/park/BusyHours';
import { ParkGenerals } from '../components/park/ParkGenerals';
import { ParkGalleryContainer } from '../components/park/ParkGalleryContainer';
import styles from './ParkDetails.module.scss';
import { Park } from '../types/park';

export const ParkDetails = () => {
  const park = useOutletContext() as Park;

  if (!park) {
    return null;
  }

  return (
    <div className={styles.container}>
      <ParkGenerals park={park} />
      <BusyHours parkId={park.id} />
      <ParkGalleryContainer parkId={park.id} />
    </div>
  );
};

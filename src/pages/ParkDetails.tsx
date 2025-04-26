import { useOutletContext } from 'react-router';
import { BusyHours } from '../components/park/BusyHours';
import { Park } from '../types/park';
import { ParkGenerals } from '../components/park/ParkGenerals';
import { ParkGalleryContainer } from '../components/park/ParkGalleryContainer';
import styles from './ParkDetails.module.scss';

export const ParkDetails = () => {
  const park = useOutletContext<Park>();

  return (
    <div className={styles.container}>
      <ParkGenerals park={park} />
      <BusyHours parkId={park.id} />
      <ParkGalleryContainer parkId={park.id} />
    </div>
  );
};
